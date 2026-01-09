import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    headingLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    headingLine2: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    subtext: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    buttonText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    redirectUrl: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


export const Banner = mongoose.model("Banner", bannerSchema);