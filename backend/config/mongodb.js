import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Using existing MongoDB connection");
      return;
    }

    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log("⚠️  Running without database connection");
      return;
    }

    // Remove any trailing slashes and append database name
    const connectionString = process.env.MONGODB_URI.replace(/\/$/, '') + '/e-commerce';
    
    console.log("🔗 Connecting to MongoDB...");

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    };

    await mongoose.connect(connectionString, options);

    // Connection events
    mongoose.connection.on('connected', () => {
      console.log("✅ MongoDB Connected Successfully!");
      console.log(`✅ Database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log("⚠️  MongoDB Disconnected");
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    console.log("⚠️  Application will run without database");
    
    // Don't crash the app - continue without DB
    // You can implement fallback logic here
  }
};

export default connectDB;