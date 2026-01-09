import express from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  togglePublishStatus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/blogController.js";

import upload from "../middleware/multer.js"; 

const router = express.Router();

// 🟩 Category Routes (MOVE THESE BEFORE BLOG ROUTES)
router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// 🟩 Blog Routes (THESE COME AFTER CATEGORY ROUTES)
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Use upload middleware for single file (image/video) with field "media"
router.post("/", upload.single("media"), createBlog);
router.put("/:id", upload.single("media"), updateBlog);

router.delete("/:id", deleteBlog);
router.patch("/:id/featured", toggleFeatured);
router.patch("/:id/publish-status", togglePublishStatus);

export default router;