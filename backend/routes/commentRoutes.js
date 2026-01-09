import express from "express";
import {
  getComments,
  addComment,
  markRead,
  markUnread,
  addReply,
  likeComment,
  dislikeComment,
  removeLike,
  removeDislike,
  deleteComment,
  getNotifications,
} from "../controllers/commentController.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// 🔹 GET all comments (supports ?productId= or ?dealId=)
router.get("/", getComments);

// 🔹 POST new comment (supports both products & deals)
router.post("/", upload.array("reviewImages", 5), addComment);

// 🔹 Admin + User actions
router.patch("/:id/read", markRead);
router.patch("/:id/unread", markUnread);
router.patch("/:id/reply", addReply);
router.patch("/:id/like", likeComment);
router.patch("/:id/dislike", dislikeComment);
router.patch("/:id/remove-like", removeLike);
router.patch("/:id/remove-dislike", removeDislike);
router.delete("/:id", deleteComment);

// 🔹 Notifications
router.get("/notifications/new", getNotifications);

export default router;
