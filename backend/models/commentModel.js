import mongoose from "mongoose";

// Reply sub-schema
const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  author: { type: String, default: "Admin" }
});

// Main comment schema - UPDATED FOR DEALS
const commentSchema = new mongoose.Schema({
  targetType: { 
    type: String, 
    enum: ["product", "order", "deal"], // ADDED "deal"
    required: true 
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: "deals" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

  productName: { type: String },
  productPrice: { type: String },
  dealName: { type: String }, // NEW FIELD
   dealPrice: { type: String },

  reviewImages: [
    {
      url: { type: String },
    }
  ],

  author: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  content: { type: String, required: true, trim: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  hasReply: { type: Boolean, default: false },
  reply: { type: replySchema, default: null },

  // ❤️ Like / Dislike counts
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },

  // 👥 Track user interactions for one like/dislike per user
  likedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user" 
  }],
  dislikedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user" 
  }],

  // 🔔 Admin notification flag
  isNotified: { type: Boolean, default: true }
});

commentSchema.index({ isRead: 1, hasReply: 1, date: -1 });
commentSchema.index({ dealId: 1 }); // NEW INDEX

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;