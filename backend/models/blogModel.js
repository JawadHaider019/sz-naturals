import mongoose from 'mongoose';

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  excerpt: { type: String, default: '' },
  category: [{ type: String, trim: true, default: 'General' }],
  subcategory: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  author: { type: String, default: 'Admin' },
  readTime: { type: Number, default: 1 },
  featured: { type: Boolean, default: false },
  metaDescription: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishDate: { type: Date, default: null },
  views: { type: Number, default: 0 },
  // New field to track if notification was sent
  notificationSent: { type: Boolean, default: false }
}, { timestamps: true });

// Blog pre-save middleware
blogSchema.pre('save', function(next) {
  // Calculate read time
  if (this.isModified('content')) {
    const words = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }

  // Set publish date when publishing
  if (this.isModified('status') && this.status === 'published' && !this.publishDate) {
    this.publishDate = new Date();
  }

  // Generate excerpt
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.length > 150 ? this.content.substring(0, 150) + '...' : this.content;
  }

  // Generate meta description
  if (!this.metaDescription && this.content) {
    this.metaDescription = this.content.length > 160 ? this.content.substring(0, 160) + '...' : this.content;
  }

  next();
});

export const Blog = mongoose.model('Blog', blogSchema);