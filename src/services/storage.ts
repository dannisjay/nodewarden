import { Env, User, Cipher, Folder, Attachment } from '../types';

const KEYS = {
  CONFIG_REGISTERED: 'config:registered',
  CONFIG_SETUP_DISABLED: 'config:setup_disabled',
  USER_PREFIX: 'user:',
  CIPHER_PREFIX: 'cipher:',
  FOLDER_PREFIX: 'folder:',
  ATTACHMENT_PREFIX: 'attachment:',
  CIPHERS_INDEX: 'index:ciphers',
  FOLDERS_INDEX: 'index:folders',
  ATTACHMENTS_INDEX: 'index:attachments',
  REFRESH_TOKEN_PREFIX: 'refresh:',
  REVISION_DATE_PREFIX: 'revision:',
};

export class StorageService {
  constructor(private kv: KVNamespace) {}

  // Registration status
  async isRegistered(): Promise<boolean> {
    const value = await this.kv.get(KEYS.CONFIG_REGISTERED);
    return value === 'true';
  }

  async setRegistered(): Promise<void> {
    await this.kv.put(KEYS.CONFIG_REGISTERED, 'true');
  }

  // Setup page visibility
  async isSetupDisabled(): Promise<boolean> {
    const value = await this.kv.get(KEYS.CONFIG_SETUP_DISABLED);
    return value === 'true';
  }

  async setSetupDisabled(): Promise<void> {
    await this.kv.put(KEYS.CONFIG_SETUP_DISABLED, 'true');
  }

  // User operations
  async getUser(email: string): Promise<User | null> {
    const data = await this.kv.get(`${KEYS.USER_PREFIX}${email.toLowerCase()}`);
    return data ? JSON.parse(data) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    // Get user email from id mapping
    const email = await this.kv.get(`userid:${id}`);
    if (!email) return null;
    return this.getUser(email);
  }

  async saveUser(user: User): Promise<void> {
    await this.kv.put(`${KEYS.USER_PREFIX}${user.email.toLowerCase()}`, JSON.stringify(user));
    await this.kv.put(`userid:${user.id}`, user.email.toLowerCase());
  }

  // Cipher operations
  async getCipher(id: string): Promise<Cipher | null> {
    const data = await this.kv.get(`${KEYS.CIPHER_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  }

  async saveCipher(cipher: Cipher): Promise<void> {
    await this.kv.put(`${KEYS.CIPHER_PREFIX}${cipher.id}`, JSON.stringify(cipher));
    
    // Update index
    const index = await this.getCipherIds(cipher.userId);
    if (!index.includes(cipher.id)) {
      index.push(cipher.id);
      await this.kv.put(`${KEYS.CIPHERS_INDEX}:${cipher.userId}`, JSON.stringify(index));
    }
  }

  async deleteCipher(id: string, userId: string): Promise<void> {
    await this.kv.delete(`${KEYS.CIPHER_PREFIX}${id}`);
    
    // Update index
    const index = await this.getCipherIds(userId);
    const newIndex = index.filter(cid => cid !== id);
    await this.kv.put(`${KEYS.CIPHERS_INDEX}:${userId}`, JSON.stringify(newIndex));
  }

  async getCipherIds(userId: string): Promise<string[]> {
    const data = await this.kv.get(`${KEYS.CIPHERS_INDEX}:${userId}`);
    return data ? JSON.parse(data) : [];
  }

  async getAllCiphers(userId: string): Promise<Cipher[]> {
    const ids = await this.getCipherIds(userId);
    const ciphers: Cipher[] = [];
    
    for (const id of ids) {
      const cipher = await this.getCipher(id);
      if (cipher) ciphers.push(cipher);
    }
    
    return ciphers;
  }

  // Folder operations
  async getFolder(id: string): Promise<Folder | null> {
    const data = await this.kv.get(`${KEYS.FOLDER_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  }

  async saveFolder(folder: Folder): Promise<void> {
    await this.kv.put(`${KEYS.FOLDER_PREFIX}${folder.id}`, JSON.stringify(folder));
    
    // Update index
    const index = await this.getFolderIds(folder.userId);
    if (!index.includes(folder.id)) {
      index.push(folder.id);
      await this.kv.put(`${KEYS.FOLDERS_INDEX}:${folder.userId}`, JSON.stringify(index));
    }
  }

  async deleteFolder(id: string, userId: string): Promise<void> {
    await this.kv.delete(`${KEYS.FOLDER_PREFIX}${id}`);
    
    // Update index
    const index = await this.getFolderIds(userId);
    const newIndex = index.filter(fid => fid !== id);
    await this.kv.put(`${KEYS.FOLDERS_INDEX}:${userId}`, JSON.stringify(newIndex));
  }

  async getFolderIds(userId: string): Promise<string[]> {
    const data = await this.kv.get(`${KEYS.FOLDERS_INDEX}:${userId}`);
    return data ? JSON.parse(data) : [];
  }

  async getAllFolders(userId: string): Promise<Folder[]> {
    const ids = await this.getFolderIds(userId);
    const folders: Folder[] = [];
    
    for (const id of ids) {
      const folder = await this.getFolder(id);
      if (folder) folders.push(folder);
    }
    
    return folders;
  }

  // Refresh token operations
  async saveRefreshToken(token: string, userId: string): Promise<void> {
    // Store refresh token with 30 day expiry
    await this.kv.put(`${KEYS.REFRESH_TOKEN_PREFIX}${token}`, userId, {
      expirationTtl: 30 * 24 * 60 * 60,
    });
  }

  async getRefreshTokenUserId(token: string): Promise<string | null> {
    return await this.kv.get(`${KEYS.REFRESH_TOKEN_PREFIX}${token}`);
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.kv.delete(`${KEYS.REFRESH_TOKEN_PREFIX}${token}`);
  }

  // Revision date operations (for incremental sync)
  async getRevisionDate(userId: string): Promise<string> {
    const date = await this.kv.get(`${KEYS.REVISION_DATE_PREFIX}${userId}`);
    return date || new Date().toISOString();
  }

  async updateRevisionDate(userId: string): Promise<string> {
    const date = new Date().toISOString();
    await this.kv.put(`${KEYS.REVISION_DATE_PREFIX}${userId}`, date);
    return date;
  }

  // Bulk cipher operations
  async getCiphersByIds(ids: string[], userId: string): Promise<Cipher[]> {
    const ciphers: Cipher[] = [];
    for (const id of ids) {
      const cipher = await this.getCipher(id);
      if (cipher && cipher.userId === userId) {
        ciphers.push(cipher);
      }
    }
    return ciphers;
  }

  async bulkMoveCiphers(ids: string[], folderId: string | null, userId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const id of ids) {
      const cipher = await this.getCipher(id);
      if (cipher && cipher.userId === userId) {
        cipher.folderId = folderId;
        cipher.updatedAt = now;
        await this.saveCipher(cipher);
      }
    }
    await this.updateRevisionDate(userId);
  }

  // Attachment operations
  async getAttachment(id: string): Promise<Attachment | null> {
    const data = await this.kv.get(`${KEYS.ATTACHMENT_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  }

  async saveAttachment(attachment: Attachment): Promise<void> {
    await this.kv.put(`${KEYS.ATTACHMENT_PREFIX}${attachment.id}`, JSON.stringify(attachment));
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.kv.delete(`${KEYS.ATTACHMENT_PREFIX}${id}`);
  }

  async getAttachmentIdsByCipher(cipherId: string): Promise<string[]> {
    const data = await this.kv.get(`${KEYS.ATTACHMENTS_INDEX}:${cipherId}`);
    return data ? JSON.parse(data) : [];
  }

  async getAttachmentsByCipher(cipherId: string): Promise<Attachment[]> {
    const ids = await this.getAttachmentIdsByCipher(cipherId);
    const attachments: Attachment[] = [];
    for (const id of ids) {
      const attachment = await this.getAttachment(id);
      if (attachment) attachments.push(attachment);
    }
    return attachments;
  }

  async addAttachmentToCipher(cipherId: string, attachmentId: string): Promise<void> {
    const ids = await this.getAttachmentIdsByCipher(cipherId);
    if (!ids.includes(attachmentId)) {
      ids.push(attachmentId);
      await this.kv.put(`${KEYS.ATTACHMENTS_INDEX}:${cipherId}`, JSON.stringify(ids));
    }
  }

  async removeAttachmentFromCipher(cipherId: string, attachmentId: string): Promise<void> {
    const ids = await this.getAttachmentIdsByCipher(cipherId);
    const newIds = ids.filter(id => id !== attachmentId);
    await this.kv.put(`${KEYS.ATTACHMENTS_INDEX}:${cipherId}`, JSON.stringify(newIds));
  }

  async deleteAllAttachmentsByCipher(cipherId: string): Promise<void> {
    const ids = await this.getAttachmentIdsByCipher(cipherId);
    for (const id of ids) {
      await this.deleteAttachment(id);
    }
    await this.kv.delete(`${KEYS.ATTACHMENTS_INDEX}:${cipherId}`);
  }

  async updateCipherRevisionDate(cipherId: string): Promise<void> {
    const cipher = await this.getCipher(cipherId);
    if (cipher) {
      cipher.updatedAt = new Date().toISOString();
      await this.saveCipher(cipher);
      await this.updateRevisionDate(cipher.userId);
    }
  }
}
