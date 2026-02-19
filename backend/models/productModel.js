import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountprice: { type: Number, required: true },
    cost: { type: Number, required: true }, 
    quantity: { type: Number, required: true },
    image: { type: Array, required: true },
    // Add video field
    video: { 
        type: String, 
        required: false,
        default: null 
    },
    category: { 
        type: String, 
        required: true,
        ref: 'Category'
    },
    subcategory: { 
        type: String, 
        required: true 
    },
    
    ingredients: { 
        type: [String], 
        required: false,
        default: []
    },
    howToUse: { 
        type: String, 
        required: false,
        default: "" 
    },
    benefits: { 
        type: [String], 
        required: false,
        default: []
    },
    bestseller: { type: Boolean, default: false },
    date: { type: Number, required: true },  
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'scheduled'],
        default: 'draft'
    },
    totalSales: { type: Number, default: 0 },
    idealStock: { type: Number, default: 20 },
    views: { type: Number, default: 0 },
    // Track if notification was sent
    notificationSent: { type: Boolean, default: false },
    // Optional: Add video metadata if needed
    videoMetadata: {
        duration: { type: Number }, // Duration in seconds
        thumbnail: { type: String }, // Video thumbnail URL
        format: { type: String } // Video format (mp4, etc.)
    }
});

// Add index for better category queries
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });

// Pre-save middleware for product
productSchema.pre('save', function(next) {
  // Ensure date is set
  if (!this.date) {
    this.date = Date.now();
  }
  
  // Ensure discount price is valid
  if (this.discountprice >= this.price) {
    this.discountprice = this.price;
  }
  
  next();
});

// Virtual for checking if product has video
productSchema.virtual('hasVideo').get(function() {
  return !!this.video;
});

// Method to get video embed URL (if needed for different platforms)
productSchema.methods.getVideoEmbedUrl = function() {
  if (!this.video) return null;
  
  // Check if it's a YouTube URL
  if (this.video.includes('youtube.com') || this.video.includes('youtu.be')) {
    const videoId = this.video.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  }
  
  // Check if it's a Vimeo URL
  if (this.video.includes('vimeo.com')) {
    const videoId = this.video.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : null;
  }
  
  // For Cloudinary or direct video URLs
  return this.video;
};

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;