import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  email: { type: String, required: true },
  notifications: { type: Boolean, default: true },
  password: { type: String, required: true }, // hashed
});

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
