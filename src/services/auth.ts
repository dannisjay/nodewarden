import { Env, JWTPayload, User } from '../types';
import { verifyJWT, createJWT, createRefreshToken } from '../utils/jwt';
import { StorageService } from './storage';

export class AuthService {
  private storage: StorageService;

  constructor(private env: Env) {
    this.storage = new StorageService(env.VAULT);
  }

  // Verify password hash (compare with stored hash)
  async verifyPassword(inputHash: string, storedHash: string): Promise<boolean> {
    // In Bitwarden, the client sends the password hash directly
    // We compare the hashes
    return inputHash === storedHash;
  }

  // Generate access token
  async generateAccessToken(user: User): Promise<string> {
    return createJWT(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        sstamp: user.securityStamp,
      },
      this.env.JWT_SECRET
    );
  }

  // Generate refresh token
  async generateRefreshToken(userId: string): Promise<string> {
    const token = createRefreshToken();
    await this.storage.saveRefreshToken(token, userId);
    return token;
  }

  // Verify access token from Authorization header
  async verifyAccessToken(authHeader: string | null): Promise<JWTPayload | null> {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    const payload = await verifyJWT(parts[1], this.env.JWT_SECRET);
    if (!payload) return null;

    // Verify security stamp - ensures token is invalidated after password change
    const user = await this.storage.getUserById(payload.sub);
    if (!user) return null;
    
    if (payload.sstamp !== user.securityStamp) {
      return null; // Token was issued before password change
    }

    return payload;
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: User } | null> {
    const userId = await this.storage.getRefreshTokenUserId(refreshToken);
    if (!userId) return null;

    const user = await this.storage.getUserById(userId);
    if (!user) return null;

    const accessToken = await this.generateAccessToken(user);
    return { accessToken, user };
  }
}
