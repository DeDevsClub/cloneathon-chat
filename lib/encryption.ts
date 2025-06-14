/**
 * Utility functions for encrypting and decrypting sensitive data
 * using the Web Crypto API
 */

// Generate a random encryption key if one doesn't exist
async function getEncryptionKey(): Promise<CryptoKey> {
  // Use a consistent salt for deriving the key
  const salt = new TextEncoder().encode('openai-api-key-manager-salt');

  // Create a device-specific key based on browser fingerprinting
  // This is a simplified approach - in production you might want more sophisticated fingerprinting
  const deviceInfo = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
  ].join('|');

  // Convert device info to bytes
  const deviceBytes = new TextEncoder().encode(deviceInfo);

  // Derive a key using PBKDF2
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    deviceBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  // Derive the actual encryption key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a string using AES-GCM encryption
 * @param data The string to encrypt
 * @returns A base64-encoded encrypted string
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData,
    );

    // Combine the IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a previously encrypted string
 * @param encryptedData The base64-encoded encrypted string
 * @returns The decrypted string
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Convert from base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Extract the IV (first 12 bytes)
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data,
    );

    // Convert the decrypted data back to a string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
