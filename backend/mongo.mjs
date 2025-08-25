import mongoose from "mongoose";
import "dotenv/config";

const uri = process.env.MONGO_URI;
console.log("Connecting to", uri.replace(/\/\/.*@/, "//<redacted>@"));
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("✅ Connected to MongoDB Atlas");
} catch (e) {
  console.error("❌ Connection failed:", e.message);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
