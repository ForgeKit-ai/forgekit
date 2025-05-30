import https from 'https';
import crypto from 'crypto';
import axios from 'axios';

/**
 * Secure HTTP client with certificate validation and integrity checking
 */
class SecureClient {
  constructor() {
    // Configure HTTPS agent with strict certificate validation
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: true, // Reject self-signed/invalid certificates
      checkServerIdentity: this.validateServerIdentity.bind(this),
      secureProtocol: 'TLSv1_2_method', // Force TLS 1.2+
    });

    // Create axios instance with security defaults
    this.client = axios.create({
      httpsAgent: this.httpsAgent,
      timeout: 30000, // 30 second timeout
      maxRedirects: 3, // Limit redirects
      validateStatus: (status) => status >= 200 && status < 400,
    });

    // Add request interceptor for additional security headers
    this.client.interceptors.request.use(this.addSecurityHeaders.bind(this));
    
    // Add response interceptor for integrity validation
    this.client.interceptors.response.use(
      this.validateResponse.bind(this),
      this.handleError.bind(this)
    );
  }

  /**
   * Validate server identity to prevent MITM attacks
   */
  validateServerIdentity(hostname, cert) {
    // Additional hostname validation
    const validForgeKitDomains = [
      'forgekit.ai',
      'api.forgekit.ai',
      'www.forgekit.ai'
    ];

    const isValidDomain = validForgeKitDomains.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!isValidDomain && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      throw new Error(`Invalid hostname: ${hostname}. Only ForgeKit domains are allowed.`);
    }

    // Check certificate validity period
    const now = new Date();
    const notBefore = new Date(cert.valid_from);
    const notAfter = new Date(cert.valid_to);

    if (now < notBefore || now > notAfter) {
      throw new Error(`Certificate expired or not yet valid for ${hostname}`);
    }

    // Verify certificate chain depth (prevent long chains)
    if (cert.issuerCertificate && this.getCertChainDepth(cert) > 5) {
      throw new Error('Certificate chain too long');
    }

    return undefined; // Valid
  }

  /**
   * Get certificate chain depth
   */
  getCertChainDepth(cert, depth = 0) {
    if (!cert.issuerCertificate || cert.issuerCertificate === cert) {
      return depth;
    }
    return this.getCertChainDepth(cert.issuerCertificate, depth + 1);
  }

  /**
   * Add security headers to requests
   */
  addSecurityHeaders(config) {
    // Add security headers
    config.headers = {
      ...config.headers,
      'User-Agent': 'ForgeKit-CLI/1.0.10',
      'X-Requested-With': 'ForgeKit-CLI',
      'Cache-Control': 'no-cache',
    };

    // Add timestamp for replay attack prevention
    config.headers['X-Request-Timestamp'] = Date.now().toString();

    return config;
  }

  /**
   * Validate response integrity
   */
  validateResponse(response) {
    // Validate response structure
    if (!response || !response.data) {
      throw new Error('Invalid response structure');
    }

    // Check for security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    // Log missing security headers (warning only)
    securityHeaders.forEach(header => {
      if (!response.headers[header]) {
        console.warn(`Warning: Missing security header: ${header}`);
      }
    });

    // Validate content type for JSON responses
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      try {
        // Ensure response can be parsed as JSON
        if (typeof response.data === 'string') {
          JSON.parse(response.data);
        }
      } catch (error) {
        throw new Error('Invalid JSON response format');
      }
    }

    // Check response size limits (prevent DoS)
    const contentLength = response.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Response too large');
    }

    // Validate deployment response format
    if (response.config.url && response.config.url.includes('/deploy')) {
      this.validateDeploymentResponse(response.data);
    }

    return response;
  }

  /**
   * Validate deployment response format and integrity
   */
  validateDeploymentResponse(data) {
    if (!data) {
      throw new Error('Empty deployment response');
    }

    // Check for required fields in deployment response
    const requiredFields = ['url'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field in deployment response: ${field}`);
      }
    }

    // Validate URL format
    if (data.url) {
      try {
        const url = new URL(data.url);
        if (!url.protocol.startsWith('https') && !url.hostname.includes('localhost')) {
          throw new Error('Deployment URL must use HTTPS');
        }
      } catch (error) {
        throw new Error(`Invalid deployment URL format: ${error.message}`);
      }
    }

    // Check for suspicious response patterns
    const responseStr = JSON.stringify(data);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(responseStr)) {
        throw new Error('Suspicious content detected in response');
      }
    }
  }

  /**
   * Handle errors with additional security checks
   */
  handleError(error) {
    // Log security-relevant errors
    if (error.code === 'CERT_REJECTED' || 
        error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('🔒 Certificate validation failed:', error.message);
      console.error('This could indicate a man-in-the-middle attack. Connection rejected.');
    }

    // Don't expose internal error details
    if (error.response && error.response.status >= 500) {
      throw new Error('Server error occurred. Please try again later.');
    }

    throw error;
  }

  /**
   * Create integrity hash for request body
   */
  createIntegrityHash(data) {
    if (!data) return null;
    
    const hash = crypto.createHash('sha256');
    if (typeof data === 'string') {
      hash.update(data);
    } else if (Buffer.isBuffer(data)) {
      hash.update(data);
    } else {
      hash.update(JSON.stringify(data));
    }
    
    return 'sha256-' + hash.digest('base64');
  }

  /**
   * Secure POST request with integrity checking
   */
  async post(url, data, config = {}) {
    // Add integrity hash for request body
    if (data && !config.headers?.['content-type']?.includes('multipart/form-data')) {
      const integrity = this.createIntegrityHash(data);
      config.headers = {
        ...config.headers,
        'X-Content-Integrity': integrity
      };
    }

    return this.client.post(url, data, config);
  }

  /**
   * Secure GET request
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * Secure DELETE request
   */
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  /**
   * Secure PUT request
   */
  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }
}

// Export singleton instance
export const secureClient = new SecureClient();

// Legacy exports for backward compatibility
export default secureClient;