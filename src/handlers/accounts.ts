import { Env, User, ProfileResponse } from '../types';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { jsonResponse, errorResponse } from '../utils/response';
import { generateUUID } from '../utils/uuid';

// POST /api/accounts/register (only used from setup page, not client)
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);

  // Check if already registered
  const isRegistered = await storage.isRegistered();
  if (isRegistered) {
    return errorResponse('Registration is closed', 403);
  }

  let body: {
    email?: string;
    name?: string;
    masterPasswordHash?: string;
    masterPasswordHint?: string;
    key?: string;
    kdf?: number;
    kdfIterations?: number;
    kdfMemory?: number;
    kdfParallelism?: number;
    keys?: {
      publicKey?: string;
      encryptedPrivateKey?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const email = body.email?.toLowerCase();
  const name = body.name || email;
  const masterPasswordHash = body.masterPasswordHash;
  const key = body.key;
  const privateKey = body.keys?.encryptedPrivateKey;
  const publicKey = body.keys?.publicKey;

  if (!email || !masterPasswordHash || !key) {
    return errorResponse('Email, masterPasswordHash, and key are required', 400);
  }

  if (!privateKey || !publicKey) {
    return errorResponse('Private key and public key are required', 400);
  }

  // Create user
  const user: User = {
    id: generateUUID(),
    email: email,
    name: name || email,
    masterPasswordHash: masterPasswordHash,
    key: key,
    privateKey: privateKey,
    publicKey: publicKey,
    kdfType: body.kdf ?? 0,
    kdfIterations: body.kdfIterations ?? 600000,
    kdfMemory: body.kdfMemory,
    kdfParallelism: body.kdfParallelism,
    securityStamp: generateUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await storage.saveUser(user);
  await storage.setRegistered();

  return jsonResponse({ success: true }, 200);
}

// GET /api/accounts/profile
export async function handleGetProfile(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const user = await storage.getUserById(userId);

  if (!user) {
    return errorResponse('User not found', 404);
  }

  const profile: ProfileResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: true,
    premium: true,
    premiumFromOrganization: false,
    usesKeyConnector: false,
    masterPasswordHint: null,
    culture: 'en-US',
    twoFactorEnabled: false,
    key: user.key,
    privateKey: user.privateKey,
    securityStamp: user.securityStamp || user.id,
    organizations: [],
    providers: [],
    providerOrganizations: [],
    forcePasswordReset: false,
    avatarColor: null,
    creationDate: user.createdAt,
    object: 'profile',
  };

  return jsonResponse(profile);
}

// PUT /api/accounts/profile
export async function handleUpdateProfile(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const user = await storage.getUserById(userId);

  if (!user) {
    return errorResponse('User not found', 404);
  }

  let body: { name?: string; masterPasswordHint?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (body.name) {
    user.name = body.name;
  }
  user.updatedAt = new Date().toISOString();

  await storage.saveUser(user);

  return handleGetProfile(request, env, userId);
}

// POST /api/accounts/keys
export async function handleSetKeys(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const user = await storage.getUserById(userId);

  if (!user) {
    return errorResponse('User not found', 404);
  }

  let body: {
    key?: string;
    encryptedPrivateKey?: string;
    publicKey?: string;
  };

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (body.key) user.key = body.key;
  if (body.encryptedPrivateKey) user.privateKey = body.encryptedPrivateKey;
  if (body.publicKey) user.publicKey = body.publicKey;
  user.updatedAt = new Date().toISOString();

  await storage.saveUser(user);

  return handleGetProfile(request, env, userId);
}

// GET /api/accounts/revision-date
export async function handleGetRevisionDate(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const revisionDate = await storage.getRevisionDate(userId);
  
  // Return as milliseconds timestamp (Bitwarden format)
  const timestamp = new Date(revisionDate).getTime();
  return jsonResponse(timestamp);
}

// POST /api/accounts/verify-password
export async function handleVerifyPassword(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const user = await storage.getUserById(userId);

  if (!user) {
    return errorResponse('User not found', 404);
  }

  let body: { masterPasswordHash?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (!body.masterPasswordHash) {
    return errorResponse('masterPasswordHash is required', 400);
  }

  if (body.masterPasswordHash !== user.masterPasswordHash) {
    return errorResponse('Invalid password', 400);
  }

  return new Response(null, { status: 200 });
}
