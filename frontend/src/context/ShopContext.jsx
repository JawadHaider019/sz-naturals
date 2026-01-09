import { createContext, useState, useMemo, useCallback, useEffect } from "react";
import { toast } from 'react-toastify';
import axios from 'axios';
import Loader from '../components/Loader';

export const ShopContext = createContext();

// Cache for frequently accessed data
const dataCache = {
  products: null,
  deals: null,
  deliverySettings: null,
  timestamp: 0,
  CACHE_DURATION: 2 * 60 * 1000 // 2 minutes
};

const ShopContextProvider = ({ children }) => {
  const CURRENCY = "Rs. ";
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [token, setToken] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [cartDeals, setCartDeals] = useState({});
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  
  // Simplified loading states - only for initial load
  const [initialLoading, setInitialLoading] = useState({
    products: false,
    deals: false,
  });
  
  const [user, setUser] = useState(null);
  const [productReviews, setProductReviews] = useState({});
  const [dealReviews, setDealReviews] = useState({});
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  // Loading states for UI components
  const [loading, setLoading] = useState({
    products: { status: false, message: "Loading products..." },
    deals: { status: false, message: "Loading deals..." },
    general: { status: false, message: "Updating data..." },
    cart: { status: false, message: "Updating cart..." },
    reviews: { status: false, message: "Loading reviews..." },
    user: { status: false, message: "Loading user data..." }
  });

  // ==================== BACKEND AVAILABILITY CHECK ====================

  const checkBackendAvailability = useCallback(async () => {
    try {
      await axios.get(`${BACKEND_URL}/`, { timeout: 3000 });
      setIsBackendAvailable(true);
    } catch (error) {
      setIsBackendAvailable(false);
    }
  }, [BACKEND_URL]);

  // ==================== LOADING MANAGEMENT ====================

  const setLoadingState = useCallback((key, status, message = null) => {
    setLoading(prev => ({
      ...prev,
      [key]: {
        status,
        message: message || prev[key]?.message || "Loading..."
      }
    }));
  }, []);

  const isLoadingAny = useCallback(() => {
    return Object.values(loading).some(item => item.status === true);
  }, [loading]);

  const getLoadingMessage = useCallback(() => {
    const activeLoaders = Object.entries(loading).filter(([_, item]) => item.status);
    return activeLoaders.length > 0 ? activeLoaders[0][1].message : "Loading...";
  }, [loading]);

  // ==================== CART PERSISTENCE & LOGIN HANDLING ====================

  // Load cart from localStorage on initial load ONLY
  useEffect(() => {
    if (!hasLoadedCart) {
      const savedCartItems = localStorage.getItem('cartItems');
      const savedCartDeals = localStorage.getItem('cartDeals');
      
      if (savedCartItems) setCartItems(JSON.parse(savedCartItems));
      if (savedCartDeals) setCartDeals(JSON.parse(savedCartDeals));
      setHasLoadedCart(true);
    }
  }, [hasLoadedCart]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cartItems).length > 0 || Object.keys(cartDeals).length > 0) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      localStorage.setItem('cartDeals', JSON.stringify(cartDeals));
    } else {
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartDeals');
    }
  }, [cartItems, cartDeals]);

  // Load user cart when logged in
  useEffect(() => {
    if (token && user && isBackendAvailable && hasLoadedCart) {
      loadUserCartAndMerge();
    }
  }, [token, user, isBackendAvailable, hasLoadedCart]);

  const loadUserCartAndMerge = async () => {
    try {
      const currentLocalItems = { ...cartItems };
      const currentLocalDeals = { ...cartDeals };
      
      const response = await axios.get(`${BACKEND_URL}/api/cart`, {
        headers: { token },
        timeout: 5000
      });
      
      if (response.data.success) {
        const serverCartItems = response.data.cartData?.products || {};
        const serverCartDeals = response.data.cartData?.deals || {};
        
        const mergedCartItems = { ...serverCartItems };
        const mergedCartDeals = { ...serverCartDeals };
        
        Object.entries(currentLocalItems).forEach(([itemId, quantity]) => {
          if (quantity > 0 && !serverCartItems[itemId]) {
            mergedCartItems[itemId] = quantity;
          }
        });
        
        Object.entries(currentLocalDeals).forEach(([dealId, quantity]) => {
          if (quantity > 0 && !serverCartDeals[dealId]) {
            mergedCartDeals[dealId] = quantity;
          }
        });
        
        setCartItems(mergedCartItems);
        setCartDeals(mergedCartDeals);
        
        if (Object.keys(mergedCartItems).length > Object.keys(serverCartItems).length ||
            Object.keys(mergedCartDeals).length > Object.keys(serverCartDeals).length) {
          await syncMergedCartToServer(mergedCartItems, mergedCartDeals);
        }
        
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartDeals');
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const syncMergedCartToServer = async (mergedItems, mergedDeals) => {
    try {
      await axios.post(`${BACKEND_URL}/api/cart/sync`, {
        products: mergedItems,
        deals: mergedDeals
      }, {
        headers: { token },
        timeout: 5000
      });
    } catch (error) {
      // Silent error handling
    }
  };

  const clearCart = async () => {
    setCartItems({});
    setCartDeals({});
    
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartDeals');
    
    if (token && isBackendAvailable) {
      try {
        await axios.post(`${BACKEND_URL}/api/cart/clear`, {}, {
          headers: { token },
          timeout: 5000
        });
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // ==================== CART OPERATIONS ====================

  const updateCartItemQuantity = useCallback(async (itemId, quantity, itemType = 'product') => {
    if (itemType === 'deal') {
      await updateDealQuantity(itemId, quantity);
    } else {
      if (!itemId || quantity < 0) return;

      const product = products.find(p => p._id === itemId);
      if (quantity > 0 && product?.stock && quantity > product.stock) {
        toast.error(`Only ${product.stock} items available`);
        return;
      }

      setCartItems(prev => {
        const updated = { ...prev };
        quantity === 0 ? delete updated[itemId] : (updated[itemId] = quantity);
        
        if (Object.keys(updated).length > 0) {
          localStorage.setItem('cartItems', JSON.stringify(updated));
        } else {
          localStorage.removeItem('cartItems');
        }
        
        return updated;
      });

      if (token && isBackendAvailable) {
        try {
          await axios.post(
            `${BACKEND_URL}/api/cart/update`,
            { itemId, quantity },
            { 
              headers: { token },
              timeout: 5000
            }
          );
        } catch (error) {
          // Silent error handling
        }
      }
    }
  }, [token, BACKEND_URL, products, isBackendAvailable]);

  const updateDealQuantity = useCallback(async (dealId, quantity) => {
    if (!dealId || quantity < 0) return;

    const deal = deals.find(d => d._id === dealId);
    if (quantity > 0 && deal?.quantity && quantity > deal.quantity) {
      toast.error(`Only ${deal.quantity} items available`);
      return;
    }

    setCartDeals(prev => {
      const updated = { ...prev };
      quantity === 0 ? delete updated[dealId] : (updated[dealId] = quantity);
      
      if (Object.keys(updated).length > 0) {
        localStorage.setItem('cartDeals', JSON.stringify(updated));
      } else {
        localStorage.removeItem('cartDeals');
      }
      
      return updated;
    });

    if (token && isBackendAvailable) {
      try {
        await axios.post(
          `${BACKEND_URL}/api/cart/update-deal`,
          { dealId, quantity },
          { 
            headers: { token },
            timeout: 5000
          }
        );
      } catch (error) {
        // Silent error handling
      }
    }
  }, [token, BACKEND_URL, deals, isBackendAvailable]);

  const addToCart = useCallback(async (itemId, quantity = 1, itemType = 'product') => {
    if (itemType === 'deal') {
      await addDealToCart(itemId, quantity);
    } else {
      if (!itemId || quantity < 1) return;

      const product = products.find(p => p._id === itemId);
      const currentQuantity = cartItems[itemId] || 0;

      if (product?.stock && product.stock < currentQuantity + quantity) {
        toast.error(`Only ${product.stock} items available`);
        return;
      }

      setCartItems(prev => {
        const updated = {
          ...prev,
          [itemId]: (prev[itemId] || 0) + quantity
        };
        
        localStorage.setItem('cartItems', JSON.stringify(updated));
        return updated;
      });

      if (token && isBackendAvailable) {
        try {
          await axios.post(
            `${BACKEND_URL}/api/cart/add`,
            { itemId, quantity },
            { 
              headers: { token },
              timeout: 5000
            }
          );
          toast.success("Product added to cart!");
        } catch (error) {
          // Rollback on error
          setCartItems(prev => {
            const updated = { ...prev };
            updated[itemId] <= quantity ? delete updated[itemId] : (updated[itemId] -= quantity);
            localStorage.setItem('cartItems', JSON.stringify(updated));
            return updated;
          });
        }
      } else {
        toast.success("Product added to cart!");
      }
    }
  }, [token, BACKEND_URL, cartItems, products, isBackendAvailable]);

  const addDealToCart = useCallback(async (dealId, quantity = 1) => {
    if (!dealId || quantity < 1) return;

    const deal = deals.find(d => d._id === dealId);
    if (!deal) return;

    const currentQuantity = cartDeals[dealId] || 0;
    if (deal.quantity && deal.quantity < currentQuantity + quantity) {
      toast.error(`Only ${deal.quantity} items available`);
      return;
    }

    setCartDeals(prev => {
      const updated = {
        ...prev,
        [dealId]: (prev[dealId] || 0) + quantity
      };
      
      localStorage.setItem('cartDeals', JSON.stringify(updated));
      return updated;
    });

    if (token && isBackendAvailable) {
      try {
        await axios.post(
          `${BACKEND_URL}/api/cart/add-deal`,
          { dealId, quantity },
          { 
            headers: { token },
            timeout: 5000
          }
        );
        toast.success("Deal added to cart!");
      } catch (error) {
        // Rollback on error
        setCartDeals(prev => {
          const updated = { ...prev };
          updated[dealId] <= quantity ? delete updated[dealId] : (updated[dealId] -= quantity);
          localStorage.setItem('cartDeals', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      toast.success("Deal added to cart!");
    }
  }, [token, BACKEND_URL, deals, cartDeals, isBackendAvailable]);

  const removeDealFromCart = useCallback(async (dealId) => {
    await updateDealQuantity(dealId, 0);
  }, [updateDealQuantity]);

  // ==================== STOCK & DATA FUNCTIONS ====================

  const checkProductStock = useCallback((productId, requestedQuantity = 1) => {
    const product = products.find(p => p._id === productId);
    if (!product) return { inStock: false, available: 0 };

    const availableStock = product.stock || 0;
    const inStock = availableStock >= requestedQuantity;

    return { inStock, available: availableStock, requested: requestedQuantity };
  }, [products]);

  const checkDealStock = useCallback((dealId, requestedQuantity = 1) => {
    const deal = deals.find(d => d._id === dealId);
    if (!deal) return { inStock: false, available: 0 };

    const availableStock = deal.quantity || 0;
    const inStock = availableStock >= requestedQuantity;

    return { inStock, available: availableStock, requested: requestedQuantity };
  }, [deals]);

  const decodeToken = useCallback((token) => {
    try {
      if (!token) return null;
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }, []);

  // ==================== OPTIMIZED DATA FETCHING (SHOW DATA IMMEDIATELY) ====================

  const fetchUserData = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      return;
    }

    setLoadingState('user', true, "Loading user profile...");
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user/data`, {
        headers: { token: storedToken },
        timeout: 5000
      });

      if (response.data?.success) {
        setUser({
          ...response.data.user,
          isLoggedIn: true
        });
        setToken(storedToken);
      } else {
        const decoded = decodeToken(storedToken);
        if (decoded?.id) {
          setUser({
            _id: decoded.id,
            name: decoded.name || 'User',
            email: decoded.email || '',
            isLoggedIn: true
          });
          setToken(storedToken);
        } else {
          setUser(null);
          setToken('');
          localStorage.removeItem('token');
        }
      }
    } catch {
      setUser(null);
      setToken('');
      localStorage.removeItem('token');
    } finally {
      setLoadingState('user', false);
    }
  }, [BACKEND_URL, decodeToken, setLoadingState]);

  const fetchDeliverySettings = useCallback(async () => {
    const now = Date.now();
    if (dataCache.deliverySettings && now - dataCache.timestamp < dataCache.CACHE_DURATION) {
      setDeliverySettings(dataCache.deliverySettings);
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/delivery-settings`, {
        timeout: 5000
      });
      const settings = response.data?.settings || response.data;
      if (settings) {
        dataCache.deliverySettings = settings;
        dataCache.timestamp = now;
        setDeliverySettings(settings);
      }
    } catch {
      // Silent error handling
    }
  }, [BACKEND_URL]);

  const updateDeliverySettings = useCallback(async (settings) => {
    setLoadingState('general', true, "Updating delivery settings...");
    try {
      const response = await axios.post(`${BACKEND_URL}/api/delivery-settings`, settings, {
        timeout: 5000
      });
      const updatedSettings = response.data?.settings || response.data;
      
      if (updatedSettings) {
        dataCache.deliverySettings = updatedSettings;
        dataCache.timestamp = Date.now();
        setDeliverySettings(updatedSettings);
        toast.success("Delivery settings updated successfully");
        return true;
      }
      return false;
    } catch (error) {
      toast.error("Failed to update delivery settings");
      return false;
    } finally {
      setLoadingState('general', false);
    }
  }, [BACKEND_URL, setLoadingState]);

  const calculateAverageRating = useCallback((reviews) => {
    const validRatings = reviews.filter(review => 
      review && typeof review.rating === 'number' && review.rating > 0 && review.rating <= 5
    );

    if (validRatings.length === 0) return 0;

    const totalRating = validRatings.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / validRatings.length) * 10) / 10;
  }, []);

  const processReviews = useCallback((comments) => {
    return comments.map(comment => ({
      id: comment._id,
      rating: comment.rating || 0,
      comment: comment.content,
      images: comment.reviewImages?.map(img => img.url) || [],
      date: new Date(comment.date).toLocaleDateString(),
      author: comment.email,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0
    }));
  }, []);

  const fetchProductReviews = useCallback(async (productId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/comments?productId=${productId}`, {
        timeout: 5000
      });
      if (response.data && Array.isArray(response.data)) {
        const reviews = processReviews(response.data);
        setProductReviews(prev => ({ ...prev, [productId]: reviews }));
        return reviews;
      }
      return [];
    } catch {
      return [];
    }
  }, [BACKEND_URL, processReviews]);

  const fetchDealReviews = useCallback(async (dealId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/comments?dealId=${dealId}`, {
        timeout: 5000
      });
      if (response.data && Array.isArray(response.data)) {
        const reviews = processReviews(response.data);
        setDealReviews(prev => ({ ...prev, [dealId]: reviews }));
        return reviews;
      }
      return [];
    } catch {
      return [];
    }
  }, [BACKEND_URL, processReviews]);

  // UPDATED: Products fetching - show cached data immediately
  const fetchProducts = useCallback(async () => {
    const now = Date.now();
    
    // Show cached data immediately if available
    if (dataCache.products && now - dataCache.timestamp < dataCache.CACHE_DURATION) {
      setProducts(dataCache.products);
      return;
    }

    // Only show loading for initial load
    if (!dataCache.products) {
      setInitialLoading(prev => ({ ...prev, products: true }));
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/product/list`, {
        timeout: 8000
      });
      const productsData = response.data?.products;
      
      if (productsData) {
        const productsWithBasicData = productsData.map(product => ({
          ...product,
          rating: 0,
          reviewCount: 0,
          stock: product.stock || 0
        }));

        // Update cache and state
        dataCache.products = productsWithBasicData;
        dataCache.timestamp = now;
        setProducts(productsWithBasicData);

        // Load reviews in background (non-blocking)
        setTimeout(async () => {
          try {
            const productsWithRatings = await Promise.all(
              productsData.map(async (product) => {
                try {
                  const reviews = await fetchProductReviews(product._id);
                  const averageRating = calculateAverageRating(reviews);
                  
                  return {
                    ...product,
                    rating: averageRating,
                    reviewCount: reviews.length,
                    stock: product.stock || 0
                  };
                } catch {
                  return product;
                }
              })
            );
            dataCache.products = productsWithRatings;
            dataCache.timestamp = Date.now();
            setProducts(productsWithRatings);
          } catch {
            // Silent fail for background review loading
          }
        }, 100);
      }
    } catch (error) {
      // Keep existing data if any
      if (!dataCache.products) {
        setProducts([]);
      }
    } finally {
      setInitialLoading(prev => ({ ...prev, products: false }));
    }
  }, [BACKEND_URL, fetchProductReviews, calculateAverageRating]);

  // UPDATED: Deals fetching - show cached data immediately
  const fetchDeals = useCallback(async () => {
    const now = Date.now();
    
    // Show cached data immediately if available
    if (dataCache.deals && now - dataCache.timestamp < dataCache.CACHE_DURATION) {
      setDeals(dataCache.deals);
      return;
    }

    // Only show loading for initial load
    if (!dataCache.deals) {
      setInitialLoading(prev => ({ ...prev, deals: true }));
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/deal/list`, {
        timeout: 8000
      });
      const dealsData = response.data?.deals || [];
      const currentDate = new Date();

      const activeDeals = dealsData.filter(deal => {
        const isPublished = deal.status === 'published';
        const isActive = (!deal.dealStartDate || new Date(deal.dealStartDate) <= currentDate) &&
          (!deal.dealEndDate || new Date(deal.dealEndDate) >= currentDate);
        return isPublished && isActive;
      });

      const dealsWithBasicData = activeDeals.map(deal => ({
        ...deal,
        rating: 0,
        reviewCount: 0,
        quantity: deal.quantity || 0
      }));

      // Update cache and state
      dataCache.deals = dealsWithBasicData;
      dataCache.timestamp = now;
      setDeals(dealsWithBasicData);

      // Load reviews in background (non-blocking)
      setTimeout(async () => {
        try {
          const dealsWithRatings = await Promise.all(
            activeDeals.map(async (deal) => {
              try {
                const reviews = await fetchDealReviews(deal._id);
                const averageRating = calculateAverageRating(reviews);
                
                return {
                  ...deal,
                  rating: averageRating,
                  reviewCount: reviews.length,
                  quantity: deal.quantity || 0
                };
              } catch {
                return deal;
              }
            })
          );
          dataCache.deals = dealsWithRatings;
          dataCache.timestamp = Date.now();
          setDeals(dealsWithRatings);
        } catch {
          // Silent fail for background review loading
        }
      }, 100);

      return dealsWithBasicData;
    } catch (error) {
      // Keep existing data if any
      if (!dataCache.deals) {
        setDeals([]);
      }
      return [];
    } finally {
      setInitialLoading(prev => ({ ...prev, deals: false }));
    }
  }, [BACKEND_URL, fetchDealReviews, calculateAverageRating]);

  const submitReview = useCallback(async (reviewData, isDeal = false) => {
    if (!token) {
      toast.error("Please login to submit a review");
      return false;
    }

    setLoadingState('general', true, "Submitting review...");
    try {
      const decoded = decodeToken(token);
      if (!decoded?.id) {
        toast.error("Invalid token");
        return false;
      }

      const formData = new FormData();
      formData.append('targetType', isDeal ? 'deal' : 'product');
      formData.append(isDeal ? 'dealId' : 'productId', reviewData[isDeal ? 'dealId' : 'productId']);
      formData.append('content', reviewData.comment);
      formData.append('rating', reviewData.rating);
      formData.append('userId', decoded.id);

      reviewData.images.forEach((imageData) => {
        formData.append('reviewImages', imageData.file);
      });

      const response = await axios.post(`${BACKEND_URL}/api/comments`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000
      });

      if (response.data) {
        // Invalidate cache
        dataCache.timestamp = 0;
        
        if (isDeal) {
          await fetchDealReviews(reviewData.dealId);
          await fetchDeals();
        } else {
          await fetchProductReviews(reviewData.productId);
          await fetchProducts();
        }
        toast.success("Review submitted successfully!");
        return true;
      }
      return false;
    } catch (error) {
      toast.error("Failed to submit review");
      return false;
    } finally {
      setLoadingState('general', false);
    }
  }, [token, BACKEND_URL, decodeToken, setLoadingState, fetchProductReviews, fetchProducts, fetchDealReviews, fetchDeals]);

  const submitDealReview = useCallback(async (reviewData) => {
    return submitReview(reviewData, true);
  }, [submitReview]);

  // ==================== GETTER FUNCTIONS ====================

  const getProductRatingInfo = useCallback((productId) => {
    const product = products.find(p => p._id === productId);
    return product ? { rating: product.rating || 0, reviewCount: product.reviewCount || 0 } : { rating: 0, reviewCount: 0 };
  }, [products]);

  const getDealRatingInfo = useCallback((dealId) => {
    const deal = deals.find(d => d._id === dealId);
    return deal ? { rating: deal.rating || 0, reviewCount: deal.reviewCount || 0 } : { rating: 0, reviewCount: 0 };
  }, [deals]);

  const getDeliveryCharge = useCallback((subtotal = 0) => {
    if (!deliverySettings) return 0;
    const { mode, fixedCharge, freeDeliveryAbove } = deliverySettings;

    if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
      return 0;
    }

    return mode === "fixed" ? fixedCharge : fixedCharge || 0;
  }, [deliverySettings]);

  const isFreeDeliveryAvailable = useCallback((subtotal = 0) => {
    if (!deliverySettings) return false;
    const { freeDeliveryAbove } = deliverySettings;
    return freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove;
  }, [deliverySettings]);

  const getAmountForFreeDelivery = useCallback((subtotal = 0) => {
    if (!deliverySettings) return 0;
    const { freeDeliveryAbove } = deliverySettings;
    return freeDeliveryAbove > 0 && subtotal < freeDeliveryAbove ? freeDeliveryAbove - subtotal : 0;
  }, [deliverySettings]);

  const getCart = useCallback(async (token) => {
    if (!isBackendAvailable) {
      return;
    }

    if (hasLoadedCart && (Object.keys(cartItems).length > 0 || Object.keys(cartDeals).length > 0)) {
      return;
    }

    setLoadingState('cart', true, "Loading cart...");
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cart`, { 
        headers: { token },
        timeout: 5000
      });
      if (response.data.success) {
        const serverCartItems = response.data.cartData?.products || {};
        const serverCartDeals = response.data.cartData?.deals || {};
        
        setCartItems(serverCartItems);
        setCartDeals(serverCartDeals);
        setHasLoadedCart(true);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoadingState('cart', false);
    }
  }, [BACKEND_URL, setLoadingState, isBackendAvailable, hasLoadedCart, cartItems, cartDeals]);

  const getCartItemCount = useCallback(() => {
    const productCount = Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
    const dealCount = Object.values(cartDeals).reduce((total, quantity) => total + quantity, 0);
    return productCount + dealCount;
  }, [cartItems, cartDeals]);

  const calculateCartSubtotal = useCallback((items, itemsArray, priceKey = 'price', discountKey = 'discountprice') => {
    return Object.entries(items).reduce((total, [id, quantity]) => {
      const item = itemsArray.find(p => p._id === id);
      if (!item || quantity <= 0) return total;
      
      const price = item[discountKey] || item[priceKey];
      return total + (price * quantity);
    }, 0);
  }, []);

  const getCartSubtotal = useCallback(() => {
    const productSubtotal = calculateCartSubtotal(cartItems, products, 'price', 'discountprice');
    const dealSubtotal = calculateCartSubtotal(cartDeals, deals, 'dealTotal', 'dealFinalPrice');
    return productSubtotal + dealSubtotal;
  }, [cartItems, cartDeals, products, deals, calculateCartSubtotal]);

  const getTotalDiscount = useCallback(() => {
    const productDiscount = Object.entries(cartItems).reduce((total, [id, quantity]) => {
      const product = products.find(p => p._id === id);
      if (!product?.discountprice || quantity <= 0) return total;
      return total + (product.price * (product.discountprice / 100) * quantity);
    }, 0);

    const dealDiscount = Object.entries(cartDeals).reduce((total, [id, quantity]) => {
      const deal = deals.find(d => d._id === id);
      if (!deal?.dealFinalPrice || quantity <= 0) return total;
      return total + ((deal.dealTotal - deal.dealFinalPrice) * quantity);
    }, 0);

    return productDiscount + dealDiscount;
  }, [cartItems, cartDeals, products, deals]);

  const getCartTotal = useCallback(() => {
    const subtotal = getCartSubtotal();
    return subtotal + getDeliveryCharge(subtotal);
  }, [getCartSubtotal, getDeliveryCharge]);

  const getDealById = useCallback((dealId) => {
    return deals.find(deal => deal._id === dealId);
  }, [deals]);

  const isDealInCart = useCallback((dealId) => {
    return cartDeals[dealId] > 0;
  }, [cartDeals]);

  const getDealQuantityInCart = useCallback((dealId) => {
    return cartDeals[dealId] || 0;
  }, [cartDeals]);

  // ==================== USE EFFECT HOOKS ====================

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    
    checkBackendAvailability();
  }, [checkBackendAvailability]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Load data on mount
  useEffect(() => {
    fetchProducts();
    fetchDeals();
    fetchDeliverySettings();
  }, []);

  useEffect(() => {
    if (token && isBackendAvailable && !hasLoadedCart) {
      getCart(token);
    }
  }, [token, isBackendAvailable, hasLoadedCart]);

  // ==================== CONTEXT VALUE ====================

  const contextValue = useMemo(() => ({
    // Data
    products,
    deals,
    initialLoading, // For initial load only
    productsLoading: initialLoading.products, // For skeleton components
    dealsLoading: initialLoading.deals, // For skeleton components
    currency: CURRENCY,
    deliverySettings,
    search,
    showSearch,
    cartItems,
    cartDeals,
    backendUrl: BACKEND_URL,
    user,
    productReviews,
    dealReviews,
    token,
    loading, // Legacy loading for loader component
    isBackendAvailable,
    hasLoadedCart,
    
    // Loading functions
    isLoadingAny,
    setLoadingState,
    
    // UI functions
    setSearch,
    setShowSearch,
    
    // Auth functions
    setToken,
    setUser,
    
    // Cart functions
    addToCart,
    addDealToCart,
    removeDealFromCart,
    setCartItems,
    setCartDeals,
    getCartCount: getCartItemCount,
    updateQuantity: updateCartItemQuantity,
    updateDealQuantity,
    getCartAmount: getCartSubtotal,
    getTotalDiscount,
    getTotalAmount: getCartTotal,
    getCart,
    clearCart,
    
    // Deal functions
    getDealById,
    isDealInCart,
    getDealQuantityInCart,
    
    // Delivery functions
    getDeliveryCharge,
    isFreeDeliveryAvailable,
    getAmountForFreeDelivery,
    updateDeliverySettings,
    fetchDeliverySettings,
    
    // Review functions
    fetchProductReviews,
    fetchDealReviews,
    submitReview,
    submitDealReview,
    getProductRatingInfo,
    getDealRatingInfo,
    calculateAverageRating,
    
    // Data refresh functions
    refetchProducts: fetchProducts,
    refetchDeals: fetchDeals,
    
    // Stock functions
    checkProductStock,
    checkDealStock,

    // Backend status
    checkBackendAvailability
  }), [
    products,
    deals,
    initialLoading,
    deliverySettings,
    search,
    showSearch,
    cartItems,
    cartDeals,
    user,
    productReviews,
    dealReviews,
    token,
    loading,
    isBackendAvailable,
    hasLoadedCart,
    isLoadingAny,
    setLoadingState,
    addToCart,
    addDealToCart,
    getCartItemCount,
    updateCartItemQuantity,
    updateDealQuantity,
    getCartSubtotal,
    getTotalDiscount,
    getCartTotal,
    getDealById,
    isDealInCart,
    getDealQuantityInCart,
    getDeliveryCharge,
    isFreeDeliveryAvailable,
    getAmountForFreeDelivery,
    updateDeliverySettings,
    fetchDeliverySettings,
    fetchProductReviews,
    fetchDealReviews,
    submitReview,
    submitDealReview,
    getProductRatingInfo,
    getDealRatingInfo,
    calculateAverageRating,
    fetchProducts,
    fetchDeals,
    BACKEND_URL,
    getCart,
    clearCart,
    checkProductStock,
    checkDealStock,
    checkBackendAvailability
  ]);

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
      {isLoadingAny() && <Loader message={getLoadingMessage()} />}
    </ShopContext.Provider>
  );
  
};

export default ShopContextProvider;