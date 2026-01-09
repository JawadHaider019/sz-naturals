import React, { useState, useContext, useEffect, useCallback } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from "react-router-dom"; 
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from "../assets/assets";
import LoginModal from '../components/Login';
import { 
  FaLock, 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaUpload, 
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHome,
  FaCity,
  FaGlobeAsia,
  FaReceipt,
  FaShoppingBag,
  FaChevronDown,
  FaArrowRight,
  FaCheckCircle,
  FaInfoCircle,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

const PlaceOrder = () => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUserDataLoaded, setHasUserDataLoaded] = useState(false);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [pakistanStates, setPakistanStates] = useState([]);
  const [cityZipData, setCityZipData] = useState({});
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('online'); // Default to online only
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  
  // Guest checkout states
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  
  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  const {
    backendUrl,
    token,
    user,
    cartItems,
    cartDeals,
    getDeliveryCharge,
    getCartAmount,
    products,
    deals,
    currency,
    clearCart
  } = useContext(ShopContext);
  
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('orderFormData');
    return savedData ? JSON.parse(savedData) : {
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      phone: ''
    };
  });

  // Payment methods - COD is disabled with "coming soon" notice
  const paymentMethods = [
    {
      id: 'online',
      name: 'Online Payment',
      description: 'Pay now via EasyPaisa/JazzCash',
      icon: <FaCreditCard className="w-5 h-5" />,
      color: 'text-black',
      enabled: true
    },
    {
      id: 'COD',
      name: 'Cash on Delivery',
      description: 'Coming Soon',
      icon: <FaMoneyBillWave className="w-5 h-5" />,
      color: 'text-gray-400',
      enabled: false
    }
  ];

  // Calculate total amount
  const calculateTotalAmount = () => {
    try {
      const subtotal = getCartAmount?.() || 0;
      const deliveryCharge = getDeliveryCharge?.(subtotal) || 0;
      return subtotal + deliveryCharge;
    } catch (error) {
      return 0;
    }
  };

  const totalAmount = calculateTotalAmount();

  // Check authentication status and setup guest checkout
  useEffect(() => {
    if (!token || !user) {
      setIsGuestCheckout(true);
    } else {
      setIsGuestCheckout(false);
    }
  }, [token, user]);

  // Load user data as defaults for logged-in users
  useEffect(() => {
    if (user?.name && user?.email && !hasUserDataLoaded && !isGuestCheckout) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || prev.phone
      }));
      setHasUserDataLoaded(true);
    }
  }, [user, hasUserDataLoaded, isGuestCheckout]);

  // Load Pakistan states
  useEffect(() => {
    const loadPakistanStates = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/locations/pakistan/states`);
        if (response.data.success) {
          setPakistanStates(response.data.data.states.map(state => state.name));
        }
      } catch (error) {
        setPakistanStates(['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan']);
      }
    };
    
    if (backendUrl) {
      loadPakistanStates();
    }
  }, [backendUrl]);

  // Fetch cities with ZIP codes
  const fetchCitiesByState = useCallback(async (stateName) => {
    if (!stateName) {
      setCities([]);
      setCityZipData({});
      return;
    }

    setIsLoadingCities(true);
    try {
      const response = await axios.get(`${backendUrl}/api/locations/cities`, {
        params: { state: stateName }
      });

      if (response.data.success) {
        const citiesData = response.data.data.cities;
        
        if (citiesData.length > 0) {
          const cityNames = citiesData.map(city => city.name).sort();
          setCities(cityNames);
          
          const zipMapping = {};
          
          citiesData.forEach(city => {
            if (city.name && city.zipCode && city.zipCode !== 'N/A') {
              zipMapping[city.name] = city.zipCode;
            }
          });
          
          setCityZipData(zipMapping);
        }
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoadingCities(false);
    }
  }, [backendUrl]);

  // Auto-fill ZIP code
  const autoFillZipCode = useCallback((cityName) => {
    if (cityName && cityZipData[cityName] && !formData.zipcode) {
      setFormData(prev => ({
        ...prev,
        zipcode: cityZipData[cityName]
      }));
      
      if (validationErrors.zipcode) {
        setValidationErrors(prev => ({ ...prev, zipcode: '' }));
      }
    }
  }, [cityZipData, formData.zipcode, validationErrors.zipcode]);

  // Update cities when state changes
  useEffect(() => {
    if (formData.state) {
      fetchCitiesByState(formData.state);
    } else {
      setCities([]);
      setCityZipData({});
    }
  }, [formData.state, fetchCitiesByState]);

  // Auto-fill ZIP code when city changes
  useEffect(() => {
    if (formData.city && cityZipData[formData.city] && !formData.zipcode) {
      autoFillZipCode(formData.city);
    }
  }, [formData.city, formData.zipcode, cityZipData, autoFillZipCode]);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem('orderFormData', JSON.stringify(formData));
  }, [formData]);

  // Field validation
  const validateField = async (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) errors.fullName = 'Customer name is required';
        else if (value.trim().length < 2) errors.fullName = 'Customer name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]{2,50}$/.test(value.trim())) errors.fullName = 'Customer name can only contain letters and spaces';
        break;
        
      case 'email':
        if (!value.trim()) errors.email = 'Customer email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email address';
        break;
        
      case 'street':
        if (!value.trim()) errors.street = 'Street address is required';
        else if (value.trim().length < 5) errors.street = 'Please enter a complete street address';
        break;
        
      case 'city':
        if (!value.trim()) errors.city = 'City is required';
        break;
        
      case 'state':
        if (!value.trim()) errors.state = 'Province is required';
        else if (!pakistanStates.includes(value)) errors.state = 'Please select a valid province';
        break;
        
      case 'zipcode':
        if (!value.trim()) errors.zipcode = 'ZIP code is required';
        else if (!/^\d{5}$/.test(value.trim())) errors.zipcode = 'ZIP code must be 5 digits';
        break;
        
      case 'phone':
        if (!value.trim()) errors.phone = 'Phone number is required';
        else if (!/^03\d{9}$/.test(value.replace(/\D/g, ''))) errors.phone = 'Please enter a valid Pakistani phone number (03XXXXXXXXX)';
        break;
    }
    
    return errors;
  };

  const validateForm = async () => {
    const errors = {};
    
    // Validate all form fields
    for (const field of Object.keys(formData)) {
      const fieldErrors = await validateField(field, formData[field]);
      Object.assign(errors, fieldErrors);
    }
    
    // Validate payment screenshot for online payments only
    if (paymentMethod === 'online' && !paymentScreenshot) {
      errors.payment = 'Please upload payment screenshot';
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  // Handle payment screenshot upload - FIXED
  const handlePaymentScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    setPaymentScreenshot(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    if (validationErrors.payment) {
      setValidationErrors(prev => ({ ...prev, payment: '' }));
    }
    
    toast.success('Payment screenshot uploaded successfully!');
  };

  // Remove payment screenshot
  const removePaymentScreenshot = () => {
    setPaymentScreenshot(null);
    setPreviewImage(null);
    toast.info('Payment screenshot removed');
  };

  // Trigger file input click - FIXED
  const triggerFileInput = () => {
    const fileInput = document.getElementById('payment-screenshot');
    if (fileInput) {
      fileInput.click();
    }
  };

  const onChangeHandler = async (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      formattedValue = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4, 11)}` : digits;
    }
    
    if ((name === 'fullName' || name === 'city') && /\d/.test(value)) return;
    
    if (name === 'state' && value !== formData.state) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        city: '',
        zipcode: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedValue || value }));
    }
    
    if (name === 'city' && value && cityZipData[value] && !formData.zipcode) {
      setTimeout(() => autoFillZipCode(value), 100);
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onBlurHandler = async (e) => {
    const { name, value } = e.target;
    const errors = await validateField(name, value);
    setValidationErrors(prev => ({ ...prev, ...errors }));
  };

  // Process cart items for order
  const processCartItems = () => {
    let orderItems = [];
    let calculatedAmount = 0;

    // Process regular products
    if (cartItems && products) {
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
          const productInfo = products.find(product => product._id === itemId);
          if (productInfo?.name) {
            const unitPrice = productInfo.discountprice > 0 ? productInfo.discountprice : productInfo.price;
            const itemTotal = unitPrice * quantity;
            
            orderItems.push({
              id: productInfo._id,
              name: productInfo.name,
              price: unitPrice,
              quantity: quantity,
              image: productInfo.image?.[0],
              category: productInfo.category,
              isFromDeal: false,
              description: productInfo.description,
              originalPrice: productInfo.price,
              hasDiscount: productInfo.discountprice > 0
            });
            
            calculatedAmount += itemTotal;
          }
        }
      });
    }

    // Process deals
    if (cartDeals && deals) {
      Object.entries(cartDeals).forEach(([dealId, dealQuantity]) => {
        if (dealQuantity > 0) {
          const dealInfo = deals.find(deal => deal._id === dealId);
          if (dealInfo?.dealName) {
            const unitPrice = dealInfo.dealFinalPrice || dealInfo.price;
            const itemTotalPrice = unitPrice * dealQuantity;
            
            orderItems.push({
              id: dealInfo._id,
              name: dealInfo.dealName,
              price: unitPrice,
              quantity: dealQuantity,
              image: dealInfo.dealImages?.[0] || assets.placeholder_image,
              category: 'Deal',
              isFromDeal: true,
              description: dealInfo.dealDescription,
              type: 'deal'
            });
            
            calculatedAmount += itemTotalPrice;
          }
        }
      });
    }

    return { orderItems, calculatedAmount };
  };

  // Handle login for checkout
  const handleLoginForCheckout = () => {
    setAuthMode('login');
    setIsLoginModalOpen(true);
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsGuestCheckout(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // Only online payment is available for now
    if (paymentMethod === 'COD') {
      toast.error('Cash on Delivery is coming soon. Please use online payment.');
      return;
    }
    
    if (!await validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    
    try {
      const { orderItems, calculatedAmount } = processCartItems();
      const deliveryCharge = getDeliveryCharge(calculatedAmount);
      const finalAmount = calculatedAmount + deliveryCharge;

      if (orderItems.length === 0) {
        toast.error('Your cart is empty');
        setLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: orderItems,
        amount: finalAmount,
        address: formData,
        deliveryCharges: deliveryCharge,
        customerDetails: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone
        },
        paymentMethod: paymentMethod,
        paymentStatus: 'pending',
        paymentAmount: finalAmount
      };

      // Prepare API endpoint and headers based on checkout type
      let apiEndpoint;
      let requestHeaders = {
        'Content-Type': 'multipart/form-data'
      };

      if (isGuestCheckout) {
        // Guest checkout - no token required
        apiEndpoint = `${backendUrl}/api/order/guest/place-with-payment`;
      } else {
        // Logged-in user - token required
        if (!token) {
          toast.error('Please login to continue');
          setIsLoginModalOpen(true);
          setAuthMode('login');
          setLoading(false);
          return;
        }
        apiEndpoint = `${backendUrl}/api/order/place-with-payment`;
        requestHeaders.token = token;
      }

      // Upload payment screenshot for online payments
      const formDataToSend = new FormData();
      
      if (paymentMethod === 'online' && paymentScreenshot) {
        formDataToSend.append('payment_screenshot', paymentScreenshot);
      }
      
      formDataToSend.append('orderData', JSON.stringify(orderData));
      
      if (paymentMethod === 'online' && !paymentScreenshot) {
        toast.error('Please upload payment screenshot for online payment');
        setLoading(false);
        return;
      }
      
      setIsUploadingPayment(true);
      
      const response = await axios.post(
        apiEndpoint, 
        formDataToSend, 
        {
          headers: requestHeaders
        }
      );
      
      if (response.data.success) {
        // Clear cart only for logged-in users
        if (!isGuestCheckout) {
          clearCart();
        }
        
        localStorage.removeItem('orderFormData');
        
        if (isGuestCheckout) {
          // Save guest order info
          const guestOrderInfo = {
            orderId: response.data.orderId,
            guestId: response.data.guestId,
            email: orderData.customerDetails.email,
            timestamp: Date.now()
          };
          localStorage.setItem('guestOrderInfo', JSON.stringify(guestOrderInfo));
          
          toast.success(
            <div>
              <p>✅ Order placed successfully as guest!</p>
              <p className="text-sm mt-1">
                Save this order ID: <strong>{response.data.orderId}</strong>
              </p>
              <p className="text-sm">Check your email for tracking details.</p>
            </div>
          );
          
          navigate('/orders', { 
            state: { 
              orderId: response.data.orderId,
              guestId: response.data.guestId,
              email: orderData.customerDetails.email
            } 
          });
        } else {
          // For logged-in users
          toast.success(response.data.message || 'Order placed successfully!');
          navigate('/orders');
        }
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      
      if (error.response?.status === 401 && !isGuestCheckout) {
        setIsLoginModalOpen(true);
        setAuthMode('login');
        toast.error('Your session has expired. Please login again.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsUploadingPayment(false);
    }
  };

  // Check if cart is empty
  const cartItemCount = (cartItems ? Object.keys(cartItems).length : 0) + 
                       (cartDeals ? Object.keys(cartDeals).length : 0);

  // Get selected payment method
  const selectedPaymentMethod = paymentMethods.find(p => p.id === paymentMethod);

  if (cartItemCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <FaShoppingBag className="w-12 h-12 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Add some herbal products to your cart first</p>
          <button 
            onClick={() => navigate('/collection')}
            className="group bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-800 transition-all duration-300 w-full flex items-center justify-center gap-3"
          >
            <span>Browse Products</span>
            <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // Render Guest Checkout Header
  const renderGuestCheckoutHeader = () => {
    if (!isGuestCheckout) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h2>
            <p className="text-gray-600 text-lg">
              You're checking out as a guest. Your order will be stored for 30 days.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLoginForCheckout}
              className="px-8 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:border-black"
            >
              Login to Account
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render User Checkout Header
  const renderUserCheckoutHeader = () => {
    if (isGuestCheckout) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h3>
            <p className="text-gray-600">Your order will be saved to your account history.</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Input Field
  const renderInputField = (name, type = 'text', placeholder, label, required = true, icon) => (
    <div className="w-full">
      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3 tracking-wide">
        {icon && <span className="mr-3 opacity-70">{icon}</span>}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
        name={name} 
        value={formData[name]} 
        className={`w-full px-5 py-4 border-2 ${validationErrors[name] ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white/80'} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all duration-300 text-gray-800 placeholder-gray-400`} 
        type={type}
        placeholder={placeholder}
        required={required}
      />
      {validationErrors[name] && (
        <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
          <FaInfoCircle className="w-4 h-4" />
          {validationErrors[name]}
        </p>
      )}
    </div>
  );

  // Render Select Field
  const renderSelectField = (name, options, placeholder, label, required = true, icon) => (
    <div className="w-full">
      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3 tracking-wide">
        {icon && <span className="mr-3 opacity-70">{icon}</span>}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
        name={name}
        value={formData[name]}
        className={`w-full px-5 py-4 border-2 ${validationErrors[name] ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white/80'} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all duration-300 text-gray-800 appearance-none cursor-pointer`}
        required={required}
      >
        <option value="" className="text-gray-400">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option} className="text-gray-800">{option}</option>
        ))}
      </select>
      {validationErrors[name] && (
        <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
          <FaInfoCircle className="w-4 h-4" />
          {validationErrors[name]}
        </p>
      )}
    </div>
  );

  // Render Payment Dropdown - UPDATED for COD coming soon
  const renderPaymentDropdown = () => (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method</h2>
        <p className="text-gray-600">Select your preferred payment option</p>
        
        {/* COD Coming Soon Notice */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-700 font-medium">
              Cash on Delivery is coming soon. Currently only online payment is available.
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Selected Payment Display */}
        <div 
          className={`border-2 ${showPaymentDropdown ? 'border-black' : 'border-gray-200'} bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 hover:border-black`}
          onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${selectedPaymentMethod.color.replace('text-', 'bg-')} bg-opacity-10`}>
                {selectedPaymentMethod.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{selectedPaymentMethod.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedPaymentMethod.description}</p>
              </div>
            </div>
            <FaChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showPaymentDropdown ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {/* Dropdown Menu */}
        {showPaymentDropdown && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-5 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-300 hover:bg-gray-50 ${paymentMethod === method.id ? 'bg-gray-50' : ''} ${!method.enabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (!method.enabled) {
                    toast.info('Cash on Delivery is coming soon. Please use online payment.');
                    return;
                  }
                  setPaymentMethod(method.id);
                  setShowPaymentDropdown(false);
                  if (method.id === 'COD') {
                    setPaymentScreenshot(null);
                    setPreviewImage(null);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${method.color.replace('text-', 'bg-')} bg-opacity-10`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${method.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {method.name}
                        {!method.enabled && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Coming Soon
                          </span>
                        )}
                      </h3>
                      {paymentMethod === method.id && (
                        <FaCheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${method.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Online Payment Section - FIXED UPLOAD BUTTON
  const renderOnlinePaymentSection = () => (
    <div className="mt-8">
      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-green-100 rounded-lg">
            <FaCreditCard className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Online Payment</h3>
            <p className="text-gray-600 text-sm mt-1">Complete your payment securely</p>
          </div>
        </div>
        
        {/* Payment Details Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-700 font-medium text-lg">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {currency} {totalAmount.toFixed(2)}
            </span>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">EasyPaisa Number</p>
                <p className="text-2xl font-bold text-gray-900">0313 4471652</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 mb-1">Account Name</p>
                <p className="text-lg font-bold text-gray-900">Muhammad Sheraz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Screenshot Upload - FIXED */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Upload Payment Proof</h4>
              <p className="text-gray-600 text-sm">Upload screenshot of your payment confirmation</p>
            </div>
            <div className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg">
              Required
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            onChange={handlePaymentScreenshot}
            className="hidden"
            id="payment-screenshot"
          />
          
          {!previewImage ? (
            <div 
              className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-gray-400 transition-all duration-300 cursor-pointer bg-gray-50/50"
              onClick={triggerFileInput}
            >
              <div className="mx-auto w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
                <FaUpload className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-3">
                Drop your screenshot here or click to upload
              </p>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Upload a clear screenshot of your payment confirmation from EasyPaisa/JazzCash app
              </p>
              <div className="flex items-center justify-center gap-4">
            
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP • Max 5MB
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-2xl p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-lg font-bold text-gray-800">Payment Screenshot Uploaded</p>
                  <p className="text-sm text-gray-500">Ready for verification</p>
                </div>
                <button
                  type="button"
                  onClick={removePaymentScreenshot}
                  className="text-red-500 hover:text-red-700 font-medium flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                  Remove
                </button>
              </div>
              <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
                <img 
                  src={previewImage} 
                  alt="Payment screenshot" 
                  className="max-w-full h-auto max-h-56 rounded-lg border-2 border-gray-200 shadow-sm"
                />
              </div>
            </div>
          )}
          
          {validationErrors.payment && (
            <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <FaInfoCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium">
                  {validationErrors.payment}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 mb-4 text-lg">Note:</h4>
          <div className="space-y-4">
       
              <p className="text-gray-700 flex flex-col gap-2">
        <span>    Please send the payment to our EasyPaisa account details provided above.</span>
           <span> Before sending the payment, ensure that the account name matches exactly.</span>
           <span> After completing the payment, take a screenshot of the transaction.</span>
           <span> Upload and share the screenshot by clicking on the upload icon to verify your payment.</span>
              </p>
           
          </div>
        </div>
      </div>
    </div>
  );

  // Don't render COD instructions since it's coming soon
  const renderCODInstructions = () => null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6">
              <Title text1={'Complete Your'} text2={'Order'} />
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Review your information and complete your payment
            </p>
          </div>

          {/* Guest/User Checkout Header */}
          {renderGuestCheckoutHeader()}
          {renderUserCheckoutHeader()}

          {/* Main Form - ALWAYS SHOWN FOR BOTH GUEST AND LOGGED IN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Delivery Information */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="p-3 bg-black/5 rounded-lg">
                    <FaMapMarkerAlt className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isGuestCheckout ? 'Guest Information' : 'Delivery Information'}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {isGuestCheckout ? 'Enter your details for delivery' : 'Where should we deliver your order?'}
                    </p>
                  </div>
                </div>
                
                <form onSubmit={onSubmitHandler} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputField('fullName', 'text', 'Enter your full name', 'Full Name', true, <FaUser />)}
                    {renderInputField('email', 'email', 'your.email@example.com', 'Email Address', true, <FaEnvelope />)}
                  </div>
                  
                  {renderInputField('street', 'text', 'House #, Street, Area', 'Street Address', true, <FaHome />)}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSelectField('state', pakistanStates, 'Select your province', 'Province', true, <FaGlobeAsia />)}
                    {renderSelectField('city', cities, cities.length ? 'Select your city' : 'Select province first', 'City', true, <FaCity />)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputField('zipcode', 'number', '5-digit ZIP code', 'ZIP Code', true)}
                    {renderInputField('phone', 'tel', '0300-1234567', 'Phone Number', true, <FaPhone />)}
                  </div>

                  {renderPaymentDropdown()}
                  {paymentMethod === 'online' && renderOnlinePaymentSection()}
                </form>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="p-3 bg-black/5 rounded-lg">
                    <FaReceipt className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                    <p className="text-gray-600 text-sm mt-1">Review your order details</p>
                  </div>
                </div>
                
                <CartTotal />
                
                {/* Payment Summary */}
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Payment Method:</span>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded ${selectedPaymentMethod.color.replace('text-', 'bg-')} bg-opacity-10`}>
                          {selectedPaymentMethod.icon}
                        </div>
                        <span className="font-semibold text-gray-900">{selectedPaymentMethod.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Amount to Pay:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        Now: {currency} {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
       
                {/* Place Order Button */}
                <div className="mt-8">
                  <button 
                    type='submit' 
                    onClick={onSubmitHandler}
                    className={`mt-6 w-full flex items-center justify-center gap-2 py-4 px-4 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                      loading || isUploadingPayment || (paymentMethod === 'online' && !paymentScreenshot)
                        ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-black hover:text-white' 
                        : ''
                    }`}
                    disabled={loading || isUploadingPayment || (paymentMethod === 'online' && !paymentScreenshot)}
                  >
                    {isUploadingPayment ? (
                      <>
                        <FaSpinner className="animate-spin w-5 h-5" />
                        Verifying Payment...
                      </>
                    ) : loading ? (
                      <>
                        <FaSpinner className="animate-spin w-5 h-5" />
                        Processing Order...
                      </>
                    ) : paymentMethod === 'online' && !paymentScreenshot ? (
                      'Upload Payment to Continue'
                    ) : (
                      <>
                        <span>
                          Place Order & Continue
                        </span>
                        <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
             
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />
    </>
  );
};

export default PlaceOrder;