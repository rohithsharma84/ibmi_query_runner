import crypto from 'crypto';

/**
 * Encrypt a string using AES-256-GCM
 * @param plaintext The text to encrypt
 * @param password The encryption key (will be hashed to 32 bytes)
 * @returns Object with encrypted data, iv, and authTag
 */
export const encryptAES256 = (plaintext: string, password: string) => {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  
  // Derive key from password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

/**
 * Decrypt a string using AES-256-GCM
 * @param encryptedData The encrypted data (base64)
 * @param iv The initialization vector (base64)
 * @param salt The salt used during encryption (base64)
 * @param authTag The authentication tag (base64)
 * @param password The encryption key
 * @returns The decrypted plaintext
 */
export const decryptAES256 = (
  encryptedData: string,
  iv: string,
  salt: string,
  authTag: string,
  password: string
): string => {
  const key = crypto.pbkdf2Sync(
    password,
    Buffer.from(salt, 'base64'),
    100000,
    32,
    'sha256'
  );
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  const decrypted =
    decipher.update(Buffer.from(encryptedData, 'base64'), undefined, 'utf8') +
    decipher.final('utf8');
  
  return decrypted;
};

/**
 * Hash a password using Argon2
 * Note: This will use the argon2 package - bcrypt is imported separately
 */
export const generateSecurePassword = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random JWT secret
 */
export const generateJWTSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Generate a random session secret
 */
export const generateSessionSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};
