// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordOtp: String,
  resetPasswordExpires: Date,
  cartData: {
    products: { type: Object, default: {} },
    deals: { type: Object, default: {} }
  }
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;