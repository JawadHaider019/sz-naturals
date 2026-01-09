// routes/cartRoutes.js
import express from "express"
import { 
  addToCart, 
  addDealToCart, 
  getCart, 
  updateCart, 
  updateDealQuantity, 
  removeFromCart, 
  clearCart 
} from "../controllers/cartController.js"
import { authUser } from "../middleware/auth.js"

const cartRoutes = express.Router()

cartRoutes.get("/", authUser, getCart)
cartRoutes.post("/add", authUser, addToCart)
cartRoutes.post("/add-deal", authUser, addDealToCart)
cartRoutes.post("/update", authUser, updateCart)
cartRoutes.post("/update-deal", authUser, updateDealQuantity)
cartRoutes.post("/remove", authUser, removeFromCart)
cartRoutes.post("/clear", authUser, clearCart)

export default cartRoutes;