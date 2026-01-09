import express from "express"
import { 
  placeOrder, 
  placeOrderWithPayment,
  placeGuestOrderWithPayment,
  trackGuestOrder,
  convertGuestOrderToUser,
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

// 🆕 GUEST ROUTES (No authentication required)
orderRoutes.post("/guest/place-with-payment", upload.single('payment_screenshot'), placeGuestOrderWithPayment)
orderRoutes.post("/guest/track", trackGuestOrder)

// 🆕 USER ROUTES (Authentication required)
orderRoutes.post("/place", authUser, placeOrder)
orderRoutes.post("/place-with-payment", authUser, upload.single('payment_screenshot'), placeOrderWithPayment)
orderRoutes.post("/guest/convert", authUser, convertGuestOrderToUser)

// Admin routes
orderRoutes.get("/list", adminAuth, allOrders)
orderRoutes.post("/status", adminAuth, updateStatus)
orderRoutes.get("/pending-payments", adminAuth, getPendingPaymentOrders)
orderRoutes.post("/verify-payment", adminAuth, verifyPayment)

// User orders
orderRoutes.get("/user", authUser, userOrders)
orderRoutes.post("/cancel", authUser, cancelOrder)
orderRoutes.get("/:orderId", getOrderDetails) // Allow both guest and user access

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