import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set');
      return;
    }
    
    console.log('🔗 CONNECTING TO E-COMMERCE DATABASE');
    
    // FORCE e-commerce database regardless of what's in the URI
    // Replace ANY database name with 'e-commerce'
    let connectionString = MONGODB_URI;
    
    // Method 1: Replace sz-naturals with e-commerce
    connectionString = connectionString.replace(/\/sz-naturals(\?|$)/, '/e-commerce$1');
    
    // Method 2: If still not e-commerce, force it
    if (!connectionString.includes('/e-commerce')) {
      // Remove any database name and add e-commerce
      connectionString = connectionString.replace(/\/([^/?]+)(\?|$)/, '/e-commerce$2');
    }
    
    console.log('📡 Final URI:', connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to database: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections in ${dbName}: ${collections.length}`);
    
    if (dbName !== 'e-commerce') {
      console.error('❌ CRITICAL: Connected to wrong database!');
      console.error('   Expected: e-commerce');
      console.error(`   Got: ${dbName}`);
      console.error('   Update MONGODB_URI in Northflank environment!');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

export default connectDB;