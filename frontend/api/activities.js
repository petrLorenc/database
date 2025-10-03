import { put, head, del } from '@vercel/blob';

// Simple in-memory store for blob URLs (in production, you'd use a database)
let activitiesUrl = null;
let protectedActivitiesUrl = null;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Data protection function (simplified version for API use)
function protectData(data) {
  try {
    const jsonString = JSON.stringify(data);
    
    // UTF-8 safe approach: use only Base64 encoding
    const base64First = Buffer.from(jsonString, 'utf8').toString('base64');
    const base64Second = Buffer.from(base64First, 'utf8').toString('base64');
    
    // Create checksum
    const checksum = Buffer.from(jsonString).reduce((sum, byte) => sum + byte, 0) % 1000000;
    
    return JSON.stringify({
      d: base64Second,
      c: checksum,
      v: 2 // version 2 = UTF-8 safe
    });
  } catch (error) {
    console.error('Error protecting data:', error);
    throw error;
  }
}

// Helper function to verify admin access
function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_PASSWORD;
}

// Helper function to get activities from blob storage (unprotected)
async function getActivitiesFromBlob() {
  try {
    if (!activitiesUrl) {
      activitiesUrl = process.env.ACTIVITIES_BLOB_URL;
    }
    
    if (activitiesUrl) {
      const response = await fetch(activitiesUrl);
      if (response.ok) {
        return await response.json();
      }
    }
    
    // Return empty structure if no data found
    return {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalActivities: 0
      },
      activities: []
    };
  } catch (error) {
    console.error('Error fetching activities from blob:', error);
    return {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalActivities: 0
      },
      activities: []
    };
  }
}

// Helper function to get protected activities from blob storage
async function getProtectedActivitiesFromBlob() {
  try {
    if (!protectedActivitiesUrl) {
      protectedActivitiesUrl = process.env.PROTECTED_ACTIVITIES_BLOB_URL;
    }
    
    if (protectedActivitiesUrl) {
      const response = await fetch(protectedActivitiesUrl);
      if (response.ok) {
        return await response.text(); // Return as string since it's protected
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching protected activities from blob:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { admin } = req.query;
      
      if (admin === 'true') {
        // Admin endpoint - get unprotected data for editing
        if (!verifyAdmin(req)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        const data = await getActivitiesFromBlob();
        return res.status(200).json(data);
      } else {
        // Public endpoint - get protected data
        const protectedData = await getProtectedActivitiesFromBlob();
        if (protectedData) {
          return res.status(200).json({ 
            success: true, 
            data: protectedData,
            source: 'blob'
          });
        } else {
          // Fallback: return indication that static files should be used
          return res.status(404).json({ 
            error: 'No protected data found in blob storage',
            fallback: 'use_static'
          });
        }
      }
    }
    
    if (req.method === 'POST' || req.method === 'PUT') {
      // Admin only - update activities
      if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { activities } = req.body;
      
      if (!Array.isArray(activities)) {
        return res.status(400).json({ error: 'Activities must be an array' });
      }
      
      // Create updated data structure
      const updatedData = {
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalActivities: activities.length
        },
        activities: activities
      };
      
      // 1. Upload unprotected data to blob (for admin panel)
      const unprotectedBlob = await put('activities_unprotected.json', JSON.stringify(updatedData, null, 2), {
        access: 'public',
        contentType: 'application/json'
      });
      activitiesUrl = unprotectedBlob.url;
      
      // 2. Create and upload protected data (for main app)
      const protectedDataString = protectData(updatedData);
      const protectedBlob = await put('activities_protected.json', protectedDataString, {
        access: 'public',
        contentType: 'application/json'
      });
      protectedActivitiesUrl = protectedBlob.url;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Activities updated successfully',
        urls: {
          unprotected: unprotectedBlob.url,
          protected: protectedBlob.url
        },
        totalActivities: activities.length
      });
    }
    
    if (req.method === 'DELETE') {
      // Admin only - delete all activities
      if (!verifyAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Delete both versions
      if (activitiesUrl) {
        try {
          await del(activitiesUrl);
          activitiesUrl = null;
        } catch (error) {
          console.error('Error deleting unprotected blob:', error);
        }
      }
      
      if (protectedActivitiesUrl) {
        try {
          await del(protectedActivitiesUrl);
          protectedActivitiesUrl = null;
        } catch (error) {
          console.error('Error deleting protected blob:', error);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'All activities deleted' 
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}