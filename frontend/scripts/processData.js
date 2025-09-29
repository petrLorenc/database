const fs = require('fs');
const path = require('path');
const { protectData } = require('./dataEncryption');

/**
 * Build-time data processing script
 * Converts raw JSON data to protected format
 */

async function processDataFiles() {
  console.log('🔒 Starting data protection process...');
  
  const publicDataDir = path.join(__dirname, '../public/data');
  const buildDataDir = path.join(__dirname, '../build');
  
  // Process activities_real.json
  const activitiesPath = path.join(publicDataDir, 'activities_real.json');
  const protectedActivitiesPath = path.join(publicDataDir, 'activities_protected.json');
  
  try {
    console.log('📊 Processing activities data...');
    
    // Read original data
    const rawData = fs.readFileSync(activitiesPath, 'utf8');
    const activitiesData = JSON.parse(rawData);
    
    // Create protected version
    const protectedData = protectData(activitiesData);
    
    // Write protected data (protectData already returns a JSON string)
    fs.writeFileSync(protectedActivitiesPath, protectedData, 'utf8');
    
    console.log('✅ Activities data protected successfully');
    console.log(`   Original size: ${rawData.length} bytes`);
    console.log(`   Protected size: ${protectedData.length} bytes`);

    // Also copy unique_tags.json to ensure it's available
    const uniqueTagsPath = path.join(publicDataDir, 'unique_tags.json');
    const buildUniqueTagsPath = path.join(buildDataDir, 'data', 'unique_tags.json');
    
    if (fs.existsSync(uniqueTagsPath) && fs.existsSync(path.dirname(buildUniqueTagsPath))) {
      fs.copyFileSync(uniqueTagsPath, buildUniqueTagsPath);
      console.log('📋 Unique tags copied to build directory');
    }

  } catch (error) {
    console.error('❌ Error processing activities data:', error);
    throw error;
  }
  
  console.log('🔒 Data protection completed!');
}

// Run if called directly
if (require.main === module) {
  processDataFiles().catch(error => {
    console.error('❌ Data processing failed:', error);
    process.exit(1);
  });
}

module.exports = { processDataFiles };