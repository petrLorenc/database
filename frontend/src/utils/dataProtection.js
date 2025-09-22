/**
 * Frontend Data Protection Utility
 * Handles decoding of protected data in the browser
 */

// Base64 decode function (browser compatible)
function base64Decode(str) {
  try {
    return atob(str);
  } catch (error) {
    throw new Error('Base64 decode failed');
  }
}

// Main data unprotection function for browser use
export function unprotectData(protectedString) {
  try {
    const parsed = JSON.parse(protectedString);
    
    // Handle version 2 (UTF-8 safe) or default to version 2
    if (parsed.v === 2 || !parsed.v) {
      const base64First = atob(parsed.d);
      const originalJson = atob(base64First);
      
      // Verify checksum (simplified for browser)
      const checksum = Array.from(originalJson).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000000;
      if (checksum !== parsed.c) {
        throw new Error('Data integrity check failed');
      }
      
      return JSON.parse(originalJson);
    }
    
    // Handle legacy version 1 (with character manipulation)
    if (parsed.v === 1) {
      const base64First = atob(parsed.d);
      const manipulated = atob(base64First);
      
      // Reverse character manipulation
      const original = manipulated.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          return String.fromCharCode(((code - 32 - 13 + 95) % 95) + 32);
        }
        return char;
      }).join('');
      
      // Verify checksum
      const checksum = original.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000000;
      if (checksum !== parsed.c) {
        throw new Error('Data integrity check failed');
      }
      
      return JSON.parse(original);
    }
    
    throw new Error('Unsupported protection version');
  } catch (error) {
    console.error('Error unprotecting data:', error);
    throw error;
  }
}