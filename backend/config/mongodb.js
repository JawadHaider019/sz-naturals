import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is missing');
      console.log('📝 Current env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      return;
    }
    
    console.log('🔗 Initializing MongoDB connection...');
    
    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB Connected`);
      console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'Not specified'}`);
      console.log(`🏢 Host: ${mongoose.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Error:', err.message);
    });
    
    // Build connection string
    let connectionString = MONGODB_URI;
    
    // Check what type of URI we have
    if (MONGODB_URI.includes('@')) {
      // It's a full connection string (probably from MongoDB Atlas)
      if (!MONGODB_URI.split('/').pop().includes('?')) {
        // Already has a database name, use as-is
        console.log('📡 Using provided connection string with existing database');
      } else {
        // No database name specified, add /e-commerce
        connectionString = MONGODB_URI.replace(/\?/, '/e-commerce?');
        console.log('📡 Appending /e-commerce to connection string');
      }
    } else {
      // Simple URI, append /e-commerce
      connectionString = `${MONGODB_URI}/e-commerce`;
    }
    
    console.log('🔗 Connecting...');
    
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log(`✅ Connection established`);
    console.log(`📈 Ready State: ${mongoose.connection.readyState}`);
    
    return conn;
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`, error.message);
    console.error('Full error for debugging:', error);
    
    // Don't crash the app, just log error
    return null;
  }
};

export default connectDB;