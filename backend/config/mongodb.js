import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is missing');
      return;
    }
    
    console.log('🔍 Checking MONGODB_URI...');
    
    // Sanitize for logging (hide password)
    const sanitizedUri = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('📡 Original URI:', sanitizedUri);
    
    // Parse the URI
    let connectionString = MONGODB_URI;
    
    // Check if URI already has a database name
    const uriMatch = MONGODB_URI.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
    
    if (uriMatch && uriMatch[1]) {
      // URI has a database name already
      const existingDbName = uriMatch[1];
      console.log(`📊 Found existing database: ${existingDbName}`);
      
      if (existingDbName !== 'e-commerce') {
        console.log(`⚠️  Warning: Connecting to ${existingDbName} instead of e-commerce`);
      }
    } else {
      // No database name, add /e-commerce
      console.log('📝 No database name found, adding /e-commerce');
      connectionString = MONGODB_URI.replace(/\/(\?|$)/, '/e-commerce$1');
      console.log('🔧 Updated URI:', connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    }
    
    console.log('🔗 Connecting to MongoDB...');
    
    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB Connected Successfully!`);
      console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'Not specified'}`);
      console.log(`🏢 Host: ${mongoose.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Error:', err.message);
    });
    
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    // Immediate check
    console.log(`📈 Connection readyState: ${mongoose.connection.readyState}`);
    console.log(`🎯 Connected to database: ${mongoose.connection.db?.databaseName}`);
    
    // Check if products collection exists and has data
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📁 Total collections: ${collections.length}`);
      
      if (collections.find(c => c.name === 'products')) {
        const Product = mongoose.model('Product');
        const productCount = await Product.countDocuments();
        console.log(`📦 Products in database: ${productCount}`);
        
        if (productCount === 0) {
          console.log('⚠️  Warning: products collection exists but is empty');
        }
      } else {
        console.log('⚠️  Warning: products collection not found');
      }
    } catch (err) {
      console.log('⚠️  Could not check collections:', err.message);
    }
    
    return conn;
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`);
    console.error('Error:', error.message);
    
    // Provide specific troubleshooting
    if (error.message.includes('bad auth')) {
      console.log('\n🔑 Authentication Error: Check username/password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 DNS Error: Check cluster URL');
    } else if (error.message.includes('timed out')) {
      console.log('\n⏱️  Timeout: Check network/whitelist settings');
    }
    
    return null;
  }
};

export default connectDB;