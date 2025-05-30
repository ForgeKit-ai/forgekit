const generateDockerfile = (stack, envVars = []) => {
  // Normalize stack name (e.g., "nextjs + supabase" becomes "nextjs")
  const primaryStack = stack.split(' + ')[0].toLowerCase();

  const envSection = envVars.length
    ? envVars.map(v => `ARG ${v}\nENV ${v}=$${v}`).join('\n')
    : '';

  const inject = content => {
    if (!envSection) return content;
    const out = [];
    for (const line of content.split('\n')) {
      out.push(line);
      if (line.startsWith('FROM ')) {
        out.push(envSection);
      }
    }
    return out.join('\n');
  };

  switch (primaryStack) {
    case 'nextjs':
      return inject(`FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`);

    case 'react-vite':
    case 'vue-vite':
    case 'astro':
    case 'blazor':
    case 'godot':
      return inject(`FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
RUN echo "npx serve -s dist" > start.sh && chmod +x start.sh
EXPOSE 3000
CMD ["sh", "start.sh"]`);

    case 'sveltekit':
      return inject(`FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]`);

    case 'express':
      return inject(`FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]`);

    case 'fastapi':
    case 'flask':
      return inject(`FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 8000
CMD ["python", "main.py"]`);

    case 'django':
      return inject(`FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`);

    case 'gofiber':
      return inject(`FROM golang:1.20-alpine
WORKDIR /app
COPY . .
RUN go build -o app
EXPOSE 3000
CMD ["./app"]`);

    case 'rails':
      return inject(`FROM ruby:3.2
WORKDIR /app
COPY . .
RUN bundle install
EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]`);

    case 'spring-boot':
      return inject(`FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]`);

    default:
      // Consider throwing an error or returning a generic Dockerfile / null
      console.warn(`Unsupported stack for Dockerfile generation: ${primaryStack}`);
      return null;
  }
};

export { generateDockerfile };

