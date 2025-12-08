import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    items: {type: Array, required: true},
    amount: {type: Number, required: true},
    address: {type: Object, required: true},
    status: {type: String, required: true, default: "Pending Verification"},
    paymentMethod: {type: String, required: true},
    payment: {type: Boolean, required: true, default: false},
    date: {type: Number, required: true},
    deliveryCharges: {type: Number, required: true, default: 0},
    
    // 🆕 ORDER-SPECIFIC CUSTOMER DETAILS
    customerDetails: {
        name: {type: String, required: true},
        email: {type: String, required: true},
        phone: {type: String, default: ''}
    },

    // 🆕 PAYMENT VERIFICATION FIELDS
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    paymentAmount: {type: Number, required: true, default: 0},
    paymentScreenshot: {type: String, default: null},
    paymentMethodDetail: {type: String, default: 'COD'},
    
    // 🆕 PAYMENT VERIFICATION TRACKING
    verifiedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    verifiedAt: {type: Date, default: null},
    rejectionReason: {type: String, default: null},
    
    // 🆕 ORDER TRACKING
    orderPlacedAt: {type: Date, default: Date.now},
    paymentVerifiedAt: {type: Date, default: null},
    orderConfirmedAt: {type: Date, default: null},

    cancellationReason: {type: String, default: null},
    cancelledAt: {type: Date, default: null},
    cancelledBy: {type: String, default: null},
    
    createdAt: { type: Date, default: Date.now }, 
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const orderModel = mongoose.models.order || mongoose.model("orders", orderSchema);
export default orderModel;