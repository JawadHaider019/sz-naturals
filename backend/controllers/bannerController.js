import { Banner } from "../models/bannerModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// 🟩 Get all banners
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
      error: error.message,
    });
  }
};

// 🟩 Get active banners (for frontend)
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active banners",
      error: error.message,
    });
  }
};

// 🟩 Get banner by ID
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching banner",
      error: error.message,
    });
  }
};

// 🟩 Create banner
export const createBanner = async (req, res) => {
  try {
    const {
      headingLine1,
      headingLine2,
      subtext,
      buttonText,
      redirectUrl,
      isActive = true,
      order = 0,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (process.env.FILE_STORAGE === "local") {
      imageUrl = `/uploads/banners/${req.file.filename}`;
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "banners",
           transformation: [
    { quality: "auto:best" }, // Only optimize quality, don't resize
  ],  
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;

      fs.unlinkSync(req.file.path); // remove temp file
    }

    const banner = new Banner({
      headingLine1,
      headingLine2,
      subtext,
      buttonText,
      redirectUrl,
      imageUrl,
      imagePublicId,
      isActive,
      order,
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating banner",
      error: error.message,
    });
  }
};

// 🟩 Update banner
export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const {
      headingLine1,
      headingLine2,
      subtext,
      buttonText,
      redirectUrl,
      isActive,
      order,
    } = req.body;

    if (headingLine1 !== undefined) banner.headingLine1 = headingLine1;
    if (headingLine2 !== undefined) banner.headingLine2 = headingLine2;
    if (subtext !== undefined) banner.subtext = subtext;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (redirectUrl !== undefined) banner.redirectUrl = redirectUrl;
    if (isActive !== undefined) banner.isActive = isActive;
    if (order !== undefined) banner.order = order;

    if (req.file) {
      if (banner.imagePublicId && process.env.FILE_STORAGE !== "local") {
        await cloudinary.uploader.destroy(banner.imagePublicId);
      }

      if (process.env.FILE_STORAGE === "local") {
        banner.imageUrl = `/uploads/banners/${req.file.filename}`;
      } else {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "banners",
             transformation: [
    { quality: "auto:best" }, // Only optimize quality, don't resize
  ],
        });
        banner.imageUrl = result.secure_url;
        banner.imagePublicId = result.public_id;

        fs.unlinkSync(req.file.path);
      }
    }

    await banner.save();

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating banner",
      error: error.message,
    });
  }
};

// 🟩 Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    if (banner.imagePublicId && process.env.FILE_STORAGE !== "local") {
      await cloudinary.uploader.destroy(banner.imagePublicId);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting banner",
      error: error.message,
    });
  }
};

// 🟩 Update banner order
export const updateBannerOrder = async (req, res) => {
  try {
    const { banners } = req.body; // array of { id, order }

    await Promise.all(
      banners.map((b) =>
        Banner.findByIdAndUpdate(b.id, { order: b.order }, { new: true })
      )
    );

    res.json({
      success: true,
      message: "Banner order updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating banner order",
      error: error.message,
    });
  }
};
