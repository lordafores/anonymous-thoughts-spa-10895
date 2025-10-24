// Simple encryption/decryption for production data
// Note: This is a basic implementation. For higher security, consider using a more robust solution.

const ENCRYPTION_KEY = 'LOVISEC_2025_SECURE_KEY_V1';

// Simple XOR-based encryption
export const encryptData = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // Base64 encode
};

export const decryptData = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};
