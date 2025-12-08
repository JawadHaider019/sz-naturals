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
  FaUndo,
  FaQuestionCircle
} from 'react-icons/fa';

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

// Optimized Image component
const OrderItemImage = memo(({ imageUrl, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    if (!imageUrl) {
      setError(true);
      return;
    }

    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      setLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setError(true);
      setLoaded(true);
    };
  }, [imageUrl]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl`}>
        <FaImage className="text-gray-300 text-xl" />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse rounded-xl`}></div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageUrl}
      alt={alt}
      className={`${className} object-cover rounded-xl bg-gray-50`}
      loading="lazy"
    />
  );
});

// Order Item Component
const OrderItem = memo(({ item, currency, backendUrl }) => {
  const itemData = useMemo(() => {
    const isDeal = item.isFromDeal === true;
    const imageSource = isDeal ? (item.dealImage || item.image) : item.image;
    
    let imageUrl = assets.placeholder_image;
    if (imageSource) {
      if (Array.isArray(imageSource) && imageSource.length > 0) {
        imageUrl = imageSource[0].startsWith('/') ? `${backendUrl}${imageSource[0]}` : imageSource[0];
      } else if (typeof imageSource === 'string') {
        imageUrl = imageSource.startsWith('/') ? `${backendUrl}${imageSource}` : imageSource;
      }
    }

    return {
      name: isDeal ? (item.dealName || item.name) : item.name,
      image: imageUrl,
      price: item.price || 0,
      quantity: item.quantity || 1,
      isFromDeal: isDeal,
      description: item.description || item.dealDescription
    };
  }, [item, backendUrl]);

  const totalPrice = useMemo(() => 
    (itemData.price * itemData.quantity).toFixed(2),
    [itemData.price, itemData.quantity]
  );

  const unitPrice = useMemo(() => 
    itemData.price.toFixed(2),
    [itemData.price]
  );

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50/50 transition-colors duration-200 rounded-xl">
      {/* Image */}
      <div className="flex-shrink-0">
        <OrderItemImage 
          imageUrl={itemData.image}
          alt={itemData.name}
          className="w-20 h-20"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{itemData.name}</h4>
            {itemData.isFromDeal && (
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
              <span className="font-medium text-gray-900">{itemData.quantity}</span>
            </div>
          </div>
          
          {itemData.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {itemData.description}
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
                isActive ? STATUS_CONFIG[step]?.color.replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0] : 'bg-gray-100 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-opacity-20 ring-current' : ''}`}>
                <StepIcon className="w-4 h-4" />
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

// Order Card Component
const OrderCard = memo(({ order, currency, backendUrl, isCancellable, onCancelOrder }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const { totalAmount, formattedDate, statusConfig } = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => 
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    );
    const totalAmount = subtotal + (order.deliveryCharges || 0);
    
    const date = new Date(parseInt(order.date));
    const formattedDate = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['Order Placed'];
    
    return { totalAmount, formattedDate, statusConfig: config };
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
              Order Items ({order.items.length})
            </h4>
            <div className="space-y-2">
              {order.items.map((item, index) => (
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
                  <p className="font-medium text-gray-900">{order.address?.fullName}</p>
                  <p className="text-sm text-gray-600">{order.address?.street}</p>
                  <p className="text-sm text-gray-600">
                    {order.address?.city}, {order.address?.state} {order.address?.zipcode}
                  </p>
                  <p className="text-sm text-gray-600">{order.address?.phone}</p>
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
          </div>

          <div className="flex items-center gap-3">
            {/* {isCancellable && (
              <button
                onClick={() => onCancelOrder(order._id)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTimesCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )} */}
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

// Cancellation Modal
const CancellationModal = memo(({ 
  isOpen, 
  onClose, 
  selectedReason, 
  setSelectedReason, 
  cancellationReason, 
  setCancellationReason, 
  cancellationReasons, 
  onConfirm 
}) => {
  const isConfirmDisabled = !selectedReason || (selectedReason === 'Other' && !cancellationReason.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTimesCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
                <p className="text-sm text-gray-600">Please provide a reason for cancellation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 text-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cancellation Reason
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              >
                <option value="">Select a reason</option>
                {cancellationReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {selectedReason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Please specify
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Tell us more about why you're cancelling..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none transition-all"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {cancellationReason.length}/200 characters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Keep Order
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium transition-all ${
                isConfirmDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-red-700 hover:shadow-lg'
              }`}
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Main Orders Component
const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const cancellationReasons = useMemo(() => [
    "Changed my mind",
    "Found better price",
    "Delivery time too long",
    "Ordered by mistake",
    "Not required anymore",
    "Other"
  ], []);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.post(
          `${backendUrl}/api/order/userorders`,
          {},
          { headers: { token } }
        );

        if (response.data.success) {
          const activeOrders = response.data.orders
            .filter(order => order.status !== "Cancelled")
            .sort((a, b) => parseInt(b.date) - parseInt(a.date));
          setOrders(activeOrders);
        }
      } catch (error) {
        toast.error("Failed to load orders");
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [backendUrl, token]);

  // Cancel order function
  const cancelOrder = useCallback(async (orderId) => {
    if (!orderId || !selectedReason) return;

    const reason = selectedReason === 'Other' ? cancellationReason : selectedReason;

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/cancel`,
        { orderId, cancellationReason: reason },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order cancelled successfully");
        setOrders(prev => prev.filter(order => order._id !== orderId));
        handleCloseModal();
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  }, [backendUrl, token, selectedReason, cancellationReason]);

  // Check if order can be cancelled
  const canCancelOrder = useCallback((order) => {
    if (order.status !== "Order Placed") return false;
    const orderTime = new Date(parseInt(order.date));
    return (Date.now() - orderTime) < (15 * 60 * 1000);
  }, []);

  // Handle cancel button click
  const handleCancelClick = useCallback((orderId) => {
    setCancellingOrder(orderId);
    setSelectedReason("");
    setCancellationReason("");
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setCancellingOrder(null);
    setSelectedReason("");
    setCancellationReason("");
  }, []);

  // Confirm cancellation
  const handleConfirmCancel = useCallback(() => {
    if (cancellingOrder) {
      cancelOrder(cancellingOrder);
    }
  }, [cancellingOrder, cancelOrder]);

  // Loading state
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

  // Empty state
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
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <button
              onClick={() => window.location.href = '/collection'}
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
        {/* Header */}
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
              isCancellable={canCancelOrder(order)}
              onCancelOrder={handleCancelClick}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help with an order? Contact our support team for assistance.
          </p>
        </div>

        {/* Cancellation Modal */}
        <CancellationModal
          isOpen={!!cancellingOrder}
          onClose={handleCloseModal}
          selectedReason={selectedReason}
          setSelectedReason={setSelectedReason}
          cancellationReason={cancellationReason}
          setCancellationReason={setCancellationReason}
          cancellationReasons={cancellationReasons}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </div>
  );
};

export default Orders;