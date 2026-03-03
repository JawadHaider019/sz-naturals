import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const { MONGODB_URI, DB_NAME } = process.env;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }

    if (!DB_NAME) {
      throw new Error("DB_NAME is not set");
    }

    console.log(`🔗 Connecting to ${DB_NAME} database`);

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    const dbName = mongoose.connection.db.databaseName;

    console.log(`✅ Connected to database: ${dbName}`);

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(`📁 Collections in ${dbName}: ${collections.length}`);

    if (dbName !== DB_NAME) {
      console.error("❌ Connected to wrong database!");
      console.error(`Expected: ${DB_NAME}`);
      console.error(`Got: ${dbName}`);
    }

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

export default connectDB;