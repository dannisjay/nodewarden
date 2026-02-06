import { Env, Cipher, CipherResponse, Attachment } from '../types';
import { StorageService } from '../services/storage';
import { jsonResponse, errorResponse } from '../utils/response';
import { generateUUID } from '../utils/uuid';
import { deleteAllAttachmentsForCipher } from './attachments';

// Format attachments for API response
function formatAttachments(attachments: Attachment[]): any[] | null {
  if (attachments.length === 0) return null;
  return attachments.map(a => ({
    id: a.id,
    fileName: a.fileName,
    size: String(a.size),
    sizeName: a.sizeName,
    key: a.key,
    object: 'attachment',
  }));
}

// Convert internal cipher to API response format
function cipherToResponse(cipher: Cipher, attachments: Attachment[] = []): CipherResponse {
  return {
    id: cipher.id,
    organizationId: null,
    folderId: cipher.folderId,
    type: cipher.type,
    name: cipher.name,
    notes: cipher.notes,
    favorite: cipher.favorite,
    login: cipher.login,
    card: cipher.card,
    identity: cipher.identity,
    secureNote: cipher.secureNote,
    fields: cipher.fields,
    passwordHistory: cipher.passwordHistory,
    reprompt: cipher.reprompt,
    organizationUseTotp: false,
    creationDate: cipher.createdAt,
    revisionDate: cipher.updatedAt,
    deletedDate: cipher.deletedAt,
    edit: true,
    viewPassword: true,
    permissions: {
      delete: true,
      restore: true,
      edit: true,
    },
    object: 'cipher',
    collectionIds: [],
    attachments: formatAttachments(attachments),
  };
}

// GET /api/ciphers
export async function handleGetCiphers(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const ciphers = await storage.getAllCiphers(userId);

  // Filter out soft-deleted ciphers unless specifically requested
  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get('deleted') === 'true';
  
  const filteredCiphers = includeDeleted 
    ? ciphers 
    : ciphers.filter(c => !c.deletedAt);

  // Get attachments for all ciphers
  const cipherResponses = [];
  for (const cipher of filteredCiphers) {
    const attachments = await storage.getAttachmentsByCipher(cipher.id);
    cipherResponses.push(cipherToResponse(cipher, attachments));
  }

  return jsonResponse({
    data: cipherResponses,
    object: 'list',
    continuationToken: null,
  });
}

// GET /api/ciphers/:id
export async function handleGetCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const cipher = await storage.getCipher(id);

  if (!cipher || cipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  const attachments = await storage.getAttachmentsByCipher(cipher.id);
  return jsonResponse(cipherToResponse(cipher, attachments));
}

// POST /api/ciphers
export async function handleCreateCipher(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  // Handle nested cipher object (from some clients)
  const cipherData = body.cipher || body;

  const now = new Date().toISOString();
  const cipher: Cipher = {
    id: generateUUID(),
    userId: userId,
    type: cipherData.type,
    folderId: cipherData.folderId || null,
    name: cipherData.name,
    notes: cipherData.notes || null,
    favorite: cipherData.favorite || false,
    login: cipherData.login || null,
    card: cipherData.card || null,
    identity: cipherData.identity || null,
    secureNote: cipherData.secureNote || null,
    fields: cipherData.fields || null,
    passwordHistory: cipherData.passwordHistory || null,
    reprompt: cipherData.reprompt || 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await storage.saveCipher(cipher);
  await storage.updateRevisionDate(userId);

  return jsonResponse(cipherToResponse(cipher), 200);
}

// PUT /api/ciphers/:id
export async function handleUpdateCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const existingCipher = await storage.getCipher(id);

  if (!existingCipher || existingCipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  // Handle nested cipher object
  const cipherData = body.cipher || body;

  const cipher: Cipher = {
    ...existingCipher,
    type: cipherData.type ?? existingCipher.type,
    folderId: cipherData.folderId !== undefined ? cipherData.folderId : existingCipher.folderId,
    name: cipherData.name ?? existingCipher.name,
    notes: cipherData.notes !== undefined ? cipherData.notes : existingCipher.notes,
    favorite: cipherData.favorite ?? existingCipher.favorite,
    login: cipherData.login !== undefined ? cipherData.login : existingCipher.login,
    card: cipherData.card !== undefined ? cipherData.card : existingCipher.card,
    identity: cipherData.identity !== undefined ? cipherData.identity : existingCipher.identity,
    secureNote: cipherData.secureNote !== undefined ? cipherData.secureNote : existingCipher.secureNote,
    fields: cipherData.fields !== undefined ? cipherData.fields : existingCipher.fields,
    passwordHistory: cipherData.passwordHistory !== undefined ? cipherData.passwordHistory : existingCipher.passwordHistory,
    reprompt: cipherData.reprompt ?? existingCipher.reprompt,
    updatedAt: new Date().toISOString(),
  };

  await storage.saveCipher(cipher);
  await storage.updateRevisionDate(userId);

  return jsonResponse(cipherToResponse(cipher));
}

// DELETE /api/ciphers/:id
export async function handleDeleteCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const cipher = await storage.getCipher(id);

  if (!cipher || cipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  // Soft delete
  cipher.deletedAt = new Date().toISOString();
  cipher.updatedAt = cipher.deletedAt;
  await storage.saveCipher(cipher);
  await storage.updateRevisionDate(userId);

  return jsonResponse(cipherToResponse(cipher));
}

// DELETE /api/ciphers/:id (permanent)
export async function handlePermanentDeleteCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const cipher = await storage.getCipher(id);

  if (!cipher || cipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  // Delete all attachments first
  await deleteAllAttachmentsForCipher(env, id);

  await storage.deleteCipher(id, userId);
  await storage.updateRevisionDate(userId);

  return new Response(null, { status: 204 });
}

// PUT /api/ciphers/:id/restore
export async function handleRestoreCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const cipher = await storage.getCipher(id);

  if (!cipher || cipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  cipher.deletedAt = null;
  cipher.updatedAt = new Date().toISOString();
  await storage.saveCipher(cipher);
  await storage.updateRevisionDate(userId);

  return jsonResponse(cipherToResponse(cipher));
}

// PUT /api/ciphers/:id/partial - Update only favorite/folderId
export async function handlePartialUpdateCipher(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const cipher = await storage.getCipher(id);

  if (!cipher || cipher.userId !== userId) {
    return errorResponse('Cipher not found', 404);
  }

  let body: { folderId?: string | null; favorite?: boolean };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (body.folderId !== undefined) {
    cipher.folderId = body.folderId;
  }
  if (body.favorite !== undefined) {
    cipher.favorite = body.favorite;
  }
  cipher.updatedAt = new Date().toISOString();

  await storage.saveCipher(cipher);
  await storage.updateRevisionDate(userId);

  return jsonResponse(cipherToResponse(cipher));
}

// POST/PUT /api/ciphers/move - Bulk move to folder
export async function handleBulkMoveCiphers(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);

  let body: { ids?: string[]; folderId?: string | null };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (!body.ids || !Array.isArray(body.ids)) {
    return errorResponse('ids array is required', 400);
  }

  await storage.bulkMoveCiphers(body.ids, body.folderId || null, userId);

  return new Response(null, { status: 204 });
}
