// models/DeliverySettings.js
import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["fixed", "api"],
      default: "fixed",
    },
    fixedCharge: {
      type: Number,
      default: 0,
    },
    freeDeliveryAbove: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.DeliverySettings || mongoose.model("DeliverySettings", deliverySettingsSchema);
