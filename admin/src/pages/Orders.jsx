import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faClock,
  faBox,
  faShippingFast,
  faMotorcycle,
  faCheckCircle,
  faTimesCircle,
  faPhone,
  faSpinner,
  faTag,
  faCube,
  faChevronDown,
  faChevronUp,
  faReceipt,
  faUser,
  faCalendar,
  faSearch,
  faFilter,
  faEnvelope,
  faEye,
  faFileImage,
  faCheck,
  faTimes,
  faHourglassHalf,
  faXmark,
  faMoneyBillWave,
  faCreditCard,
  faWallet,
  faFileInvoiceDollar,
  faMoneyBill,
  faHandHoldingUsd,
  faCaretDown
} from '@fortawesome/free-solid-svg-icons';

// Constants
const STATUS_CONFIG = {
  'Pending Verification': { icon: faHourglassHalf, label: 'Pending Verification' },
  'Order Placed': { icon: faClock, label: 'Order Placed' },
  'Pending': { icon: faClock, label: 'Pending' },
  'Packing': { icon: faBox, label: 'Packing' },
  'Shipped': { icon: faShippingFast, label: 'Shipped' },
  'Out for delivery': { icon: faMotorcycle, label: 'Out for Delivery' },
  'Delivered': { icon: faCheckCircle, label: 'Delivered' },
  'Cancelled': { icon: faTimesCircle, label: 'Cancelled' },
  'Payment Rejected': { icon: faTimesCircle, label: 'Payment Rejected' },
};

const PAYMENT_METHOD_CONFIG = {
  'COD': { 
    icon: faMoneyBill, 
    label: 'Cash on Delivery', 
    color: 'text-black', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    autoVerified: true
  },
  'online': { 
    icon: faCreditCard, 
    label: 'Online Payment', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    autoVerified: false
  },
  'easypaisa': { 
    icon: faWallet, 
    label: 'Easypaisa', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    autoVerified: false
  },
  'jazzcash': { 
    icon: faWallet, 
    label: 'JazzCash', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-200',
    autoVerified: false
  },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Orders', icon: faList, count: 0 },
  { id: 'pending_verification', label: 'Pending Verification', icon: faHourglassHalf, count: 0 },
  { id: 'pending', label: 'Order Placed', icon: faClock, count: 0 },
  { id: 'packing', label: 'Packing', icon: faBox, count: 0 },
  { id: 'shipped', label: 'Shipped', icon: faShippingFast, count: 0 },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: faMotorcycle, count: 0 },
  { id: 'delivered', label: 'Delivered', icon: faCheckCircle, count: 0 },
  { id: 'cancelled', label: 'Cancelled', icon: faTimesCircle, count: 0 },
  { id: 'COD', label: 'COD Orders', icon: faMoneyBill, count: 0 },
  { id: 'online', label: 'Online Orders', icon: faCreditCard, count: 0 },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total_high', label: 'Total: High to Low' },
  { value: 'total_low', label: 'Total: Low to High' },
];

// Image Modal Component
const ImageModal = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full bg-white rounded-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:-top-5 sm:-right-10  text-white hover:text-gray-300 transition-colors z-10"
        >
          <FontAwesomeIcon icon={faXmark} className="text-2xl" />
        </button>
        <img
          src={imageUrl}
          alt="Payment Screenshot"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
    
      </div>
    </div>
  );
};

// Custom Hooks
const useOrdersFilter = (orders, activeFilter, searchTerm, sortBy) => {
  return useMemo(() => {
    let filtered = orders;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => {
        switch (activeFilter) {
          case 'pending_verification':
            return order.paymentMethod !== 'COD' && order.paymentStatus === 'pending';
          case 'pending':
            return (order.status === 'Order Placed' || order.status === 'Pending') && 
                   (order.paymentMethod === 'COD' ? true : order.paymentStatus === 'verified');
          case 'packing':
            return order.status === 'Packing';
          case 'shipped':
            return order.status === 'Shipped';
          case 'out_for_delivery':
            return order.status === 'Out for delivery';
          case 'delivered':
            return order.status === 'Delivered';
          case 'cancelled':
            return order.status === 'Cancelled' || order.paymentStatus === 'rejected';
          case 'COD':
            return order.paymentMethod === 'COD';
          case 'online':
            return order.paymentMethod !== 'COD' && order.paymentMethod !== undefined;
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(term) ||
        (order.customerDetails?.name?.toLowerCase().includes(term)) ||
        (order.customerDetails?.email?.toLowerCase().includes(term)) ||
        order.address?.phone?.includes(searchTerm)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      const aTotal = a.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
      const bTotal = b.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

      switch (sortBy) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'total_high':
          return bTotal - aTotal;
        case 'total_low':
          return aTotal - bTotal;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, activeFilter, searchTerm, sortBy]);
};

// Sub-components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Loading orders...</p>
    </div>
  </div>
);

const AccessRequired = ({ navigate }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md bg-white rounded-lg shadow-sm p-8 border border-gray-200">
      <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faReceipt} className="text-gray-600 text-2xl" />
      </div>
      <h3 className="text-xl font-semibold text-black mb-3">Access Required</h3>
      <p className="text-gray-600 mb-6">Please login to view and manage orders</p>
      <button
        onClick={() => navigate('/')}
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium w-full"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const EmptyState = ({ activeFilter, searchTerm, onClearSearch }) => {
  const getFilterLabel = (filterId) => {
    const filter = FILTER_OPTIONS.find(f => f.id === filterId);
    return filter ? filter.label : 'orders';
  };

  return (
    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
      <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-2xl" />
      </div>
      <h3 className="text-xl font-semibold text-black mb-3">
        {searchTerm ? 'No orders found' : `No ${activeFilter === 'all' ? '' : getFilterLabel(activeFilter).toLowerCase()}`}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {searchTerm 
          ? 'Try adjusting your search terms.'
          : activeFilter !== 'all' 
            ? `No ${getFilterLabel(activeFilter).toLowerCase()} available.`
            : 'No orders have been placed yet.'
        }
      </p>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};

// Updated Filter Dropdown Component
const FilterDropdown = ({ activeFilter, onFilterChange, filterOptions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = filterOptions.find(opt => opt.id === activeFilter);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full lg:w-auto px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white min-w-[200px]"
      >
        <div className="flex items-center">
          <FontAwesomeIcon 
            icon={activeOption?.icon || faFilter} 
            className="mr-3 text-gray-600" 
          />
          <span className="font-medium text-black">
            {activeOption?.label || 'Filter Orders'}
          </span>
        </div>
        <FontAwesomeIcon 
          icon={faCaretDown} 
          className={`ml-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full lg:w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onFilterChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded text-left hover:bg-gray-50 transition-colors ${
                    activeFilter === option.id 
                      ? 'bg-gray-100 text-black font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={option.icon} 
                      className={`mr-3 text-sm ${
                        activeFilter === option.id ? 'text-black' : 'text-gray-500'
                      }`} 
                    />
                    <span>{option.label}</span>
                  </div>
                  {option.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full min-w-6 text-center ${
                      activeFilter === option.id 
                        ? 'bg-gray-200 text-black' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SearchAndFilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  sortBy, 
  onSortChange,
  activeFilter,
  onFilterChange,
  filterOptions 
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Search orders by ID, name, email, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <FilterDropdown
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          filterOptions={filterOptions}
        />
        <div className="relative">
          <FontAwesomeIcon 
            icon={faFilter} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white appearance-none min-w-[160px]"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </div>
);

// Payment Method Badge Component
const PaymentMethodBadge = ({ paymentMethod, paymentMethodDetail }) => {
  const method = paymentMethod || 'COD';
  const detail = paymentMethodDetail || PAYMENT_METHOD_CONFIG[method]?.label || 'Cash on Delivery';
  const config = PAYMENT_METHOD_CONFIG[method] || PAYMENT_METHOD_CONFIG.COD;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <FontAwesomeIcon icon={config.icon} className="mr-1" />
      {detail}
    </span>
  );
};

// Payment Verification Component - Only for online payments
const PaymentVerification = ({ order, onVerificationComplete }) => {
  const [verifying, setVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const { token } = useAuth();

  // Don't show verification for COD orders
  if (order.paymentMethod === 'COD') {
    return null;
  }

  const paymentMethodLabel = PAYMENT_METHOD_CONFIG[order.paymentMethod]?.label || 'Online Payment';

  const handleVerifyPayment = async (action) => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setVerifying(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/verify-payment`,
        {
          orderId: order._id,
          action: action,
          reason: rejectionReason
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onVerificationComplete(response.data.order);
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
        <h5 className="text-lg font-semibold text-black mb-3 flex items-center">
          <FontAwesomeIcon icon={faHourglassHalf} className="mr-2 text-yellow-600" />
          Payment Verification Required
        </h5>
        
        <div className="space-y-4">
          {order.paymentScreenshot && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-sm font-semibold text-black mb-2 flex items-center">
                <FontAwesomeIcon icon={faFileImage} className="mr-2" />
                Payment Screenshot
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => setShowImageModal(true)}
                >
                  <img 
                    src={order.paymentScreenshot} 
                    alt="Payment Screenshot" 
                    className="h-20 w-20 object-cover rounded border border-gray-300 group-hover:border-gray-400 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-all flex items-center justify-center">
                    <FontAwesomeIcon icon={faEye} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="flex items-center px-3 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-2" />
                    View
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded p-2 border border-gray-200">
              <p className="text-gray-600 font-medium text-xs mb-1">Payment Method</p>
              <p className="text-black font-semibold">{paymentMethodLabel}</p>
            </div>
            <div className="bg-white rounded p-2 border border-gray-200">
              <p className="text-gray-600 font-medium text-xs mb-1">Amount Paid</p>
              <p className="text-black font-semibold">{currency}{order.paymentAmount || order.amount}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleVerifyPayment('approve')}
                disabled={verifying}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                )}
                Approve Payment
              </button>
              
              <button
                onClick={() => handleVerifyPayment('reject')}
                disabled={verifying}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                )}
                Reject Payment
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Rejection Reason:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none bg-white"
                rows="2"
              />
            </div>
          </div>
        </div>
      </div>

      <ImageModal 
        imageUrl={order.paymentScreenshot} 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)} 
      />
    </>
  );
};

// Payment Status Badge - Handles COD as auto-verified
const PaymentStatusBadge = ({ paymentStatus, paymentMethod }) => {
  const getStatusConfig = (status, method) => {
    // For COD orders, always show as auto-approved
    if (method === 'COD') {
      return { 
        text: 'Auto Approved',
        icon: faCheckCircle, 
        color: 'text-black', 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-200' 
      };
    }
    
    switch (status) {
      case 'verified':
        return { 
          text: 'Verified', 
          icon: faCheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50', 
          borderColor: 'border-green-200' 
        };
      case 'pending':
        return { 
          text: 'Pending Verification', 
          icon: faHourglassHalf, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-50', 
          borderColor: 'border-yellow-200' 
        };
      case 'rejected':
        return { 
          text: 'Rejected', 
          icon: faTimesCircle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-50', 
          borderColor: 'border-red-200' 
        };
      default:
        return { 
          text: 'Unknown', 
          icon: faClock, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50', 
          borderColor: 'border-gray-200' 
        };
    }
  };

  const config = getStatusConfig(paymentStatus, paymentMethod);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
      <FontAwesomeIcon icon={config.icon} className="mr-1" />
      {config.text}
    </span>
  );
};

// Billing Summary Component
const BillingSummary = ({ order }) => {
  const billingDetails = useMemo(() => {
    const subtotal = (order.items || []).reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)),
      0
    );
    
    const deliveryCharges = order.deliveryCharges || 0;
    const total = subtotal + deliveryCharges;
    
    // COD orders are automatically considered verified
    const isCOD = order.paymentMethod === 'COD';
    const isOnlinePayment = !isCOD;
    const isPaymentVerified = isCOD ? true : order.paymentStatus === 'verified';
    
    const prepaidAmount = isOnlinePayment && isPaymentVerified ? 
      (order.paymentAmount || order.amount || total) : 0;
    
    // For COD: full amount to collect on delivery
    // For Online: remaining amount after verification
    let remainingAmount;
    if (isCOD) {
      remainingAmount = total; // Full amount for COD (pay on delivery)
    } else if (isPaymentVerified) {
      remainingAmount = Math.max(0, total - prepaidAmount);
    } else {
      remainingAmount = total; // Online pending verification
    }
    
    const paymentMethod = order.paymentMethod || 'COD';
    const paymentMethodDetail = order.paymentMethodDetail || 
      PAYMENT_METHOD_CONFIG[paymentMethod]?.label || 'Cash on Delivery';

    return {
      subtotal,
      deliveryCharges,
      total,
      prepaidAmount,
      remainingAmount,
      paymentMethod,
      paymentMethodDetail,
      isFullyPaid: remainingAmount === 0,
      isPrepaid: prepaidAmount > 0,
      isOnlinePayment,
      isPaymentVerified,
      isCOD
    };
  }, [order]);

  return (
    <div>
      <h5 className="text-lg font-semibold text-black mb-2 flex items-center">
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" />
        Billing Summary
      </h5>
      <div className="bg-gray-50 rounded border border-gray-200 p-3 text-sm">
        {/* Order Summary */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-black">{currency}{billingDetails.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Charges:</span>
            <span className="font-semibold text-black">
              {billingDetails.deliveryCharges === 0 ? 'FREE' : `${currency}${billingDetails.deliveryCharges.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-300">
            <span className="text-black">Total Amount:</span>
            <span className="text-black">{currency}{billingDetails.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="space-y-2 pt-3 border-t border-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              <FontAwesomeIcon icon={billingDetails.isCOD ? faMoneyBill : faCreditCard} className="mr-1 text-sm" />
              Payment Method:
            </span>
            <span className="font-semibold text-black">{billingDetails.paymentMethodDetail}</span>
          </div>
          
          {billingDetails.isPrepaid && (
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-sm text-green-600" />
                Prepaid Amount:
              </span>
              <span className="font-semibold text-green-600">
                {currency}{billingDetails.prepaidAmount.toFixed(2)}
              </span>
            </div>
          )}
         
          {billingDetails.isFullyPaid && (
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-sm text-green-600" />
                Payment Status:
              </span>
              <span className="font-semibold text-green-600">
                Fully Paid
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const OrderCard = ({ 
  order, 
  onStatusChange, 
  expandedDeals, 
  onToggleDeal,
  onVerificationComplete 
}) => {
  const { dealGroups, regularItems } = useMemo(() => 
    groupItemsByDeal(order.items || []), 
    [order.items]
  );
  
  const allDeals = Object.values(dealGroups);
  const totalItemsCount = order.items?.length || 0;

  const customerInfo = useMemo(() => 
    getCustomerInfo(order), 
    [order]
  );

  const subtotal = useMemo(() => 
    (order.items || []).reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)),
      0
    ), 
    [order.items]
  );
  
  const total = subtotal + (order.deliveryCharges || 0);
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
  
  // Determine if this order needs verification (only online payments)
  const needsVerification = order.paymentMethod !== 'COD' && order.paymentStatus === 'pending';
  
  // Determine if status can be updated
  const canUpdateStatus = (order.paymentMethod === 'COD' || order.paymentStatus === 'verified') && 
        order.status !== 'Cancelled' && 
       order.status !== 'Delivered';
  
  // State for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Get screenshot from either paymentScreenshot or verifiedPayment.screenshot
  const screenshotUrl = order.verifiedPayment?.screenshot || order.paymentScreenshot;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header with different background for COD vs Online */}
      <div className={`px-4 py-4 border-b ${
        order.status === 'Cancelled' || order.paymentStatus === 'rejected' ? 'bg-gray-100' : 
        needsVerification ? 'bg-yellow-50' : 
        order.paymentMethod === 'COD' ? 'bg-blue-50' : 'bg-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${
              order.paymentMethod === 'COD' ? 'bg-blue-100' : 
              needsVerification ? 'bg-yellow-100' : 
              'bg-gray-100'
            }`}>
              <FontAwesomeIcon 
                icon={order.paymentMethod === 'COD' ? faMoneyBill : statusConfig.icon} 
                className={order.paymentMethod === 'COD' ? 'text-black' : 'text-black'} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-black">
                    #{order._id.substring(0, 8).toUpperCase()}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-black border border-gray-300">
                      <FontAwesomeIcon icon={statusConfig.icon} className="mr-1" />
                      {order.status}
                    </span>
                    <PaymentMethodBadge 
                      paymentMethod={order.paymentMethod} 
                      paymentMethodDetail={order.paymentMethodDetail}
                    />
                    <PaymentStatusBadge 
                      paymentStatus={order.paymentStatus} 
                      paymentMethod={order.paymentMethod}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    {customerInfo.name}
                  </div>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                    {new Date(order.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {(order.cancellationReason || order.rejectionReason) && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-300">
                  <p className="text-sm text-black">
                    <span className="font-medium">
                      {order.rejectionReason ? 'Rejection Reason:' : 'Cancellation Reason:'}
                    </span>{' '}
                    {order.rejectionReason || order.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-black">{currency}{total.toFixed(2)}</p>
            <p className="text-sm text-gray-600">{totalItemsCount} items</p>
            <p className={`text-xs font-medium mt-1 ${
              order.paymentMethod === 'COD' ? 'text-black' : 'text-gray-600'
            }`}>
              {order.paymentMethod === 'COD' ? 'COD ' : 'Online Payment'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Show payment verification only for online payments that need verification */}
        {needsVerification && (
          <PaymentVerification 
            order={order} 
            onVerificationComplete={onVerificationComplete}
          />
        )}
          
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Order Items */}
          <div className="flex-1">
            <h5 className="text-lg font-semibold text-black mb-3">Order Items</h5>
            <div className="bg-gray-50 rounded border border-gray-200 p-3 max-h-80 overflow-y-auto">
              {allDeals.map((deal, dealIndex) => (
                <DealItem
                  key={dealIndex}
                  deal={deal}
                  orderId={order._id}
                  expandedDeals={expandedDeals}
                  onToggleDeal={onToggleDeal}
                />
              ))}
              {regularItems.map((item, idx) => (
                <ProductItem key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            <div>
              <h5 className="text-lg font-semibold text-black mb-2 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Customer Info
              </h5>
              <div className="bg-gray-50 rounded border border-gray-200 p-3 text-sm">
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <div>
                    <p className="text-gray-600 text-xs">NAME</p>
                    <p className="font-semibold text-black">{customerInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">EMAIL</p>
                    <p className="font-semibold text-black">{customerInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">PHONE</p>
                    <p className="font-semibold text-black flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="mr-1 text-gray-600" />
                      {customerInfo.phone}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-gray-600 text-xs mb-1">SHIPPING ADDRESS</p>
                  {order.address ? (
                    <>
                      <p className="text-black">{order.address.street}</p>
                      <p className="text-black">{order.address.city}, {order.address.state}</p>
                      <p className="text-black">{order.address.zipCODe}</p>
                      {order.address.instructions && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Delivery Instructions:</p>
                          <p className="text-xs text-yellow-700">{order.address.instructions}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-600">Address not available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Summary */}
            <BillingSummary order={order} />

            {/* Payment Screenshot Section - Always show for online payments */}
            {screenshotUrl && order.paymentMethod !== 'COD' && (
              <div>
                <h5 className="text-lg font-semibold text-black mb-2 flex items-center">
                  <FontAwesomeIcon icon={faFileImage} className="mr-2" />
                  Payment Receipt
                </h5>
                <div className="bg-gray-50 rounded border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      {order.paymentStatus === 'verified' ? 'Verified Payment Receipt' : 
                       order.paymentStatus === 'rejected' ? 'Rejected Payment Receipt' : 
                       'Payment Screenshot'}
                    </p>
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Full Size
                    </button>
                  </div>
                  <div 
                    className="cursor-pointer mb-2"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img 
                      src={screenshotUrl} 
                      alt="Payment Receipt" 
                      className="h-32 w-full object-contain rounded border border-gray-300 hover:border-gray-400 transition-colors"
                    />
                  </div>
                  {order.verifiedPayment?.verifiedAt && (
                    <div className="text-xs text-gray-500 flex justify-between items-center">
                      <span>
                        Verified on: {new Date(order.verifiedPayment.verifiedAt).toLocaleDateString()}
                      </span>
                      {order.paymentStatus === 'rejected' && (
                        <span className="text-red-600 font-medium">
                          Rejected
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Update - Always available for COD, only for verified online payments */}
            {canUpdateStatus && (
              <div>
                <h5 className="text-lg font-semibold text-black mb-2">Update Status</h5>
                <select
                  onChange={(e) => onStatusChange(e, order._id)}
                  value={order.status}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black bg-white text-sm"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancel Order</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal 
        imageUrl={screenshotUrl} 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)} 
      />
    </div>
  );
};

const DealItem = ({ deal, orderId, expandedDeals, onToggleDeal }) => {
  const isExpanded = expandedDeals[`${orderId}-${deal.dealName}`];
  
  return (
    <div className="mb-3 last:mb-0">
      <div 
        className="flex justify-between items-center p-3 rounded border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggleDeal(orderId, deal.dealName)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium mr-3">
            <FontAwesomeIcon icon={faTag} className="mr-1" />
            Deal
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-black text-sm">{deal.dealName}</p>
            {deal.dealDescription && (
              <p className="text-gray-600 text-xs mt-1 line-clamp-1">{deal.dealDescription}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 ml-3">
          <div className="text-right">
            <p className="font-semibold text-black text-sm">{currency}{deal.totalPrice.toFixed(2)}</p>
            <p className="text-gray-500 text-xs">{deal.totalQuantity} items</p>
          </div>
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="text-gray-400" 
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-4">
          {deal.items.map((item, itemIndex) => (
            <div key={itemIndex} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black text-sm">{item.name}</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-gray-500 text-xs">Qty: {item.quantity || 1}</span>
                  <span className="text-gray-500 text-xs">• {currency}{item.price?.toFixed(2)} each</span>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="font-semibold text-black text-sm">
                  {currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductItem = ({ item }) => (
  <div className="flex justify-between items-center py-3 px-3 bg-white rounded border border-gray-200 mb-2 last:mb-0 hover:bg-gray-50 transition-colors">
    <div className="flex-1 min-w-0">
      <div className="flex items-center mb-1">
        <p className="font-semibold text-black text-sm">{item.name}</p>
        <span className="ml-2 bg-gray-100 text-black px-2 py-1 rounded text-xs border border-gray-300">
          Product
        </span>
      </div>
      {item.description && (
        <p className="text-gray-600 text-xs mb-1 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center space-x-3">
        <span className="text-gray-500 text-xs">Qty: {item.quantity || 1}</span>
        <span className="text-gray-500 text-xs">• {currency}{item.price?.toFixed(2)} each</span>
      </div>
    </div>
    <div className="text-right ml-3">
      <p className="font-semibold text-black text-sm">
        {currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </p>
    </div>
  </div>
);

// Utility Functions
const groupItemsByDeal = (items) => {
  const dealGroups = {};
  const regularItems = [];
  
  items.forEach(item => {
    if (item.isFromDeal === true) {
      const dealKey = item.dealName || 'Unknown Deal';
      if (!dealGroups[dealKey]) {
        dealGroups[dealKey] = {
          dealName: dealKey,
          dealDescription: item.dealDescription,
          dealImage: item.dealImage,
          items: [],
          totalQuantity: 0,
          totalPrice: 0
        };
      }
      dealGroups[dealKey].items.push(item);
      dealGroups[dealKey].totalQuantity += item.quantity || 1;
      dealGroups[dealKey].totalPrice += (item.price || 0) * (item.quantity || 1);
    } else {
      regularItems.push(item);
    }
  });

  return { dealGroups, regularItems };
};

const getCustomerInfo = (order) => {
  if (order.customerDetails) {
    return {
      name: order.customerDetails.name || 'Customer',
      email: order.customerDetails.email || 'Email not available',
      phone: order.customerDetails.phone || order.address?.phone || 'Phone not available'
    };
  }

  if (order.address) {
    const addressName = `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim();
    return {
      name: addressName || 'Customer',
      email: order.address.email || 'Email not available',
      phone: order.address.phone || 'Phone not available'
    };
  }

  return {
    name: 'Customer',
    email: 'Email not available',
    phone: 'Phone not available'
  };
};

const calculateFilterCounts = (orders) => {
  return FILTER_OPTIONS.map(filter => {
    let count = 0;
    switch (filter.id) {
      case 'all':
        count = orders.length;
        break;
      case 'pending_verification':
        count = orders.filter(order => 
          order.paymentMethod !== 'COD' && order.paymentStatus === 'pending'
        ).length;
        break;
      case 'pending':
        count = orders.filter(order =>
          (order.status === 'Order Placed' || order.status === 'Pending') && 
          (order.paymentMethod === 'COD' || order.paymentStatus === 'verified')
        ).length;
        break;
      case 'packing':
        count = orders.filter(order => order.status === 'Packing').length;
        break;
      case 'shipped':
        count = orders.filter(order => order.status === 'Shipped').length;
        break;
      case 'out_for_delivery':
        count = orders.filter(order => order.status === 'Out for delivery').length;
        break;
      case 'delivered':
        count = orders.filter(order => order.status === 'Delivered').length;
        break;
      case 'cancelled':
        count = orders.filter(order => 
          order.status === 'Cancelled' || order.paymentStatus === 'rejected'
        ).length;
        break;
      case 'COD':
        count = orders.filter(order => order.paymentMethod === 'COD').length;
        break;
      case 'online':
        count = orders.filter(order => order.paymentMethod !== 'COD' && order.paymentMethod !== undefined).length;
        break;
      default:
        count = 0;
    }
    return { ...filter, count };
  });
};

// Main Component
const Orders = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDeals, setExpandedDeals] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredOrders = useOrdersFilter(orders, activeFilter, searchTerm, sortBy);
  const filtersWithCounts = useMemo(() => calculateFilterCounts(orders), [orders]);

  const handleUnauthorized = useCallback((endpoint) => {
    console.error(`Unauthorized while calling ${endpoint}`);
    toast.error('Session expired. Please login again.');
    logout();
    navigate('/');
  }, [logout, navigate]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) {
      handleUnauthorized('/api/order/list');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/order/list`, {
        headers: { token },
      });

      if (response.data.success) {
        const ordersData = response.data.orders || [];
        setOrders(ordersData);
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/list');
      } else {
        toast.error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/list');
      } else {
        console.error('Error fetching orders:', error);
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  const statusHandler = useCallback(async (event, orderId) => {
    const newStatus = event.target.value;

    if (!token) {
      handleUnauthorized('/api/order/status');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Order status updated');
        fetchAllOrders();
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/status');
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/status');
      } else {
        console.error('Error updating status:', error);
        toast.error(error.response?.data?.message || error.message);
      }
    }
  }, [token, handleUnauthorized, fetchAllOrders]);

  const handleVerificationComplete = useCallback((updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order._id === updatedOrder._id ? updatedOrder : order
    ));
  }, []);

  const handleFilterChange = useCallback((filterId) => {
    setActiveFilter(filterId);
  }, []);

  const toggleDealExpansion = useCallback((orderId, dealName) => {
    const key = `${orderId}-${dealName}`;
    setExpandedDeals(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllOrders();
    } else {
      setLoading(false);
    }
  }, [token, fetchAllOrders]);

  if (loading) return <LoadingSpinner />;
  if (!token) return <AccessRequired navigate={navigate} />;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Order Management</h1>
              <p className="text-gray-600">Manage and track all customer orders (COD & Online)</p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-600">COD Orders </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-600">Verified Online Orders</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-600">Pending Verification</span>
              </div>
            </div>
          </div>

          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            filterOptions={filtersWithCounts}
          />
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            activeFilter={activeFilter}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={statusHandler}
                expandedDeals={expandedDeals}
                onToggleDeal={toggleDealExpansion}
                onVerificationComplete={handleVerificationComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;