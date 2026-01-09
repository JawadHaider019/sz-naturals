import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import notificationModel from "../models/notifcationModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import crypto from "crypto";

// 🆕 Notification Types
const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_CANCELLED: 'order_cancelled', 
  ORDER_STATUS_UPDATED: 'order_status_updated',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_PENDING: 'payment_pending'
};

// 🆕 Create Notification Function
const createNotification = async (notificationData) => {
  try {
    const notification = new notificationModel(notificationData);
    await notification.save();
    console.log(`🔔 Notification created: ${notification.title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    // Don't throw error - notifications shouldn't break order flow
    return null;
  }
};

// 🆕 Send Payment Verified Notification
const sendPaymentVerifiedNotification = async (order) => {
  try {
    const shortOrderId = order._id.toString().slice(-6);
    const customerName = order.customerDetails?.name || 'Customer';

    // User notification (only for logged-in users)
    if (order.userId) {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.PAYMENT_VERIFIED,
        title: '✅ Payment Verified!',
        message: `Your payment for order #${shortOrderId} has been verified. Order is now confirmed.`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          amount: order.paymentAmount,
          customerName: customerName
        }
      });
    }

    console.log(`🔔 Payment verified notification sent for order ${order._id}`);
  } catch (error) {
    console.error('❌ Error sending payment verified notification:', error);
  }
};

// 🆕 Send Payment Rejected Notification
const sendPaymentRejectedNotification = async (order, reason) => {
  try {
    const shortOrderId = order._id.toString().slice(-6);
    const customerName = order.customerDetails?.name || 'Customer';

    // User notification (only for logged-in users)
    if (order.userId) {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.PAYMENT_REJECTED,
        title: '❌ Payment Rejected',
        message: `Your payment for order #${shortOrderId} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          amount: order.paymentAmount,
          reason: reason,
          customerName: customerName
        }
      });
    }

    console.log(`🔔 Payment rejected notification sent for order ${order._id}`);
  } catch (error) {
    console.error('❌ Error sending payment rejected notification:', error);
  }
};

// 🆕 Send Payment Pending Notification
const sendPaymentPendingNotification = async (order) => {
  try {
    const shortOrderId = order._id.toString().slice(-6);
    const customerName = order.customerDetails?.name || 'Customer';

    // User notification (only for logged-in users)
    if (order.userId) {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.PAYMENT_PENDING,
        title: '⏳ Payment Pending Verification',
        message: `Your order #${shortOrderId} has been placed. Waiting for payment verification.`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          amount: order.paymentAmount,
          customerName: customerName
        }
      });
    }

    // Admin notification
    await createNotification({
      userId: 'admin',
      type: NOTIFICATION_TYPES.PAYMENT_PENDING,
      title: '⏳ Payment Verification Required',
      message: `New order #${shortOrderId} from ${customerName}. Payment verification required.`,
      relatedId: order._id.toString(),
      relatedType: 'order',
      isAdmin: true,
      actionUrl: `/admin/orders/${order._id}`,
      priority: 'high',
      metadata: {
        orderId: order._id.toString(),
        customerName: customerName,
        amount: order.paymentAmount
      }
    });

    console.log(`🔔 Payment pending notification sent for order ${order._id}`);
  } catch (error) {
    console.error('❌ Error sending payment pending notification:', error);
  }
};

// 🆕 UPDATED: Send Order Placed Notification with Customer Details
const sendOrderPlacedNotification = async (order) => {
  try {
    const userDetails = order.userId ? await userModel.findById(order.userId) : null;
    const shortOrderId = order._id.toString().slice(-6);
    
    // Use customer details from order (which may be edited) or fallback to user profile
    const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
    const customerEmail = order.customerDetails?.email || userDetails?.email || '';
    
    // User notification (only for registered users)
    if (order.userId && order.orderType === 'user') {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.ORDER_PLACED,
        title: order.paymentStatus === 'pending' ? '⏳ Order Placed - Payment Pending' : '🎉 Order Placed Successfully!',
        message: order.paymentStatus === 'pending' 
          ? `Your order #${shortOrderId} has been placed. Waiting for payment verification.` 
          : `Your order #${shortOrderId} has been placed. Total: $${order.amount}`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          amount: order.amount,
          itemsCount: order.items.length,
          customerName: customerName,
          customerEmail: customerEmail,
          paymentStatus: order.paymentStatus
        }
      });
    }

    // Admin notification - using order customer details
    await createNotification({
      userId: 'admin',
      type: NOTIFICATION_TYPES.ORDER_PLACED,
      title: order.orderType === 'guest' 
        ? (order.paymentStatus === 'pending' ? '👤 Guest Order - Payment Pending' : '👤 New Guest Order')
        : (order.paymentStatus === 'pending' ? '⏳ New Order - Payment Pending' : '🛒 New Order Received'),
      message: order.orderType === 'guest'
        ? `New GUEST order #${shortOrderId} from ${customerName} (${customerEmail}). ${order.paymentStatus === 'pending' ? 'Payment verification required.' : ''}`
        : `New order #${shortOrderId} from ${customerName}. Amount: $${order.amount}`,
      relatedId: order._id.toString(),
      relatedType: 'order',
      isAdmin: true,
      actionUrl: `/admin/orders/${order._id}`,
      priority: order.paymentStatus === 'pending' ? 'high' : 'medium',
      metadata: {
        orderId: order._id.toString(),
        customerName: customerName,
        customerEmail: customerEmail,
        amount: order.amount,
        itemsCount: order.items.length,
        paymentStatus: order.paymentStatus,
        isGuestOrder: order.orderType === 'guest'
      }
    });

    console.log(`🔔 Order placed notifications sent for order ${order._id} from customer ${customerName}`);
  } catch (error) {
    console.error('❌ Error sending order placed notification:', error);
  }
};

// 🆕 UPDATED: Send Order Cancelled Notification with Customer Details
const sendOrderCancelledNotification = async (order, cancelledBy, reason = '') => {
  try {
    const userDetails = order.userId ? await userModel.findById(order.userId) : null;
    const shortOrderId = order._id.toString().slice(-6);
    const cancelledByText = cancelledBy === 'user' ? 'You have' : 'Admin has';
    
    // Use customer details from order
    const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
    
    // User notification (only for registered users)
    if (order.userId && order.orderType === 'user') {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.ORDER_CANCELLED,
        title: '❌ Order Cancelled',
        message: `${cancelledByText} cancelled order #${shortOrderId}.${reason ? ` Reason: ${reason}` : ''}`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          cancelledBy,
          reason,
          amount: order.amount,
          customerName: customerName
        }
      });
    }

    // Admin notification (if cancelled by user or it's a guest order)
    if (cancelledBy === 'user' || order.orderType === 'guest') {
      await createNotification({
        userId: 'admin',
        type: NOTIFICATION_TYPES.ORDER_CANCELLED,
        title: order.orderType === 'guest' ? '❌ Guest Order Cancelled' : '❌ Order Cancelled by Customer',
        message: `Order #${shortOrderId} cancelled by ${customerName}.${reason ? ` Reason: ${reason}` : ''}`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        isAdmin: true,
        actionUrl: `/admin/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          customerName: customerName,
          reason,
          amount: order.amount,
          cancelledBy,
          isGuestOrder: order.orderType === 'guest'
        }
      });
    }

    console.log(`🔔 Order cancelled notifications sent for order ${order._id}`);
  } catch (error) {
    console.error('❌ Error sending order cancelled notification:', error);
  }
};

// 🆕 Send Order Status Update Notification
const sendOrderStatusUpdateNotification = async (order, oldStatus, newStatus) => {
  try {
    const statusMessages = {
      'Processing': 'is being processed',
      'Shipped': 'has been shipped',
      'Out for delivery': 'is out for delivery',
      'Delivered': 'has been delivered successfully! 🎉',
      'Cancelled': 'has been cancelled'
    };

    const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
    const shortOrderId = order._id.toString().slice(-6);

    // Only send to registered users
    if (order.userId && order.orderType === 'user') {
      await createNotification({
        userId: order.userId.toString(),
        type: NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
        title: '📦 Order Status Updated',
        message: `Your order #${shortOrderId} ${message}.`,
        relatedId: order._id.toString(),
        relatedType: 'order',
        actionUrl: `/orders/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          oldStatus,
          newStatus,
          amount: order.amount
        }
      });
    }

    console.log(`🔔 Order status update notification sent for order ${order._id}`);
  } catch (error) {
    console.error('❌ Error sending order status update notification:', error);
  }
};

// Generate guest ID
const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate session ID for guest
const generateSessionId = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const fingerprint = crypto
    .createHash('md5')
    .update(`${ip}${userAgent}${Date.now()}`)
    .digest('hex');
  return fingerprint;
};

// Get browser fingerprint
const getBrowserFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';
  const language = req.headers['accept-language'] || '';
  const encoding = req.headers['accept-encoding'] || '';
  
  return crypto
    .createHash('md5')
    .update(`${userAgent}${accept}${language}${encoding}`)
    .digest('hex');
};

// Get IP address
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         null;
};

// ============================================
// MASTER ORDER PLACEMENT FUNCTION
// (handles both guest and user)
// ============================================
const placeOrder = async (req, res) => {
  try {
    console.log("🛒 ========== ORDER PLACEMENT ==========");
    
    const { 
      items, 
      amount, 
      address, 
      deliveryCharges, 
      customerDetails, 
      paymentMethod = 'COD',
      guestOrder = false
    } = req.body;

    // Get user ID (might be null for guests)
    const userId = req.userId || null;
    const isGuest = !userId;
    
    console.log(`Order type: ${isGuest ? 'GUEST' : 'USER'}, User ID: ${userId || 'N/A'}`);

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    // Validate payment method
    if (!paymentMethod || !['COD', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    // 🆕 Validate customer details
    let finalCustomerDetails = {};
    
    if (isGuest || guestOrder) {
      // For guests, customer details are mandatory
      if (!customerDetails || !customerDetails.email || !customerDetails.name) {
        return res.status(400).json({ success: false, message: "Name and email are required for guest checkout" });
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerDetails.email.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      
      finalCustomerDetails = {
        name: customerDetails.name.trim(),
        email: customerDetails.email.trim(),
        phone: customerDetails.phone || ''
      };
    } else {
      // For logged-in users, get from profile with optional override
      const userProfile = await userModel.findById(userId);
      if (!userProfile) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Default from profile
      finalCustomerDetails = {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || ''
      };

      // Override with provided details if available
      if (customerDetails) {
        if (customerDetails.name && customerDetails.name.trim() !== '') {
          finalCustomerDetails.name = customerDetails.name.trim();
        }
        
        if (customerDetails.email && customerDetails.email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customerDetails.email.trim())) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
          }
          finalCustomerDetails.email = customerDetails.email.trim();
        }
        
        if (customerDetails.phone) {
          finalCustomerDetails.phone = customerDetails.phone;
        }
      }
    }

    console.log("👤 CUSTOMER DETAILS:", finalCustomerDetails);

    // Check stock availability
    console.log("📦 Checking stock availability...");
    const validatedItems = [];
    
    for (const item of items) {
      let product;
      
      if (item.id) {
        product = await productModel.findById(item.id);
      }
      
      if (!product && item._id) {
        product = await productModel.findById(item._id);
      }
      
      if (!product && item.productId) {
        product = await productModel.findById(item.productId);
      }
      
      if (!product && item.name) {
        product = await productModel.findOne({ 
          name: item.name, 
          status: 'published' 
        });
      }

      if (!product && item.isFromDeal) {
        console.log(`⚠️ Deal product "${item.name}" not found, but continuing order`);
        validatedItems.push({
          ...item,
          id: item.id || item._id,
          name: item.name
        });
        continue;
      }

      if (!product) {
        console.log(`❌ Product not found: ${item.name}`, item);
        return res.status(404).json({ success: false, message: `Product "${item.name}" not found` });
      }

      if (product.status !== 'published') {
        return res.status(400).json({ success: false, message: `Product "${product.name}" is not available` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }

      validatedItems.push({
        ...item,
        id: product._id.toString(),
        name: product.name,
        actualProduct: product
      });
    }

    // Reduce inventory for COD orders immediately
    if (paymentMethod === 'COD') {
      console.log("📦 Reducing inventory quantity for COD order...");
      for (const validatedItem of validatedItems) {
        if (!validatedItem.actualProduct) continue;

        await productModel.findByIdAndUpdate(
          validatedItem.id,
          { 
            $inc: { 
              quantity: -validatedItem.quantity,
              totalSales: validatedItem.quantity
            } 
          }
        );
        
        console.log(`✅ Reduced stock for ${validatedItem.name} by ${validatedItem.quantity}`);
      }
    } else {
      console.log("⚠️ Skipping inventory reduction - online payment requires verification");
    }

    // 🆕 Generate IDs for guest orders
    const guestId = isGuest || guestOrder ? generateGuestId() : null;
    
    // Create order data
    const orderData = {
      userId: isGuest || guestOrder ? null : userId,
      orderType: isGuest || guestOrder ? 'guest' : 'user',
      guestId: guestId,
      guestData: isGuest || guestOrder ? {
        sessionId: generateSessionId(req),
        browserFingerprint: getBrowserFingerprint(req),
        ipAddress: getIpAddress(req)
      } : null,
      items: validatedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || item.actualProduct?.image?.[0],
        category: item.category || item.actualProduct?.category,
        isFromDeal: item.isFromDeal || false,
        dealName: item.dealName || null,
        dealImage: item.dealImage || null,
        dealDescription: item.dealDescription || null
      })),
      amount: Number(amount),
      address,
      deliveryCharges: deliveryCharges || 0,
      paymentMethod: paymentMethod,
      payment: paymentMethod === 'COD' ? false : false,
      status: paymentMethod === 'COD' ? "Order Placed" : "Payment Pending",
      date: Date.now(),
      customerDetails: finalCustomerDetails,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
      paymentAmount: Number(amount),
      paymentScreenshot: req.body.paymentScreenshot || null,
      paymentMethodDetail: paymentMethod === 'COD' ? 'COD' : 'online',
      orderPlacedAt: new Date()
    };

    console.log("📝 ORDER DATA:", {
      orderType: orderData.orderType,
      guestId: orderData.guestId,
      customer: orderData.customerDetails.name,
      items: orderData.items.length,
      amount: orderData.amount,
      paymentMethod: orderData.paymentMethod
    });

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log(`✅ Order created: ${newOrder._id}`);

    // Clear cart only for logged-in users with COD orders
    if (!isGuest && paymentMethod === 'COD') {
      await userModel.findByIdAndUpdate(userId, { 
        cartData: {},
        cartDeals: {} 
      });
      console.log(`✅ Cleared cart for user: ${userId}`);
    }

    // Send notification
    await sendOrderPlacedNotification(newOrder);

    // Send payment pending notification for online payments
    if (paymentMethod === 'online') {
      await sendPaymentPendingNotification(newOrder);
    }

    res.json({ 
      success: true, 
      message: paymentMethod === 'COD' 
        ? "Order Placed Successfully" 
        : "Order Placed - Payment Verification Pending",
      orderId: newOrder._id,
      orderType: newOrder.orderType,
      guestId: newOrder.guestId, // Important for guest tracking
      deliveryCharges: newOrder.deliveryCharges,
      customerDetails: newOrder.customerDetails,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      orderStatus: newOrder.status,
      amount: newOrder.amount
    });

  } catch (error) {
    console.error("❌ Error in placeOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ONLINE PAYMENT ORDER FUNCTION (With Screenshot)
// ============================================
const placeOrderWithPayment = async (req, res) => {
  try {
    console.log("💰 ========== ORDER WITH PAYMENT UPLOAD ==========");
    
    const { orderData } = req.body;
    let paymentScreenshot = null;

    // Upload to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "payments",
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto" }
          ],
        });
        
        paymentScreenshot = result.secure_url;
        fs.unlinkSync(req.file.path);
        console.log(`✅ Payment screenshot uploaded`);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload payment screenshot" 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Payment screenshot is required" 
      });
    }

    const parsedOrderData = JSON.parse(orderData);
    
    // Call the main placeOrder function
    req.body = {
      ...parsedOrderData,
      paymentScreenshot: paymentScreenshot,
      paymentStatus: 'pending'
    };
    
    return await placeOrder(req, res);
    
  } catch (error) {
    console.error("❌ Error in placeOrderWithPayment:", error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("❌ Error cleaning up temp file:", cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================
// GUEST CHECKOUT WITH PAYMENT (Public endpoint)
// ============================================
const placeGuestOrderWithPayment = async (req, res) => {
  try {
    console.log("👤 ========== GUEST ORDER WITH PAYMENT ==========");
    
    const { orderData } = req.body;
    let paymentScreenshot = null;

    // Upload to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "payments",
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto" }
          ],
        });
        
        paymentScreenshot = result.secure_url;
        fs.unlinkSync(req.file.path);
        console.log(`✅ Guest payment screenshot uploaded`);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload payment screenshot" 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Payment screenshot is required" 
      });
    }

    const parsedOrderData = JSON.parse(orderData);
    
    // Call the main placeOrder function
    req.body = {
      ...parsedOrderData,
      paymentScreenshot: paymentScreenshot,
      paymentStatus: 'pending',
      guestOrder: true // Mark as guest order
    };
    
    // Remove userId for guest checkout
    req.userId = null;
    
    return await placeOrder(req, res);
    
  } catch (error) {
    console.error("❌ Error in placeGuestOrderWithPayment:", error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("❌ Error cleaning up temp file:", cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================
// VERIFY PAYMENT (Admin Function) - UPDATED
// ============================================
const verifyPayment = async (req, res) => {
  try {
    const { orderId, action, reason } = req.body;
    const adminId = req.userId;

    if (!orderId || !action) {
      return res.status(400).json({ success: false, message: "Order ID and action are required" });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Payment is already ${order.paymentStatus}` });
    }

    let updateData = {};
    let notificationFunction = null;

    if (action === 'approve') {
      // IMPORTANT: Preserve the screenshot in verifiedPayment object
      updateData = {
        paymentStatus: 'verified',
        status: 'Order Placed',
        payment: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        paymentVerifiedAt: new Date(),
        orderConfirmedAt: new Date(),
        // Store screenshot permanently in verifiedPayment
        verifiedPayment: {
          screenshot: order.paymentScreenshot, // Save screenshot here
          verifiedAt: new Date(),
          verifiedBy: adminId,
          amount: order.paymentAmount || order.amount,
          method: order.paymentMethod || 'online',
          transactionId: order._id.toString(), // Use order ID as transaction reference
          action: 'approved'
        }
      };

      // Reduce inventory for approved payments
      console.log("📦 Reducing inventory quantity for verified payment...");
      for (const item of order.items) {
        if (item.id) {
          await productModel.findByIdAndUpdate(
            item.id,
            { 
              $inc: { 
                quantity: -item.quantity,
                totalSales: item.quantity
              } 
            }
          );
          console.log(`✅ Reduced stock for: ${item.name}, Qty: ${item.quantity}`);
        }
      }

      // Clear user cart if it's a user order
      if (order.userId && order.orderType === 'user') {
        await userModel.findByIdAndUpdate(order.userId, { 
          cartData: {},
          cartDeals: {} 
        });
      }

      notificationFunction = () => sendPaymentVerifiedNotification(order);

    } else if (action === 'reject') {
      updateData = {
        paymentStatus: 'rejected',
        status: 'Payment Rejected',
        payment: false,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason || 'Payment verification failed',
        // Still preserve screenshot for reference even if rejected
        verifiedPayment: {
          screenshot: order.paymentScreenshot, // Keep screenshot for audit trail
          verifiedAt: new Date(),
          verifiedBy: adminId,
          amount: order.paymentAmount || order.amount,
          method: order.paymentMethod || 'online',
          transactionId: order._id.toString(),
          action: 'rejected',
          reason: reason || 'Payment verification failed'
        }
      };
      notificationFunction = () => sendPaymentRejectedNotification(order, reason);
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    // Send appropriate notification
    if (notificationFunction) {
      await notificationFunction();
    }

    res.json({ 
      success: true, 
      message: `Payment ${action}ed successfully`,
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in verifyPayment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// TRACK GUEST ORDER (Public endpoint)
// ============================================
const trackGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({ success: false, message: "Order ID and email are required" });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      'customerDetails.email': email,
      orderType: 'guest'
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found. Please check your order ID and email." 
      });
    }

    // Format order for response
    const orderDetails = {
      _id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
      deliveryCharges: order.deliveryCharges,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        isFromDeal: item.isFromDeal,
        dealName: item.dealName
      })),
      address: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode
      },
      customerDetails: {
        name: order.customerDetails.name,
        email: order.customerDetails.email,
        phone: order.customerDetails.phone
      },
      orderPlacedAt: order.orderPlacedAt,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType
    };

    res.json({ 
      success: true, 
      order: orderDetails,
      isGuestOrder: true
    });

  } catch (error) {
    console.error("❌ Error in trackGuestOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET PENDING PAYMENT ORDERS (Admin)
// ============================================
const getPendingPaymentOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ 
      paymentStatus: 'pending',
      paymentMethod: 'online'
    }).sort({ orderPlacedAt: -1 });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in getPendingPaymentOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ALL ORDERS (Admin Panel)
// ============================================
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in allOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET USER ORDERS
// ============================================
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const orders = await orderModel.find({ 
      $or: [
        { userId, orderType: 'user' },
        { convertedToUser: true, userId }
      ]
    }).sort({ date: -1 });
    
    console.log("📦 USER ORDERS RETRIEVED:", {
      totalOrders: orders.length,
      userId
    });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in userOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ORDER DETAILS (works for both guest and user)
// ============================================
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Authorization check
    const isOwner = order.userId && order.userId.toString() === userId;
    const isAdmin = userId === 'admin';
    const isGuestOrder = order.orderType === 'guest';

    if (!isOwner && !isAdmin && !isGuestOrder) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this order" });
    }

    res.json({ 
      success: true, 
      order,
      customerDetails: order.customerDetails,
      isGuestOrder
    });

  } catch (error) {
    console.error("❌ Error in getOrderDetails:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE ORDER STATUS (Admin Panel)
// ============================================
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, cancellationReason } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Order ID and status are required" });
    }

    // Find the current order first
    const currentOrder = await orderModel.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Don't allow status update if payment is pending
    if (currentOrder.paymentStatus === 'pending' && status !== 'Cancelled' && status !== 'Payment Rejected') {
      return res.status(400).json({ success: false, message: "Cannot update status while payment verification is pending" });
    }

    const oldStatus = currentOrder.status;
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };

    // If cancelling order, add cancellation details and restore inventory
    if (status === "Cancelled" && currentOrder.status !== "Cancelled") {
      updateData.cancellationReason = cancellationReason || "Cancelled by admin";
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = "admin";

      // Restore inventory for items that have actual products (only if payment was verified)
      if (currentOrder.paymentStatus === 'verified' || currentOrder.paymentMethod === 'COD') {
        console.log("📦 Restoring inventory quantity for cancelled order...");
        for (const item of currentOrder.items) {
          if (item.id) {
            await productModel.findByIdAndUpdate(
              item.id,
              { 
                $inc: { 
                  quantity: item.quantity,
                  totalSales: -item.quantity
                } 
              }
            );
            console.log(`✅ Restored stock for item: ${item.name}, Qty: ${item.quantity}`);
          }
        }
      }

      await sendOrderCancelledNotification(currentOrder, 'admin', cancellationReason);
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId, 
      updateData, 
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // SEND STATUS UPDATE NOTIFICATION (if status changed)
    if (oldStatus !== status && status !== "Cancelled") {
      await sendOrderStatusUpdateNotification(updatedOrder, oldStatus, status);
    }

    res.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in updateStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CANCEL ORDER (User)
// ============================================
const cancelOrder = async (req, res) => {
  try {
    const { orderId, cancellationReason } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    if (!cancellationReason || cancellationReason.trim() === "") {
      return res.status(400).json({ success: false, message: "Cancellation reason is required" });
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if user owns this order (only for user orders)
    if (order.userId && order.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this order" });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ["Shipped", "Out for delivery", "Delivered", "Cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled as it is already ${order.status.toLowerCase()}` 
      });
    }

    // Check payment status for online orders
    if (order.paymentMethod === 'online' && order.paymentStatus === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot cancel order after payment has been verified" 
      });
    }

    // Restore inventory if payment was verified or it's a COD order
    if (order.paymentStatus === 'verified' || order.paymentMethod === 'COD') {
      console.log("📦 Restoring inventory quantity...");
      for (const item of order.items) {
        if (item.id) {
          await productModel.findByIdAndUpdate(
            item.id,
            { 
              $inc: { 
                quantity: item.quantity,
                totalSales: -item.quantity
              } 
            }
          );
          console.log(`✅ Restored stock for: ${item.name}, Qty: ${item.quantity}`);
        }
      }
    }

    // Update order status and cancellation details
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { 
        status: "Cancelled",
        cancellationReason: cancellationReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: "user",
        updatedAt: new Date()
      },
      { new: true }
    );

    await sendOrderCancelledNotification(updatedOrder, 'user', cancellationReason);

    res.json({ 
      success: true, 
      message: "Order cancelled successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in cancelOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// NOTIFICATION CONTROLLER FUNCTIONS
// ============================================

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    const unreadCount = await notificationModel.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error in getUserNotifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get admin notifications
const getAdminNotifications = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const notifications = await notificationModel
      .find({ isAdmin: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    const unreadCount = await notificationModel.countDocuments({ 
      isAdmin: true, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error in getAdminNotifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.userId;

    const notification = await notificationModel.findOne({ 
      _id: notificationId, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("❌ Error in markNotificationAsRead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await notificationModel.updateMany(
      { userId, isRead: false },
      { 
        isRead: true
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error("❌ Error in markAllNotificationsAsRead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET CANCELLATION REASONS
// ============================================
const getCancellationReasons = async (req, res) => {
  try {
    const cancellationReasons = [
      "Changed my mind",
      "Found better price elsewhere",
      "Delivery time too long",
      "Ordered by mistake",
      "Product not required anymore",
      "Payment issues",
      "Duplicate order",
      "Shipping address issues",
      "Other"
    ];

    res.json({ success: true, cancellationReasons });
  } catch (error) {
    console.error("❌ Error in getCancellationReasons:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CHECK STOCK
// ============================================
const checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${product.quantity} items available`,
        availableQuantity: product.quantity
      });
    }
    
    res.json({ 
      success: true, 
      message: "Product available",
      availableQuantity: product.quantity
    });
    
  } catch (error) {
    console.error("❌ Error in checkStock:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CONVERT GUEST ORDER TO USER ORDER
// ============================================
const convertGuestOrderToUser = async (req, res) => {
  try {
    const { guestId, orderId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User must be logged in" });
    }

    // Find guest orders by guestId or specific orderId
    let query = { orderType: 'guest' };
    
    if (orderId) {
      query._id = orderId;
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      // Find by email (when user registers/creates account with same email)
      const user = await userModel.findById(userId);
      if (!user || !user.email) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      query['customerDetails.email'] = user.email;
    }

    // Find guest orders
    const guestOrders = await orderModel.find(query);
    
    if (guestOrders.length === 0) {
      return res.json({ 
        success: true, 
        message: "No guest orders found to convert",
        convertedCount: 0 
      });
    }

    let convertedCount = 0;
    const user = await userModel.findById(userId);

    for (const order of guestOrders) {
      // Skip if already converted or delivered/cancelled
      if (order.convertedToUser || 
          order.status === 'Delivered' || 
          order.status === 'Cancelled') {
        continue;
      }

      // Update order to user type
      order.userId = userId;
      order.orderType = 'user';
      order.convertedToUser = true;
      order.convertedAt = new Date();
      order.convertedFromGuestId = order.guestId;
      order.guestId = null;
      order.expiresAt = null; // Remove expiration
      
      // Update customer details from user profile if not already set
      if (!order.customerDetails.name && user.name) {
        order.customerDetails.name = user.name;
      }
      if (!order.customerDetails.email && user.email) {
        order.customerDetails.email = user.email;
      }
      if (!order.customerDetails.phone && user.phone) {
        order.customerDetails.phone = user.phone;
      }

      await order.save();
      convertedCount++;
      
      console.log(`✅ Converted guest order ${order._id} to user order for user ${userId}`);
    }

    res.json({ 
      success: true, 
      message: `Converted ${convertedCount} guest order(s) to your account`,
      convertedCount 
    });

  } catch (error) {
    console.error("❌ Error converting guest orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
export { 
  placeOrder, 
  placeOrderWithPayment,
  placeGuestOrderWithPayment,
  verifyPayment,
  getPendingPaymentOrders,
  allOrders, 
  userOrders, 
  getOrderDetails,
  updateStatus, 
  cancelOrder,
  getCancellationReasons,
  checkStock,
  // Guest functions
  trackGuestOrder,
  convertGuestOrderToUser,
  // Notification functions
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};