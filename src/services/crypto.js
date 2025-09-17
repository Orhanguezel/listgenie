// SECURE encryption for API keys using AES-256-GCM (Aynı kod)
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function getEncryptionKey() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for secure data encryption');
  }
  return crypto.scryptSync(process.env.ENCRYPTION_KEY, 'listsgenie-salt', 32);
}
function encrypt(text) {
  if (!text) return null;
  try {
    const secretKey = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    throw new Error('Failed to encrypt sensitive data');
  }
}
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const secretKey = getEncryptionKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('❌ Decryption failed:', error.message);
    throw new Error('Failed to decrypt sensitive data');
  }
}
module.exports = { encrypt, decrypt, getEncryptionKey };
