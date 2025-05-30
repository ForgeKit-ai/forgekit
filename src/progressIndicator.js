/**
 * Simple progress indicator for CLI operations
 */
class ProgressIndicator {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.steps = [];
    this.startTime = null;
  }

  setSteps(steps) {
    this.steps = steps;
    this.totalSteps = steps.length;
    this.currentStep = 0;
    this.startTime = Date.now();
  }

  startStep(stepIndex) {
    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];
    if (!step) return;

    const progress = `[${stepIndex + 1}/${this.totalSteps}]`;
    console.log(`${progress} ${step.icon} ${step.message}...`);
    
    if (this.verbose && step.details) {
      console.log(`   ${step.details}`);
    }
  }

  updateStep(message) {
    if (this.verbose) {
      console.log(`   ${message}`);
    }
  }

  completeStep(stepIndex, message = null) {
    const step = this.steps[stepIndex];
    if (!step) return;

    const progress = `[${stepIndex + 1}/${this.totalSteps}]`;
    const completedMessage = message || step.message;
    console.log(`${progress} ✅ ${completedMessage} completed`);
  }

  failStep(stepIndex, error) {
    const step = this.steps[stepIndex];
    if (!step) return;

    const progress = `[${stepIndex + 1}/${this.totalSteps}]`;
    console.log(`${progress} ❌ ${step.message} failed: ${error}`);
  }

  complete() {
    const elapsed = Date.now() - this.startTime;
    const seconds = (elapsed / 1000).toFixed(1);
    console.log(`\n🎉 Deployment completed successfully in ${seconds}s`);
  }

  logVerbose(message) {
    if (this.verbose) {
      console.log(`   🔍 ${message}`);
    }
  }

  logInfo(message) {
    console.log(`   ℹ️  ${message}`);
  }

  logWarning(message) {
    console.log(`   ⚠️  ${message}`);
  }

  logError(message) {
    console.log(`   ❌ ${message}`);
  }
}

export { ProgressIndicator };