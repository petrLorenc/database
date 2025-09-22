/**
 * Frontend Data Protection Utility
 * Handles decoding of protected data in the browser
 */

// UTF-8 safe Base64 decode function (browser compatible)
function base64ToUtf8(str) {
  try {
    // Use TextDecoder for proper UTF-8 handling
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    throw new Error('UTF-8 Base64 decode failed: ' + error.message);
  }
}

// Alternative fallback for older browsers
function base64ToUtf8Fallback(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (error) {
    throw new Error('Base64 decode fallback failed: ' + error.message);
  }
}

// Main data unprotection function for browser use
export function unprotectData(protectedString) {
  try {
    const parsed = JSON.parse(protectedString);
    
    // Handle version 2 (UTF-8 safe) or default to version 2
    if (parsed.v === 2 || !parsed.v) {
      // Use UTF-8 safe decoding
      let base64First, originalJson;
      
      try {
        base64First = base64ToUtf8(parsed.d);
        originalJson = base64ToUtf8(base64First);
      } catch (error) {
        // Fallback for older browsers
        console.warn('Using fallback UTF-8 decoding');
        base64First = base64ToUtf8Fallback(parsed.d);
        originalJson = base64ToUtf8Fallback(base64First);
      }
      
      // Verify checksum using UTF-8 byte calculation
      const encoder = new TextEncoder();
      const bytes = encoder.encode(originalJson);
      const checksum = Array.from(bytes).reduce((sum, byte) => sum + byte, 0) % 1000000;
      
      if (checksum !== parsed.c) {
        throw new Error('Data integrity check failed');
      }
      
      return JSON.parse(originalJson);
    }
    
    // Handle legacy version 1 (with character manipulation)
    if (parsed.v === 1) {
      let base64First, manipulated;
      
      try {
        base64First = base64ToUtf8(parsed.d);
        manipulated = base64ToUtf8(base64First);
      } catch (error) {
        // Fallback for older browsers
        console.warn('Using fallback UTF-8 decoding for legacy version');
        base64First = base64ToUtf8Fallback(parsed.d);
        manipulated = base64ToUtf8Fallback(base64First);
      }
      
      // Reverse character manipulation
      const original = manipulated.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          return String.fromCharCode(((code - 32 - 13 + 95) % 95) + 32);
        }
        return char;
      }).join('');
      
      // Verify checksum using character codes (legacy method)
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