import express from "express";
import {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerOrder,
} from "../controllers/bannerController.js";

import upload from "../middleware/multer.js"; // ✅ using your existing multer.js

const router = express.Router();

// 🟩 Routes
router.get("/", getAllBanners);
router.get("/active", getActiveBanners);
router.get("/:id", getBannerById);
router.post("/", upload.single("image"), createBanner);
router.put("/:id", upload.single("image"), updateBanner);
router.delete("/:id", deleteBanner);
router.put("/order/update", updateBannerOrder);

export default router;
