import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // ================= USER/GUEST IDENTIFICATION =================
    // For logged-in users (optional for guests)
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        default: null 
    },
    
    // For guest users (required for guest orders)
    guestId: { 
        type: String, 
        default: null 
    },
    
    // Order type: 'user' or 'guest'
    orderType: {
        type: String,
        enum: ['user', 'guest'],
        required: true,
        default: 'user'
    },
    
    // Guest tracking data (for guest orders only)
    guestData: {
        sessionId: { type: String, default: null },
        browserFingerprint: { type: String, default: null },
        ipAddress: { type: String, default: null }
    },
    
    // Auto-expiration for guest orders (30 days)
    expiresAt: { 
        type: Date, 
        default: null 
    },
    
    // Conversion tracking (when guest registers/links account)
    convertedToUser: { 
        type: Boolean, 
        default: false 
    },
    convertedAt: { 
        type: Date, 
        default: null 
    },
    convertedFromGuestId: { 
        type: String, 
        default: null 
    },
    
    // ================= ORDER DETAILS =================
    items: { 
        type: Array, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    address: { 
        type: Object, 
        required: true 
    },
    status: { 
        type: String, 
        required: true, 
        default: "Pending Verification" 
    },
    deliveryCharges: {
        type: Number, 
        required: true, 
        default: 0
    },
    date: {
        type: Number,
        required: true,
        default: () => Date.now()
    },
    
    // ================= PAYMENT DETAILS =================
    paymentMethod: { 
        type: String, 
        required: true 
    },
    payment: { 
        type: Boolean, 
        required: true, 
        default: false 
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    paymentAmount: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    paymentScreenshot: { 
        type: String, 
        default: null 
    },
    paymentMethodDetail: { 
        type: String, 
        default: 'COD' 
    },
    
    // ================= CUSTOMER DETAILS =================
    // (for both guest and user orders)
    customerDetails: {
        name: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            required: true 
        },
        phone: { 
            type: String, 
            default: '' 
        }
    },

    // ================= VERIFICATION TRACKING =================
    verifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    verifiedAt: { 
        type: Date, 
        default: null 
    },
    rejectionReason: { 
        type: String, 
        default: null 
    },
    
    // ================= VERIFIED PAYMENT DATA (NEW) =================
    verifiedPayment: {
        screenshot: { 
            type: String, 
            default: null 
        },
        verifiedAt: { 
            type: Date, 
            default: null 
        },
        verifiedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            default: null 
        },
        amount: { 
            type: Number, 
            default: 0 
        },
        method: { 
            type: String, 
            default: '' 
        },
        transactionId: { 
            type: String, 
            default: '' 
        },
        action: {
            type: String,
            enum: ['approved', 'rejected'],
            default: 'approved'
        },
        reason: { 
            type: String, 
            default: null 
        }
    },
    
    // ================= ORDER TIMELINE =================
    orderPlacedAt: { 
        type: Date, 
        default: Date.now 
    },
    paymentVerifiedAt: { 
        type: Date, 
        default: null 
    },
    orderConfirmedAt: { 
        type: Date, 
        default: null 
    },

    // ================= CANCELLATION TRACKING =================
    cancellationReason: { 
        type: String, 
        default: null 
    },
    cancelledAt: { 
        type: Date, 
        default: null 
    },
    cancelledBy: { 
        type: String, 
        default: null 
    },
    
    // ================= METADATA =================
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, 
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Add indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ guestId: 1 });
orderSchema.index({ 'customerDetails.email': 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired orders
orderSchema.index({ orderType: 1, status: 1 });
orderSchema.index({ convertedToUser: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'verifiedPayment.verifiedAt': -1 }); // New index for verified payments

// Pre-save middleware
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Set date field if not already set
    if (!this.date) {
        this.date = Date.now();
    }
    
    // Set expiration for guest orders (30 days from creation)
    if (this.orderType === 'guest' && !this.expiresAt) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days retention
        this.expiresAt = expirationDate;
    }
    
    // Clear expiration for user orders or completed orders
    if (this.orderType === 'user' || 
        this.status === 'Delivered' || 
        this.status === 'Cancelled' || 
        this.convertedToUser) {
        this.expiresAt = null;
    }
    
    // Sync verifiedPayment data with paymentStatus
    if (this.paymentStatus === 'verified' && this.paymentScreenshot && !this.verifiedPayment?.screenshot) {
        if (!this.verifiedPayment) {
            this.verifiedPayment = {};
        }
        this.verifiedPayment.screenshot = this.paymentScreenshot;
        this.verifiedPayment.verifiedAt = this.verifiedAt || new Date();
        this.verifiedPayment.verifiedBy = this.verifiedBy;
        this.verifiedPayment.amount = this.paymentAmount || this.amount;
        this.verifiedPayment.method = this.paymentMethod || 'online';
        this.verifiedPayment.transactionId = this._id.toString();
        this.verifiedPayment.action = 'approved';
    } else if (this.paymentStatus === 'rejected' && this.paymentScreenshot && !this.verifiedPayment?.screenshot) {
        if (!this.verifiedPayment) {
            this.verifiedPayment = {};
        }
        this.verifiedPayment.screenshot = this.paymentScreenshot;
        this.verifiedPayment.verifiedAt = this.verifiedAt || new Date();
        this.verifiedPayment.verifiedBy = this.verifiedBy;
        this.verifiedPayment.amount = this.paymentAmount || this.amount;
        this.verifiedPayment.method = this.paymentMethod || 'online';
        this.verifiedPayment.transactionId = this._id.toString();
        this.verifiedPayment.action = 'rejected';
        this.verifiedPayment.reason = this.rejectionReason;
    }
    
    next();
});

// Virtual for checking if order is active
orderSchema.virtual('isActive').get(function() {
    return !['Delivered', 'Cancelled', 'Payment Rejected'].includes(this.status);
});

// Virtual for checking if order belongs to guest
orderSchema.virtual('isGuestOrder').get(function() {
    return this.orderType === 'guest';
});

// Virtual for getting payment screenshot URL (checks both locations)
orderSchema.virtual('paymentScreenshotUrl').get(function() {
    return this.verifiedPayment?.screenshot || this.paymentScreenshot;
});

// Virtual for checking if payment is verified
orderSchema.virtual('isPaymentVerified').get(function() {
    return this.paymentStatus === 'verified' && this.verifiedPayment?.screenshot !== undefined;
});

// Static method to find orders by email (useful for guest orders)
orderSchema.statics.findByEmail = function(email) {
    return this.find({ 'customerDetails.email': email }).sort({ createdAt: -1 });
};

// Static method to convert guest order to user order
orderSchema.statics.convertToUserOrder = async function(orderId, userId) {
    return this.findByIdAndUpdate(
        orderId,
        {
            userId: userId,
            orderType: 'user',
            convertedToUser: true,
            convertedAt: new Date(),
            expiresAt: null,
            $unset: { guestId: 1, guestData: 1 }
        },
        { new: true }
    );
};

// Static method to find guest orders by session ID
orderSchema.statics.findGuestOrdersBySession = function(sessionId) {
    return this.find({ 
        'guestData.sessionId': sessionId,
        orderType: 'guest'
    }).sort({ createdAt: -1 });
};

// Static method to find orders with verified payments (with screenshots)
orderSchema.statics.findVerifiedPayments = function() {
    return this.find({
        $or: [
            { 'verifiedPayment.screenshot': { $exists: true, $ne: null } },
            { paymentScreenshot: { $exists: true, $ne: null }, paymentStatus: 'verified' }
        ]
    }).sort({ 'verifiedPayment.verifiedAt': -1 });
};

// Static method to migrate existing payment screenshots to verifiedPayment
orderSchema.statics.migratePaymentScreenshots = async function() {
    const orders = await this.find({
        paymentScreenshot: { $exists: true, $ne: null },
        $or: [
            { paymentStatus: 'verified' },
            { paymentStatus: 'rejected' }
        ]
    });
    
    let migrated = 0;
    for (const order of orders) {
        if (!order.verifiedPayment?.screenshot) {
            const action = order.paymentStatus === 'verified' ? 'approved' : 'rejected';
            order.verifiedPayment = {
                screenshot: order.paymentScreenshot,
                verifiedAt: order.verifiedAt || order.paymentVerifiedAt || new Date(),
                verifiedBy: order.verifiedBy,
                amount: order.paymentAmount || order.amount,
                method: order.paymentMethod || 'online',
                transactionId: order._id.toString(),
                action: action,
                reason: order.rejectionReason
            };
            await order.save();
            migrated++;
        }
    }
    return migrated;
};

const orderModel = mongoose.models.order || mongoose.model("orders", orderSchema);
export default orderModel;