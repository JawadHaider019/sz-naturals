// controllers/cartController.js
import userModel from "../models/userModel.js";

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, quantity } = req.body;

    // Validate input
    if (!itemId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };
    cartData.products[itemId] = (cartData.products[itemId] || 0) + (quantity || 1);

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Product added to cart" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add deal to cart
const addDealToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { dealId, quantity } = req.body;

    // Validate input
    if (!dealId) {
      return res.status(400).json({ success: false, message: "Deal ID is required" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };
    cartData.deals[dealId] = (cartData.deals[dealId] || 0) + (quantity || 1);

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Deal added to cart" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get cart
const getCart = async (req, res) => {
  try {
    const userId = req.userId; 
    const userData = await userModel.findById(userId);

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };
    res.json({ success: true, cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product quantity
const updateCart = async (req, res) => {
  try {
    const userId = req.userId; 
    const { itemId, quantity } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };

    if (quantity <= 0) {
      delete cartData.products[itemId];
    } else {
      cartData.products[itemId] = quantity;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update deal quantity
const updateDealQuantity = async (req, res) => {
  try {
    const userId = req.userId; 
    const { dealId, quantity } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };

    if (quantity <= 0) {
      delete cartData.deals[dealId];
    } else {
      cartData.deals[dealId] = quantity;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Deal quantity updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from cart (both product and deal)
const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId, itemType = 'product' } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || { products: {}, deals: {} };

    if (itemType === 'deal') {
      delete cartData.deals[itemId];
    } else {
      delete cartData.products[itemId];
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await userModel.findByIdAndUpdate(userId, { 
      cartData: { products: {}, deals: {} } 
    });
    
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { 
  addToCart, 
  addDealToCart, 
  getCart, 
  updateCart, 
  updateDealQuantity, 
  removeFromCart, 
  clearCart 
};