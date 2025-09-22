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

    throw new Error('Unsupported protection version');
  } catch (error) {
    console.error('Error unprotecting data:', error);
    throw error;
  }
}

module.exports = {
  unprotectData,
};