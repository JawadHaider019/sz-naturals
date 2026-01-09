import { useContext, useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from '../components/Title';
import axios from "axios";
import { assets } from "../assets/assets";
import { toast } from 'react-toastify';
import { 
  FaClock,
  FaBox,
  FaShippingFast,
  FaMotorcycle,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaCreditCard,
  FaInfoCircle,
  FaImage,
  FaTag,
  FaCalendarAlt,
  FaReceipt,
  FaChevronRight,
  FaSpinner,
  FaTruck,
  FaBoxOpen,
  FaUser,
  FaShoppingBag,
  FaQuestionCircle
} from 'react-icons/fa';

// Global image cache
const imageCache = new Map();
const MAX_CACHE_SIZE = 100;

// Status configuration with colors and icons
const STATUS_CONFIG = {
  'Order Placed': { 
    icon: FaClock, 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    stepColor: 'bg-yellow-500'
  },
  'Packing': { 
    icon: FaBox, 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    stepColor: 'bg-blue-500'
  },
  'Shipped': { 
    icon: FaShippingFast, 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    stepColor: 'bg-purple-500'
  },
  'Out for delivery': { 
    icon: FaMotorcycle, 
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    stepColor: 'bg-orange-500'
  },
  'Delivered': { 
    icon: FaCheckCircle, 
    color: 'bg-green-50 text-green-700 border-green-200',
    stepColor: 'bg-green-500'
  }
};

// Status steps for progress tracking
const STATUS_STEPS = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'];

// Image URL resolver (from second component)
const resolveImageUrl = (image, backendUrl) => {
  if (!image) return assets.placeholder_image;
  
  const cacheKey = `${backendUrl}-${JSON.stringify(image)}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  let url = assets.placeholder_image;
  
  if (Array.isArray(image) && image.length > 0) {
    url = image[0];
  } else if (image && typeof image === 'object' && image.url) {
    url = image.url;
  } else if (typeof image === 'string') {
    if (image.startsWith('data:image')) {
      url = image;
    } else if (image.startsWith('/uploads/') && backendUrl) {
      url = `${backendUrl}${image}`;
    } else if (image in assets) {
      url = assets[image];
    } else if (image.startsWith('http')) {
      url = image;
    } else {
      url = image;
    }
  }

  // Cache management
  if (imageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
  
  imageCache.set(cacheKey, url);
  return url;
};

// Enhanced: Get product image with better fallbacks (from second component)
const getProductImageById = async (productId, productName, backendUrl) => {
  if (!productId && !productName) return assets.placeholder_image;
  
  try {
    // First try: Get from localStorage cache
    const cachedProducts = localStorage.getItem('productCache');
    if (cachedProducts) {
      const products = JSON.parse(cachedProducts);
      
      // Try by ID first
      if (productId) {
        const cachedProduct = products.find(p => p._id === productId);
        if (cachedProduct?.image?.[0]) {
          return resolveImageUrl(cachedProduct.image[0], backendUrl);
        }
      }
      
      // Try by name if ID not found
      if (productName) {
        const cachedProduct = products.find(p => 
          p.name?.toLowerCase() === productName?.toLowerCase() || 
          p.name?.toLowerCase().includes(productName?.toLowerCase())
        );
        if (cachedProduct?.image?.[0]) {
          return resolveImageUrl(cachedProduct.image[0], backendUrl);
        }
      }
    }
    
    // Second try: Fetch from backend by ID
    if (productId) {
      try {
        const response = await axios.get(`${backendUrl}/api/products/${productId}`);
        if (response.data.success && response.data.data?.image?.[0]) {
          return resolveImageUrl(response.data.data.image[0], backendUrl);
        }
      } catch (error) {
        console.log("Failed to fetch product by ID, trying by name:", error);
      }
    }
    
    // Third try: Search by name
    if (productName) {
      try {
        const response = await axios.get(`${backendUrl}/api/products/search`, {
          params: { name: productName }
        });
        if (response.data.success && response.data.data?.[0]?.image?.[0]) {
          return resolveImageUrl(response.data.data[0].image[0], backendUrl);
        }
      } catch (error) {
        console.log("Failed to fetch product by name:", error);
      }
    }
    
    // Fourth try: Get all products and search locally
    try {
      const response = await axios.get(`${backendUrl}/api/products`);
      if (response.data.success && response.data.data) {
        const products = response.data.data;
        
        // Cache products for future use
        localStorage.setItem('productCache', JSON.stringify(products));
        
        // Search for product
        const product = products.find(p => 
          (productId && p._id === productId) || 
          (productName && p.name?.toLowerCase().includes(productName?.toLowerCase()))
        );
        
        if (product?.image?.[0]) {
          return resolveImageUrl(product.image[0], backendUrl);
        }
      }
    } catch (error) {
      console.log("Failed to fetch all products:", error);
    }
    
  } catch (error) {
    console.error("Error in getProductImageById:", error);
  }
  
  return assets.placeholder_image;
};

// Helper function to parse date correctly
const parseOrderDate = (dateValue) => {
  if (!dateValue) return new Date(); // Return current date if no date provided
  
  try {
    // Check if it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Check if it's a number (timestamp)
    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }
    
    // Check if it's a string that can be parsed as a number
    if (typeof dateValue === 'string') {
      // Try to parse as number first
      const parsedNumber = Number(dateValue);
      if (!isNaN(parsedNumber) && dateValue.trim() !== '') {
        return new Date(parsedNumber);
      }
      
      // Try to parse as ISO string or other date string
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    // Fallback to current date
    return new Date();
  } catch (error) {
    console.error("Error parsing date:", error, dateValue);
    return new Date(); // Return current date as fallback
  }
};

// Helper function to format date for display
const formatOrderDate = (dateValue) => {
  const date = parseOrderDate(dateValue);
  
  // Check if date is valid and not epoch (1970)
  if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
    return 'Date not available';
  }
  
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Helper function to get timestamp for sorting
const getOrderTimestamp = (order) => {
  const dateValue = order.orderPlacedAt || order.date || order.createdAt;
  const date = parseOrderDate(dateValue);
  return date.getTime();
};

// Order Item Component (Enhanced with better image loading)
const OrderItem = memo(({ item, currency, backendUrl }) => {
  const [imageUrl, setImageUrl] = useState(assets.placeholder_image);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setImageError(false);
      
      try {
        let url = assets.placeholder_image;
        
        // Priority 1: Direct image from item
        if (item.image) {
          if (Array.isArray(item.image) && item.image.length > 0) {
            url = resolveImageUrl(item.image[0], backendUrl);
          } else {
            url = resolveImageUrl(item.image, backendUrl);
          }
        }
        // Priority 2: Deal image
        else if (item.isFromDeal && item.dealImage) {
          url = resolveImageUrl(item.dealImage, backendUrl);
        }
        // Priority 3: Try to get product image
        else if (item.id || item.name) {
          url = await getProductImageById(item.id, item.name, backendUrl);
        }
        
        setImageUrl(url);
        
        // Test if image loads
        const img = new Image();
        img.onload = () => {
          setLoading(false);
          setImageError(false);
        };
        img.onerror = () => {
          setLoading(false);
          setImageError(true);
          setImageUrl(assets.placeholder_image);
        };
        img.src = url;
        
      } catch (error) {
        console.error("Error loading order item image:", error);
        setLoading(false);
        setImageError(true);
        setImageUrl(assets.placeholder_image);
      }
    };
    
    loadImage();
  }, [item, backendUrl]);

  const totalPrice = useMemo(() => 
    ((item.price || 0) * (item.quantity || 1)).toFixed(2),
    [item.price, item.quantity]
  );

  const unitPrice = useMemo(() => 
    (item.price || 0).toFixed(2),
    [item.price]
  );

  // Check if it's a deal with savings
  const isDeal = item.isFromDeal === true;
  const hasSavings = item.savings > 0;
  const originalPrice = item.originalTotalPrice || (item.price || 0) * (item.quantity || 1);
  const savings = hasSavings ? item.savings : 0;
  const showSavings = isDeal && hasSavings && originalPrice > (item.price || 0) * (item.quantity || 1);

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50/50 transition-colors duration-200 rounded-xl">
      {/* Image */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center animate-pulse">
              <FaImage className="text-gray-300 text-lg" />
            </div>
          ) : imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <FaImage className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-500 text-center">No image</span>
            </div>
          ) : (
            <img
              className="w-full h-full object-cover"
              src={imageUrl}
              alt={item.name || 'Product'}
              loading="lazy"
              decoding="async"
            />
          )}
          
          {isDeal && (
            <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-semibold">
              Deal
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{item.name || 'Unnamed Product'}</h4>
            {isDeal && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-black text-white rounded-full">
                <FaTag className="w-3 h-3 mr-1" />
                Deal
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-gray-900">
            {currency}{totalPrice}
          </span>
        </div>

        {/* Item Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-xs">Unit Price:</span>
              <span className="font-medium text-gray-900">{currency}{unitPrice}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-xs">Quantity:</span>
              <span className="font-medium text-gray-900">{item.quantity || 1}</span>
            </div>
            
            {showSavings && (
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-xs">Save:</span>
                <span className="font-medium text-xs">
                  {currency}{savings.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          
          {item.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// Status Progress Bar
const StatusProgress = memo(({ status }) => {
  const currentStepIndex = STATUS_STEPS.indexOf(status);
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        {STATUS_STEPS.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = step === status;
          const StepIcon = STATUS_CONFIG[step]?.icon || FaQuestionCircle;
          
          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive ? STATUS_CONFIG[step]?.stepColor : 'bg-gray-100 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-opacity-20 ring-current' : ''}`}>
                <StepIcon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xs mt-2 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress Line */}
      <div className="relative -top-4">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200"></div>
        <div 
          className="absolute top-4 left-4 h-0.5 bg-gray-900 transition-all duration-500"
          style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
});

// Order Card Component (with guest handling)
const OrderCard = memo(({ order, currency, backendUrl }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const { totalAmount, formattedDate, statusConfig, isGuestOrder } = useMemo(() => {
    const subtotal = order.items?.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    ) || 0;
    const totalAmount = subtotal + (order.deliveryCharges || 0);
    
    // Use the helper function to format date correctly
    const formattedDate = formatOrderDate(order.orderPlacedAt || order.date || order.createdAt);
    
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['Order Placed'];
    
    // Check if order is from guest
    const isGuest = order.orderType === 'guest' || order.isGuest || (!order.userId && order.customerDetails?.email);
    
    return { totalAmount, formattedDate, statusConfig: config, isGuestOrder: isGuest };
  }, [order]);

  const StatusIcon = statusConfig.icon;

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${statusConfig.color} flex items-center gap-2`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{order.status}</span>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <FaCalendarAlt className="w-3 h-3" />
                {formattedDate}
              </div>
              {isGuestOrder && (
                <span className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md">
                  <FaUser className="w-3 h-3 mr-1" />
                  Guest
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Order #{order._id?.substring(0, 8).toUpperCase()}
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {currency}{totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Progress */}
        <StatusProgress status={order.status} />
      </div>

      {/* Collapsible Details */}
      {showDetails && (
        <div className="p-6 border-b border-gray-100">
          {/* Items */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBoxOpen className="w-4 h-4" />
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <OrderItem
                  key={`${order._id}-${item.id || index}`}
                  item={item}
                  currency={currency}
                  backendUrl={backendUrl}
                />
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4" />
                  Delivery Address
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="font-medium text-gray-900">{order.address?.fullName || order.customerDetails?.name}</p>
                  <p className="text-sm text-gray-600">{order.address?.street}</p>
                  <p className="text-sm text-gray-600">
                    {order.address?.city}, {order.address?.state} {order.address?.zipcode}
                  </p>
                  <p className="text-sm text-gray-600">{order.address?.phone || order.customerDetails?.phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaReceipt className="w-4 h-4" />
                  Payment & Delivery
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Delivery Charges:</span>
                    <span className="font-medium text-gray-900">
                      {currency}{(order.deliveryCharges || 0).toFixed(2)}
                    </span>
                  </div>
                  {isGuestOrder && order.customerDetails?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Guest Email:</span>
                      <span className="font-medium text-gray-900">
                        {order.customerDetails.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FaCreditCard className="w-4 h-4" />
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaTruck className="w-4 h-4" />
              <span>{order.address?.city}</span>
            </div>
            {isGuestOrder && (
              <div className="flex items-center gap-2 text-gray-600">
                <FaUser className="w-4 h-4" />
                <span>Guest Order</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <span>{showDetails ? 'Hide' : 'View'} Details</span>
              <FaChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Main Orders Component (with guest handling integration)
const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all orders with guest handling (from second component)
  useEffect(() => {
    let mounted = true;
    let controller = new AbortController();

    const loadData = async () => {
      try {
        if (mounted) setLoading(true);
        
        if (token) {
          // Logged-in user: Load from backend
          try {
            const response = await axios.post(
              backendUrl + '/api/order/userorders',
              {},
              { 
                headers: { token },
                timeout: 10000,
                signal: controller.signal
              }
            );

            if (mounted && response.data.success) {
              const sortedOrders = (response.data.orders || [])
                .filter(order => order.status !== "Cancelled")
                .sort((a, b) => {
                  // Use the helper function for consistent date comparison
                  return getOrderTimestamp(b) - getOrderTimestamp(a);
                });

              setOrders(sortedOrders);
            }
          } catch (error) {
            console.error("Error loading user orders:", error);
            if (mounted) toast.error("Failed to load orders");
          }
        } else {
          // Guest user: Try to load from backend first using localStorage info
          const guestOrderInfo = localStorage.getItem('guestOrderInfo');
          let guestOrders = [];
          
          if (guestOrderInfo) {
            try {
              const { email, orderId } = JSON.parse(guestOrderInfo);
              
              // Try to get the order
              if (orderId && email) {
                const trackResponse = await axios.post(
                  backendUrl + '/api/order/guest/track',
                  { orderId, email },
                  { timeout: 10000, signal: controller.signal }
                );

                if (mounted && trackResponse.data.success) {
                  guestOrders = [trackResponse.data.order];
                }
              }
            } catch (error) {
              console.log("Could not fetch guest orders from backend:", error);
            }
          }
          
          // Also check localStorage for any saved guest orders
          try {
            const savedGuestOrders = localStorage.getItem('guestOrders');
            if (savedGuestOrders) {
              const parsedOrders = JSON.parse(savedGuestOrders);
              // Merge with backend orders
              parsedOrders.forEach(savedOrder => {
                if (!guestOrders.some(order => order._id === savedOrder._id)) {
                  guestOrders.push(savedOrder);
                }
              });
            }
          } catch (error) {
            console.error("Error loading guest orders from localStorage:", error);
          }
          
          // Check for recent guest order
          try {
            const recentOrder = localStorage.getItem('recentGuestOrder');
            if (recentOrder) {
              const parsedOrder = JSON.parse(recentOrder);
              if (!guestOrders.some(order => order._id === parsedOrder._id)) {
                guestOrders.unshift(parsedOrder);
              }
            }
          } catch (error) {
            console.error("Error loading recent guest order:", error);
          }
          
          // Sort guest orders by date using the helper function
          const sortedGuestOrders = guestOrders
            .filter(order => order && order.status !== "Cancelled")
            .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

          if (mounted) {
            setOrders(sortedGuestOrders);
          }
        }
      } catch (error) {
        console.error("Error in loadData:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [backendUrl, token]);

  // Loading state (from first component design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Title text1="My" text2="Orders" />
            <p className="text-gray-600 mt-4">Loading your orders...</p>
          </div>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <FaSpinner className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading your order history</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (from first component design)
  if (!loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Title text1="My" text2="Orders" />
            <p className="text-gray-600 mt-4">Your order history will appear here</p>
          </div>
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBoxOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Orders Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {token 
                ? "You haven't placed any orders yet. Start shopping to see your order history here."
                : "You haven't placed any orders yet. Start shopping to see your order history here."}
            </p>
            <button
              onClick={() => window.location.href = '/shop'}
              className="group inline-flex items-center gap-3 bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all"
            >
              <span>Browse Products</span>
              <FaChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header (from first component design) */}
        <div className="text-center mb-12">
          <Title text1="My" text2="Orders" />
          <p className="text-gray-600 mt-4">Track and manage all your orders in one place</p>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              currency={currency}
              backendUrl={backendUrl}
            />
          ))}
        </div>

        {/* Footer Note (from first component design) */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help with an order? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Orders;