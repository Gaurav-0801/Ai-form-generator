const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env.local file manually
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    console.log(`Reading .env.local from: ${envPath}`);
    const envFile = fs.readFileSync(envPath, 'utf8');
    console.log(`File contents (first 200 chars): ${envFile.substring(0, 200)}`);
    const envLines = envFile.split('\n');
    console.log(`Total lines in file: ${envLines.length}`);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^MONGODB_URI\s*=\s*(.+)$/);
        if (match) {
          MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
          console.log(`Found MONGODB_URI (length: ${MONGODB_URI.length})`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Could not read .env.local file:', error.message);
  }
}

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in .env.local');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing MongoDB Atlas connection...');
  console.log(`URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  console.log('');

  try {
    // Set connection timeout
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 10000,
    };

    console.log('Attempting to connect...');
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log(`Connection state: ${mongoose.connection.readyState}`);
    console.log(`Database name: ${mongoose.connection.name || 'default'}`);
    console.log(`Host: ${mongoose.connection.host}`);
    
    // List databases
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('\nAvailable databases:');
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Connection closed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to MongoDB');
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
      console.error('\n💡 Possible issues:');
      console.error('  1. Check your MongoDB Atlas IP whitelist (Network Access)');
      console.error('  2. Verify your username and password are correct');
      console.error('  3. Check if your cluster is running');
      console.error('  4. Firewall/VPN might be blocking the connection');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication error:');
      console.error('  1. Check your username and password');
      console.error('  2. Verify the database user has proper permissions');
    }
    
    process.exit(1);
  }
}

testConnection();

