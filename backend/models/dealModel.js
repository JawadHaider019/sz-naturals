import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
    dealName: { type: String, required: true },
    dealDescription: { type: String },
    dealDiscountType: { type: String, default: "percentage" },
    dealDiscountValue: { type: Number, required: true },
    dealProducts: [{ 
        name: String,
        cost: Number,
        price: Number, 
        quantity: Number,
        total: Number
    }],
    dealImages: [{ type: String }],
    dealTotal: { type: Number },
    dealFinalPrice: { type: Number },
    dealStartDate: { type: Date, default: Date.now },
    dealEndDate: { type: Date },
    dealType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DealType',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    date: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    // New field to track if notification was sent
    notificationSent: { type: Boolean, default: false }
});

// Pre-save middleware to calculate deal totals
dealSchema.pre('save', function(next) {
  // Calculate deal total from products
  if (this.dealProducts && this.dealProducts.length > 0) {
    this.dealTotal = this.dealProducts.reduce((total, product) => {
      return total + (product.total || (product.price * product.quantity));
    }, 0);
  }

  // Calculate final price with discount
  if (this.dealTotal && this.dealDiscountValue) {
    if (this.dealDiscountType === 'percentage') {
      this.dealFinalPrice = this.dealTotal * (1 - this.dealDiscountValue / 100);
    } else {
      this.dealFinalPrice = this.dealTotal - this.dealDiscountValue;
    }
  }

  next();
});

export default mongoose.model("deals", dealSchema);