import { Env, Cipher, Folder, CipherType } from '../types';
import { StorageService } from '../services/storage';
import { errorResponse } from '../utils/response';
import { generateUUID } from '../utils/uuid';

// Bitwarden client import request format
interface CiphersImportRequest {
  ciphers: Array<{
    type: number;
    name: string;
    notes?: string | null;
    favorite?: boolean;
    reprompt?: number;
    login?: {
      uris?: Array<{ uri: string | null; match?: number | null }> | null;
      username?: string | null;
      password?: string | null;
      totp?: string | null;
    } | null;
    card?: {
      cardholderName?: string | null;
      brand?: string | null;
      number?: string | null;
      expMonth?: string | null;
      expYear?: string | null;
      code?: string | null;
    } | null;
    identity?: {
      title?: string | null;
      firstName?: string | null;
      middleName?: string | null;
      lastName?: string | null;
      address1?: string | null;
      address2?: string | null;
      address3?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
      company?: string | null;
      email?: string | null;
      phone?: string | null;
      ssn?: string | null;
      username?: string | null;
      passportNumber?: string | null;
      licenseNumber?: string | null;
    } | null;
    secureNote?: { type: number } | null;
    fields?: Array<{
      name?: string | null;
      value?: string | null;
      type: number;
      linkedId?: number | null;
    }> | null;
    passwordHistory?: Array<{
      password: string;
      lastUsedDate: string;
    }> | null;
  }>;
  folders: Array<{
    name: string;
  }>;
  folderRelationships: Array<{
    key: number;   // cipher index
    value: number; // folder index
  }>;
}

// POST /api/ciphers/import - Bitwarden client import endpoint
export async function handleCiphersImport(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);

  let importData: CiphersImportRequest;
  try {
    importData = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const folders = importData.folders || [];
  const ciphers = importData.ciphers || [];
  const folderRelationships = importData.folderRelationships || [];

  const now = new Date().toISOString();

  // Create folders and build index -> id mapping
  const folderIdMap = new Map<number, string>();
  
  for (let i = 0; i < folders.length; i++) {
    const folderId = generateUUID();
    folderIdMap.set(i, folderId);

    const folder: Folder = {
      id: folderId,
      userId: userId,
      name: folders[i].name,
      createdAt: now,
      updatedAt: now,
    };

    await storage.saveFolder(folder);
  }

  // Build cipher index -> folder id mapping from relationships
  const cipherFolderMap = new Map<number, string>();
  for (const rel of folderRelationships) {
    const folderId = folderIdMap.get(rel.value);
    if (folderId) {
      cipherFolderMap.set(rel.key, folderId);
    }
  }

  // Create ciphers
  for (let i = 0; i < ciphers.length; i++) {
    const c = ciphers[i];
    const folderId = cipherFolderMap.get(i) || null;

    const cipher: Cipher = {
      id: generateUUID(),
      userId: userId,
      type: c.type as CipherType,
      folderId: folderId,
      name: c.name || 'Untitled',
      notes: c.notes || null,
      favorite: c.favorite || false,
      login: c.login ? {
        username: c.login.username || null,
        password: c.login.password || null,
        uris: c.login.uris?.map(u => ({
          uri: u.uri || null,
          uriChecksum: null,
          match: u.match ?? null,
        })) || null,
        totp: c.login.totp || null,
        autofillOnPageLoad: null,
        fido2Credentials: null,
      } : null,
      card: c.card ? {
        cardholderName: c.card.cardholderName || null,
        brand: c.card.brand || null,
        number: c.card.number || null,
        expMonth: c.card.expMonth || null,
        expYear: c.card.expYear || null,
        code: c.card.code || null,
      } : null,
      identity: c.identity ? {
        title: c.identity.title || null,
        firstName: c.identity.firstName || null,
        middleName: c.identity.middleName || null,
        lastName: c.identity.lastName || null,
        address1: c.identity.address1 || null,
        address2: c.identity.address2 || null,
        address3: c.identity.address3 || null,
        city: c.identity.city || null,
        state: c.identity.state || null,
        postalCode: c.identity.postalCode || null,
        country: c.identity.country || null,
        company: c.identity.company || null,
        email: c.identity.email || null,
        phone: c.identity.phone || null,
        ssn: c.identity.ssn || null,
        username: c.identity.username || null,
        passportNumber: c.identity.passportNumber || null,
        licenseNumber: c.identity.licenseNumber || null,
      } : null,
      secureNote: c.secureNote || null,
      fields: c.fields?.map(f => ({
        name: f.name || null,
        value: f.value || null,
        type: f.type,
        linkedId: f.linkedId ?? null,
      })) || null,
      passwordHistory: c.passwordHistory || null,
      reprompt: c.reprompt || 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await storage.saveCipher(cipher);
  }

  // Update revision date
  await storage.updateRevisionDate(userId);

  return new Response(null, { status: 200 });
}
