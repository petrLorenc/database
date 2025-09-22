const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Data Protection Utility
 * Encodes/encrypts JSON data to make it harder to copy-paste
 */

function unprotectData(protectedString) {
  try {
    const parsed = JSON.parse(protectedString);
    
    // Handle version 2 (UTF-8 safe) or default to version 2
    if (parsed.v === 2 || !parsed.v) {
      const base64First = Buffer.from(parsed.d, 'base64').toString('utf8');
      const originalJson = Buffer.from(base64First, 'base64').toString('utf8');
      
      // Verify checksum
      const checksum = Buffer.from(originalJson).reduce((sum, byte) => sum + byte, 0) % 1000000;
      if (checksum !== parsed.c) {
        throw new Error('Data integrity check failed');
      }
      
      return JSON.parse(originalJson);
    }
    
    // Handle legacy version 1 (with character manipulation)
    if (parsed.v === 1) {
      const base64First = Buffer.from(parsed.d, 'base64').toString('utf8');
      const manipulated = Buffer.from(base64First, 'base64').toString('utf8');
      
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

module.exports = {
  unprotectData,
};