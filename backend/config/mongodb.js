import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.log('⚠️  Application will run without database');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      // Remove deprecated options for MongoDB driver v4+
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
    console.log('⚠️  Application will run without database');
    // Don't throw error, let app continue (for read-only operations)
  }
};

export default connectDB;