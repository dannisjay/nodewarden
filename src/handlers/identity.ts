import { Env, TokenResponse } from '../types';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { RateLimitService } from '../services/ratelimit';
import { jsonResponse, errorResponse, identityErrorResponse } from '../utils/response';

// POST /identity/connect/token
export async function handleToken(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const auth = new AuthService(env);
  const rateLimit = new RateLimitService(env.VAULT);

  let body: Record<string, string>;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  } else {
    body = await request.json();
  }

  const grantType = body.grant_type;

  if (grantType === 'password') {
    // Login with password
    const email = body.username?.toLowerCase();
    const passwordHash = body.password;

    if (!email || !passwordHash) {
      return errorResponse('Email and password are required', 400);
    }

    // Check if login is rate limited
    const loginCheck = await rateLimit.checkLoginAttempt(email);
    if (!loginCheck.allowed) {
      return errorResponse(
        `Too many failed login attempts. Try again in ${Math.ceil(loginCheck.retryAfterSeconds! / 60)} minutes.`,
        429
      );
    }

    const user = await storage.getUser(email);
    if (!user) {
      // Record failed attempt even for non-existent user (prevent enumeration)
      await rateLimit.recordFailedLogin(email);
      return identityErrorResponse('Username or password is incorrect. Try again', 'invalid_grant', 400);
    }

    const valid = await auth.verifyPassword(passwordHash, user.masterPasswordHash);
    if (!valid) {
      // Record failed login attempt
      const result = await rateLimit.recordFailedLogin(email);
      if (result.locked) {
        return identityErrorResponse(
          `Too many failed login attempts. Account locked for ${Math.ceil(result.retryAfterSeconds! / 60)} minutes.`,
          'TooManyRequests',
          429
        );
      }
      return identityErrorResponse('Username or password is incorrect. Try again', 'invalid_grant', 400);
    }

    // Successful login - clear failed attempts
    await rateLimit.clearLoginAttempts(email);

    const accessToken = await auth.generateAccessToken(user);
    const refreshToken = await auth.generateRefreshToken(user.id);

    const response: TokenResponse = {
      access_token: accessToken,
      expires_in: 7200,
      token_type: 'Bearer',
      refresh_token: refreshToken,
      Key: user.key,
      PrivateKey: user.privateKey,
      Kdf: user.kdfType,
      KdfIterations: user.kdfIterations,
      KdfMemory: user.kdfMemory,
      KdfParallelism: user.kdfParallelism,
      ForcePasswordReset: false,
      ResetMasterPassword: false,
      scope: 'api offline_access',
      unofficialServer: true,
      UserDecryptionOptions: {
        HasMasterPassword: true,
        Object: 'userDecryptionOptions',
        MasterPasswordUnlock: {
          Kdf: {
            KdfType: user.kdfType,
            Iterations: user.kdfIterations,
            Memory: user.kdfMemory || null,
            Parallelism: user.kdfParallelism || null,
          },
          MasterKeyEncryptedUserKey: user.key,
          Salt: email, // email is already lowercased above
        },
      },
    };

    return jsonResponse(response);

  } else if (grantType === 'refresh_token') {
    // Refresh token
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400);
    }

    const result = await auth.refreshAccessToken(refreshToken);
    if (!result) {
      return errorResponse('Invalid refresh token', 401);
    }

    // Revoke old refresh token (prevent reuse)
    await storage.deleteRefreshToken(refreshToken);

    const { accessToken, user } = result;
    const newRefreshToken = await auth.generateRefreshToken(user.id);

    const response: TokenResponse = {
      access_token: accessToken,
      expires_in: 7200,
      token_type: 'Bearer',
      refresh_token: newRefreshToken,
      Key: user.key,
      PrivateKey: user.privateKey,
      Kdf: user.kdfType,
      KdfIterations: user.kdfIterations,
      KdfMemory: user.kdfMemory,
      KdfParallelism: user.kdfParallelism,
      ForcePasswordReset: false,
      ResetMasterPassword: false,
      scope: 'api offline_access',
      unofficialServer: true,
      UserDecryptionOptions: {
        HasMasterPassword: true,
        Object: 'userDecryptionOptions',
      },
    };

    return jsonResponse(response);
  }

  return errorResponse('Unsupported grant type', 400);
}

// POST /identity/accounts/prelogin
export async function handlePrelogin(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const email = body.email?.toLowerCase();
  if (!email) {
    return errorResponse('Email is required', 400);
  }

  const user = await storage.getUser(email);

  // Return default KDF settings even if user doesn't exist (to prevent user enumeration)
  const kdfType = user?.kdfType ?? 0;
  const kdfIterations = user?.kdfIterations ?? 600000;
  const kdfMemory = user?.kdfMemory;
  const kdfParallelism = user?.kdfParallelism;

  return jsonResponse({
    kdf: kdfType,
    kdfIterations: kdfIterations,
    kdfMemory: kdfMemory,
    kdfParallelism: kdfParallelism,
  });
}
