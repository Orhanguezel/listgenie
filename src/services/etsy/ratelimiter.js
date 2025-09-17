// ADVANCED RATE LIMITING WITH EXPONENTIAL BACKOFF (Aynı kod)
class EtsyRateLimiter {
  constructor() {
    this.requestTimes = [];
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.baseDelay = 2000;
    this.maxDelay = 30000;
    this.maxRequestsPerMinute = 20;
    this.retryAttempts = 3;
  }
  async waitForRateLimit(requestNumber = 0) {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest) + 1000;
      console.log(`⏱️  Rate limit reached. Waiting ${Math.round(waitTime/1000)}s...`);
      await this.sleep(waitTime);
    }
    let delay = this.baseDelay;
    if (this.failureCount > 0) {
      delay = Math.min(this.baseDelay * Math.pow(2, this.failureCount), this.maxDelay);
      console.log(`🕓 Exponential backoff: waiting ${delay/1000}s (failure count: ${this.failureCount})`);
    } else {
      const progressiveDelay = Math.min(this.baseDelay + (requestNumber * 200), 5000);
      delay = progressiveDelay;
    }
    const jitter = Math.random() * 1000;
    delay += jitter;
    console.log(`⏳ Rate limiting: waiting ${Math.round(delay/1000)}s before next request`);
    await this.sleep(delay);
    this.requestTimes.push(now);
  }
  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    console.log('✅ Request successful, failure count reset');
  }
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.log(`❌ Request failed, failure count: ${this.failureCount}`);
    if (this.failureCount >= 3) {
      this.baseDelay = Math.min(this.baseDelay * 1.5, 10000);
      console.log(`⚠️  Too many failures, increasing base delay to ${this.baseDelay/1000}s`);
    }
  }
  async sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}
const etsyRateLimiter = new EtsyRateLimiter();
async function advancedRateLimit(requestNumber = 0) {
  await etsyRateLimiter.waitForRateLimit(requestNumber);
}
module.exports = { EtsyRateLimiter, etsyRateLimiter, advancedRateLimit };
