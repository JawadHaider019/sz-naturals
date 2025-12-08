import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import notificationModel from "../models/notifcationModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Notification Types
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

// Create Notification Function
const createNotification = async (notificationData) => {
  try {
    const notification = new notificationModel(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Send Payment Verified Notification
const sendPaymentVerifiedNotification = async (order) => {
  const shortOrderId = order._id.toString().slice(-6);
  const customerName = order.customerDetails?.name || 'Customer';

  // User notification
  await createNotification({
    userId: order.userId,
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

  console.log(`Payment verified notification sent for order ${order._id}`);
};

// Send Payment Rejected Notification
const sendPaymentRejectedNotification = async (order, reason) => {
  const shortOrderId = order._id.toString().slice(-6);
  const customerName = order.customerDetails?.name || 'Customer';

  // User notification
  await createNotification({
    userId: order.userId,
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

  console.log(`Payment rejected notification sent for order ${order._id}`);
};

// Send Payment Pending Notification
const sendPaymentPendingNotification = async (order) => {
  const shortOrderId = order._id.toString().slice(-6);
  const customerName = order.customerDetails?.name || 'Customer';

  // User notification
  await createNotification({
    userId: order.userId,
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

  console.log(`Payment pending notification sent for order ${order._id}`);
};

// Send Order Placed Notification
const sendOrderPlacedNotification = async (order) => {
  const userDetails = await userModel.findById(order.userId);
  const shortOrderId = order._id.toString().slice(-6);
  
  const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
  const customerEmail = order.customerDetails?.email || userDetails?.email || '';
  
  // User notification
  await createNotification({
    userId: order.userId,
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

  // Admin notification
  await createNotification({
    userId: 'admin',
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: order.paymentStatus === 'pending' ? '⏳ New Order - Payment Pending' : '🛒 New Order Received',
    message: order.paymentStatus === 'pending'
      ? `New order #${shortOrderId} from ${customerName}. Payment verification required.`
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
      paymentStatus: order.paymentStatus
    }
  });

  console.log(`Order placed notifications sent for order ${order._id}`);
};

// Send Order Cancelled Notification
const sendOrderCancelledNotification = async (order, cancelledBy, reason = '') => {
  const userDetails = await userModel.findById(order.userId);
  const shortOrderId = order._id.toString().slice(-6);
  const cancelledByText = cancelledBy === 'user' ? 'You have' : 'Admin has';
  
  const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
  
  // User notification
  await createNotification({
    userId: order.userId,
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

  // Admin notification (if cancelled by user)
  if (cancelledBy === 'user') {
    await createNotification({
      userId: 'admin',
      type: NOTIFICATION_TYPES.ORDER_CANCELLED,
      title: '❌ Order Cancelled by Customer',
      message: `Order #${shortOrderId} cancelled by ${customerName}.${reason ? ` Reason: ${reason}` : ''}`,
      relatedId: order._id.toString(),
      relatedType: 'order',
      isAdmin: true,
      actionUrl: `/admin/orders/${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        customerName: customerName,
        reason,
        amount: order.amount
      }
    });
  }

  console.log(`Order cancelled notifications sent for order ${order._id}`);
};

// Send Order Status Update Notification
const sendOrderStatusUpdateNotification = async (order, oldStatus, newStatus) => {
  const statusMessages = {
    'Processing': 'is being processed',
    'Shipped': 'has been shipped',
    'Out for delivery': 'is out for delivery',
    'Delivered': 'has been delivered successfully! 🎉',
    'Cancelled': 'has been cancelled'
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
  const shortOrderId = order._id.toString().slice(-6);

  await createNotification({
    userId: order.userId,
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

  console.log(`Order status update notification sent for order ${order._id}`);
};


const placeOrder = async (req, res) => {
  try {
    console.log("🛒 ========== COD ORDER PLACEMENT ==========");
    
    const { items, amount, address, deliveryCharges, customerDetails, paymentMethod = 'COD' } = req.body;
    const userId = req.userId;

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

    // Validate payment method - must be COD for this endpoint
    if (paymentMethod !== 'COD') {
      return res.status(400).json({ 
        success: false, 
        message: "This endpoint is for COD orders only. Use placeOrderWithPayment for online payments." 
      });
    }

    // Get user profile
    const userProfile = await userModel.findById(userId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Set customer details
    let finalCustomerDetails = {
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

    // Check stock availability AND reduce inventory for COD orders
    console.log("📦 Checking stock availability and reducing inventory for COD order...");
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

      // For deal items, be more lenient
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
        console.log(`❌ Product not found: ${item.name}`);
        return res.status(400).json({ success: false, message: `Product "${item.name}" not found` });
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

      console.log(`✅ Validated product: ${product.name}, Qty: ${item.quantity}`);
      
      // Reduce inventory for COD orders immediately
      await productModel.findByIdAndUpdate(
        product._id,
        { 
          $inc: { 
            quantity: -item.quantity,
            totalSales: item.quantity
          } 
        }
      );
      console.log(`📉 Reduced inventory for COD order: ${product.name}, Qty: ${item.quantity}`);

      validatedItems.push({
        ...item,
        id: product._id.toString(),
        name: product.name,
        actualProduct: product
      });
    }

    console.log(`📦 Validated and reduced inventory for ${validatedItems.length} items for COD order`);

    // Create order data for COD
    const orderData = {
      userId,
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
      
      // COD Specific fields
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      paymentAmount: Number(amount), // Full amount for COD
      payment: false, // Not paid yet
      
      // Order status
      status: "Order Placed",
      date: Date.now(),
      customerDetails: finalCustomerDetails,
      orderPlacedAt: new Date()
    };

    console.log("📝 COD ORDER DATA SAVED:", {
      totalItems: orderData.items.length,
      customerName: orderData.customerDetails.name,
      paymentMethod: orderData.paymentMethod,
      paymentAmount: orderData.paymentAmount,
      orderStatus: orderData.status
    });

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log(`✅ COD Order created: ${newOrder._id} with status: ${newOrder.status}`);

    // Clear user cart for COD orders
    await userModel.findByIdAndUpdate(userId, { 
      cartData: {},
      cartDeals: {} 
    });
    console.log(`✅ Cleared cart for user: ${userId}`);

    // Send notification
    await sendOrderPlacedNotification(newOrder);

    res.status(201).json({ 
      success: true, 
      message: "COD Order Placed Successfully",
      orderId: newOrder._id,
      deliveryCharges: newOrder.deliveryCharges,
      customerDetails: newOrder.customerDetails,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      orderStatus: newOrder.status,
      amount: newOrder.amount
    });

  } catch (error) {
    console.error("❌ Error in placeOrder (COD):", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ONLINE PAYMENT ORDER FUNCTION (With Screenshot)
// ============================================
const placeOrderWithPayment = async (req, res) => {
  try {
    console.log("💰 ========== ONLINE PAYMENT ORDER ==========");
    
    const { orderData } = req.body;
    let paymentScreenshot = null;

    // Upload payment screenshot to Cloudinary
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "payments",
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto" }
          ],
        });
        
        paymentScreenshot = result.secure_url;
        
        // Remove temporary file
        fs.unlinkSync(req.file.path);
        
        console.log(`✅ Payment screenshot uploaded to Cloudinary: ${paymentScreenshot}`);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(400).json({ 
          success: false, 
          message: "Failed to upload payment screenshot" 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Payment screenshot is required for online payments" 
      });
    }

    const parsedOrderData = JSON.parse(orderData);
    
    // Validate payment method
    if (parsedOrderData.paymentMethod !== 'online') {
      return res.status(400).json({ 
        success: false, 
        message: "This endpoint is for online payments only. Use placeOrder for COD orders." 
      });
    }

    // Call the main placeOrder function with payment data
    req.body = {
      ...parsedOrderData,
      paymentScreenshot: paymentScreenshot,
      paymentStatus: 'pending' // Set to pending for admin verification
    };
    
    // Set a flag to indicate this is an online payment
    req.isOnlinePayment = true;
    
    return await processOrderWithPayment(req, res);
    
  } catch (error) {
    console.error("❌ Error in placeOrderWithPayment:", error);
    
    // Clean up temporary file if it exists
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

// Process Online Payment Order
const processOrderWithPayment = async (req, res) => {
  try {
    const { items, amount, address, deliveryCharges, customerDetails, paymentMethod = 'online', paymentScreenshot } = req.body;
    const userId = req.userId;

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

    if (paymentMethod !== 'online') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment method for online payment" 
      });
    }

    if (!paymentScreenshot) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment screenshot is required" 
      });
    }

    // Get user profile
    const userProfile = await userModel.findById(userId);
    if (!userProfile) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Set customer details
    let finalCustomerDetails = {
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

    // Check stock availability
    console.log("📦 Checking stock availability for online order...");
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

      // For deal items, be more lenient
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
        console.log(`❌ Product not found: ${item.name}`);
        return res.status(400).json({ success: false, message: `Product "${item.name}" not found` });
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

      console.log(`✅ Validated product: ${product.name}, Qty: ${item.quantity}`);

      validatedItems.push({
        ...item,
        id: product._id.toString(),
        name: product.name,
        actualProduct: product
      });
    }

    console.log(`📦 Validated ${validatedItems.length} items for online order`);

    // Create order data for online payment
    const orderData = {
      userId,
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
      
      // Online Payment Specific fields
      paymentMethod: 'online',
      paymentStatus: 'pending',
      paymentAmount: Number(amount), // Full amount paid online
      paymentScreenshot: paymentScreenshot,
      payment: false, // Not verified yet
      
      // Order status
      status: "Payment Pending",
      date: Date.now(),
      customerDetails: finalCustomerDetails,
      orderPlacedAt: new Date()
    };

    console.log("📝 ONLINE PAYMENT ORDER DATA SAVED:", {
      totalItems: orderData.items.length,
      customerName: orderData.customerDetails.name,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.status
    });

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log(`✅ Online Payment Order created: ${newOrder._id} with status: ${newOrder.status}`);

    // Send payment pending notification
    await sendPaymentPendingNotification(newOrder);

    res.status(201).json({ 
      success: true, 
      message: "Order Placed Successfully - Payment Verification Pending",
      orderId: newOrder._id,
      deliveryCharges: newOrder.deliveryCharges,
      customerDetails: newOrder.customerDetails,
      paymentMethod: newOrder.paymentMethod,
      paymentStatus: newOrder.paymentStatus,
      orderStatus: newOrder.status,
      amount: newOrder.amount,
      note: "Your order is pending payment verification. Our team will verify your payment screenshot shortly."
    });

  } catch (error) {
    console.error("❌ Error in processOrderWithPayment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// PAYMENT VERIFICATION (Admin)
// ============================================
const verifyPayment = async (req, res) => {
  try {
    const { orderId, action, reason } = req.body;
    const adminId = req.userId;

    if (!orderId || !action) {
      return res.status(400).json({ success: false, message: "Order ID and action are required" });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Payment is already ${order.paymentStatus}` 
      });
    }

    let updateData = {};
    let notificationFunction = null;

    if (action === 'approve') {
      updateData = {
        paymentStatus: 'verified',
        status: 'Order Placed',
        payment: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        paymentVerifiedAt: new Date(),
        orderConfirmedAt: new Date()
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

      // Clear user cart for online payments
      if (order.paymentMethod === 'online') {
        await userModel.findByIdAndUpdate(order.userId, { 
          cartData: {},
          cartDeals: {} 
        });
        console.log(`✅ Cleared cart for user: ${order.userId}`);
      }

      notificationFunction = sendPaymentVerifiedNotification;

    } else if (action === 'reject') {
      updateData = {
        paymentStatus: 'rejected',
        status: 'Payment Rejected',
        payment: false,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason || 'Payment verification failed'
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
      await notificationFunction(updatedOrder);
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

// Get Pending Payment Orders
const getPendingPaymentOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ 
      paymentStatus: 'pending',
      paymentMethod: 'online' // Only show online payments pending verification
    }).sort({ orderPlacedAt: -1 });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in getPendingPaymentOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Orders (Admin Panel)
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in allOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Logged-in User Orders
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    
    console.log("📦 USER ORDERS RETRIEVED:", {
      totalOrders: orders.length,
      paymentMethods: orders.map(o => o.paymentMethod),
      paymentStatuses: orders.map(o => o.paymentStatus)
    });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in userOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (order.userId !== userId && userId !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized to view this order" });
    }

    res.json({ 
      success: true, 
      order,
      customerDetails: order.customerDetails
    });

  } catch (error) {
    console.error("❌ Error in getOrderDetails:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status (Admin Panel)
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, cancellationReason } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Order ID and status are required" });
    }

    const currentOrder = await orderModel.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Don't allow status update if payment is pending for online orders
    if (currentOrder.paymentMethod === 'online' && 
        currentOrder.paymentStatus === 'pending' && 
        status !== 'Cancelled' && 
        status !== 'Payment Rejected') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update status while payment verification is pending" 
      });
    }

    const oldStatus = currentOrder.status;
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };

    // If cancelling order
    if (status === "Cancelled" && currentOrder.status !== "Cancelled") {
      updateData.cancellationReason = cancellationReason || "Cancelled by admin";
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = "admin";

      // Restore inventory for orders that had inventory reduced
      // For COD: inventory was reduced when order was placed
      // For Online: inventory was reduced only when payment was verified
      
      if (currentOrder.paymentMethod === 'COD' || 
          (currentOrder.paymentMethod === 'online' && currentOrder.paymentStatus === 'verified')) {
        
        console.log("📦 Restoring inventory quantity for cancelled order...");
        for (const item of currentOrder.items) {
          if (item.id) {
            const product = await productModel.findById(item.id);
            if (product) {
              // Calculate new total sales
              const newTotalSales = Math.max(0, product.totalSales - item.quantity);
              
              await productModel.findByIdAndUpdate(
                item.id,
                { 
                  $inc: { 
                    quantity: item.quantity
                  },
                  $set: {
                    totalSales: newTotalSales
                  }
                }
              );
              console.log(`✅ Restored stock for: ${item.name}, Qty: ${item.quantity}, Adjusted totalSales to: ${newTotalSales}`);
            }
          }
        }
      } else {
        console.log("ℹ️ No inventory adjustment needed - payment not verified");
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

    // Send status update notification
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

    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.userId !== userId) {
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

    // Restore inventory if inventory was reduced
    // For COD: inventory was reduced when order was placed
    // For Online: inventory was only reduced if payment was verified (but we already blocked that above)
    
    if (order.paymentMethod === 'COD') {
      console.log("📦 Restoring inventory quantity for cancelled COD order...");
      for (const item of order.items) {
        if (item.id) {
          const product = await productModel.findById(item.id);
          if (product) {
            // Calculate new total sales
            const newTotalSales = Math.max(0, product.totalSales - item.quantity);
            
            await productModel.findByIdAndUpdate(
              item.id,
              { 
                $inc: { 
                  quantity: item.quantity
                },
                $set: {
                  totalSales: newTotalSales
                }
              }
            );
            console.log(`✅ Restored stock for: ${item.name}, Qty: ${item.quantity}, Adjusted totalSales to: ${newTotalSales}`);
          }
        }
      }
    }

    // Update order status
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
// Notification Functions
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
    notification.readAt = new Date();
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

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await notificationModel.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
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

const checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    if (product.quantity < quantity) {
      return res.json({ 
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

export { 
  placeOrder, // COD orders
  placeOrderWithPayment, // Online payments with screenshot
  verifyPayment, // Admin payment verification
  getPendingPaymentOrders, // Get pending payment orders
  allOrders, 
  userOrders, 
  getOrderDetails,
  updateStatus, 
  cancelOrder,
  getCancellationReasons,
  checkStock,
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};