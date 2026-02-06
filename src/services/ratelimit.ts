import { Env } from '../types';

// Rate limit configuration
const CONFIG = {
  // Login attempt limits
  LOGIN_MAX_ATTEMPTS: 5,           // Max failed login attempts
  LOGIN_LOCKOUT_MINUTES: 15,       // Lockout duration after max attempts
  
  // API rate limits (per minute)
  API_REQUESTS_PER_MINUTE: 60,     // General API rate limit
  API_WINDOW_SECONDS: 60,          // Rate limit window
};

// KV key prefixes
const KEYS = {
  LOGIN_ATTEMPTS: 'ratelimit:login:',
  API_RATE: 'ratelimit:api:',
};

export class RateLimitService {
  constructor(private kv: KVNamespace) {}

  /**
   * Check and record login attempt
   * Returns { allowed: boolean, remainingAttempts: number, retryAfterSeconds?: number }
   */
  async checkLoginAttempt(email: string): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    retryAfterSeconds?: number;
  }> {
    const key = `${KEYS.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
    const data = await this.kv.get(key);
    
    if (!data) {
      return { allowed: true, remainingAttempts: CONFIG.LOGIN_MAX_ATTEMPTS };
    }

    const record: { attempts: number; lockedUntil?: number } = JSON.parse(data);
    const now = Date.now();

    // Check if currently locked out
    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds,
      };
    }

    // If lockout expired, reset
    if (record.lockedUntil && record.lockedUntil <= now) {
      await this.kv.delete(key);
      return { allowed: true, remainingAttempts: CONFIG.LOGIN_MAX_ATTEMPTS };
    }

    const remainingAttempts = CONFIG.LOGIN_MAX_ATTEMPTS - record.attempts;
    return { allowed: true, remainingAttempts };
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedLogin(email: string): Promise<{
    locked: boolean;
    retryAfterSeconds?: number;
  }> {
    const key = `${KEYS.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
    const data = await this.kv.get(key);
    
    let record: { attempts: number; lockedUntil?: number };
    
    if (data) {
      record = JSON.parse(data);
      record.attempts += 1;
    } else {
      record = { attempts: 1 };
    }

    // Check if should lock out
    if (record.attempts >= CONFIG.LOGIN_MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + CONFIG.LOGIN_LOCKOUT_MINUTES * 60 * 1000;
      await this.kv.put(key, JSON.stringify(record), {
        expirationTtl: CONFIG.LOGIN_LOCKOUT_MINUTES * 60 + 60, // Extra minute buffer
      });
      return {
        locked: true,
        retryAfterSeconds: CONFIG.LOGIN_LOCKOUT_MINUTES * 60,
      };
    }

    // Store with expiration (auto-reset after lockout period even without lockout)
    await this.kv.put(key, JSON.stringify(record), {
      expirationTtl: CONFIG.LOGIN_LOCKOUT_MINUTES * 60,
    });

    return { locked: false };
  }

  /**
   * Clear login attempts on successful login
   */
  async clearLoginAttempts(email: string): Promise<void> {
    const key = `${KEYS.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
    await this.kv.delete(key);
  }

  /**
   * Check API rate limit for a user or IP
   * Returns { allowed: boolean, remaining: number, retryAfterSeconds?: number }
   */
  async checkApiRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds?: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % CONFIG.API_WINDOW_SECONDS);
    const key = `${KEYS.API_RATE}${identifier}:${windowStart}`;

    const countStr = await this.kv.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    if (count >= CONFIG.API_REQUESTS_PER_MINUTE) {
      const retryAfterSeconds = CONFIG.API_WINDOW_SECONDS - (now % CONFIG.API_WINDOW_SECONDS);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      remaining: CONFIG.API_REQUESTS_PER_MINUTE - count,
    };
  }

  /**
   * Increment API request count
   */
  async incrementApiCount(identifier: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % CONFIG.API_WINDOW_SECONDS);
    const key = `${KEYS.API_RATE}${identifier}:${windowStart}`;

    const countStr = await this.kv.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    await this.kv.put(key, (count + 1).toString(), {
      expirationTtl: CONFIG.API_WINDOW_SECONDS + 10, // Slight buffer
    });
  }
}

/**
 * Get client identifier from request (IP or CF-Connecting-IP)
 */
export function getClientIdentifier(request: Request): string {
  // Cloudflare provides the real client IP
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Fallback for local development
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // Last resort
  return 'unknown';
}
