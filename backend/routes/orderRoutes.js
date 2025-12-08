import express from "express"
import { 
  placeOrder, 
  placeOrderWithPayment, 
  verifyPayment, 
  getPendingPaymentOrders, 
  allOrders, 
  userOrders, 
  updateStatus, 
  cancelOrder,
  getCancellationReasons,
  checkStock,
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getOrderDetails
} from "../controllers/orderController.js"
import { authUser } from "../middleware/auth.js"
import adminAuth from "../middleware/adminAuth.js"
import upload from "../middleware/multer.js"

const orderRoutes = express.Router()

// Admin routes
orderRoutes.get("/list", adminAuth, allOrders)
orderRoutes.post("/status", adminAuth, updateStatus)

// Payment verification routes (Admin)
orderRoutes.get("/pending-payments", adminAuth, getPendingPaymentOrders)
orderRoutes.post("/verify-payment", adminAuth, verifyPayment)

// Order placement routes
orderRoutes.post("/place-order", authUser, placeOrder) // For COD orders
orderRoutes.post("/place-order-with-payment", authUser, upload.single('payment_screenshot'), placeOrderWithPayment) // For online payments

// User orders
orderRoutes.post("/userorders", authUser, userOrders)
orderRoutes.post("/cancel", authUser, cancelOrder)
orderRoutes.get("/:orderId", authUser, getOrderDetails)

// Cancellation reasons
orderRoutes.get("/cancellation-reasons", getCancellationReasons)

// Stock check
orderRoutes.post("/check-stock", authUser, checkStock)

// Notification routes
orderRoutes.get("/notifications", authUser, getUserNotifications)
orderRoutes.get("/admin/notifications", adminAuth, getAdminNotifications)
orderRoutes.post("/notifications/mark-read", authUser, markNotificationAsRead)
orderRoutes.post("/notifications/mark-all-read", authUser, markAllNotificationsAsRead)

export default orderRoutes