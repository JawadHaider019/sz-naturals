// models/notificationModel.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Target user
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
      'order_placed',
      'order_cancelled'
    ]
  },
  
  // Notification content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related entity
  relatedId: {
    type: String,
    default: null
  },
  relatedType: {
    type: String,
    enum: ['order', 'product', 'deal', 'comment', 'user', 'system'],
    default: 'system'
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Action
  actionUrl: {
    type: String,
    default: null
  },
  
  // Metadata for additional data
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ isAdmin: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.getUserNotifications = async function(userId, limit = 20) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

notificationSchema.statics.getAdminNotifications = async function(limit = 50) {
  return await this.find({ isAdmin: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

const notificationModel = mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default notificationModel;