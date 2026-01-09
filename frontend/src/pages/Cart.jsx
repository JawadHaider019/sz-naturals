import { useContext, useEffect, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from '../components/Title';
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { useNavigate } from "react-router-dom"; 
import { 
  FaInfoCircle, 
  FaTrash, 
  FaMinus, 
  FaPlus, 
  FaChevronDown, 
  FaChevronUp, 
  FaExclamationTriangle,
  FaLeaf,
  FaBoxOpen,
  FaArrowRight,
  FaShoppingBag
} from "react-icons/fa";

const Cart = () => {
  const { 
    products, 
    deals, 
    currency, 
    cartItems, 
    cartDeals,
    updateQuantity,
    updateDealQuantity
  } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [productCartData, setProductCartData] = useState([]);
  const [dealCartData, setDealCartData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState({});
  const [hasOutOfStockItems, setHasOutOfStockItems] = useState(false);
  const navigate = useNavigate();

  // Stock checking
  const getProductStockInfo = useCallback((productId, quantity) => {
    const product = products.find(p => p._id === productId);
    if (!product) {
      return {
        inStock: false,
        available: 0,
        requested: quantity,
        isOutOfStock: true
      };
    }

    const availableStock = product.quantity || 0;
    const isOutOfStock = availableStock === 0;
    
    return {
      inStock: !isOutOfStock,
      available: availableStock,
      requested: quantity,
      isOutOfStock
    };
  }, [products]);

  const getDealStockInfo = useCallback((dealId, quantity) => {
    const deal = deals.find(d => d._id === dealId);
    if (!deal) {
      return {
        inStock: false,
        available: 0,
        requested: quantity,
        isOutOfStock: true
      };
    }

    const dealProducts = getDealProductsFromDeal(deal);
    const hasOutOfStockProduct = dealProducts.some(product => 
      product && (product.quantity === 0 || product.stock === 0)
    );

    const isOutOfStock = hasOutOfStockProduct;
    
    return {
      inStock: !isOutOfStock,
      available: 99,
      requested: quantity,
      isOutOfStock
    };
  }, [deals, products]);

  // Helper function to get deal products
  const getDealProductsFromDeal = (deal) => {
    if (deal.dealProducts && deal.dealProducts.length > 0) {
      return deal.dealProducts.map(product => {
        const productData = products.find(p => p._id === product._id) || product;
        return {
          ...productData,
          quantity: product.quantity || 1
        };
      });
    } else if (deal.products && deal.products.length > 0) {
      return deal.products.map(productId => {
        const product = products.find(p => p._id === productId);
        return {
          ...product,
          quantity: 1
        };
      });
    }
    return [];
  };

  // Update cart data
  useEffect(() => {
    const tempProductData = [];
    let outOfStockFound = false;

    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const product = products.find(p => p._id === itemId);
        if (product) {
          const stockInfo = getProductStockInfo(itemId, cartItems[itemId]);
          
          if (stockInfo.isOutOfStock) {
            outOfStockFound = true;
          }

          tempProductData.push({
            id: itemId, 
            quantity: cartItems[itemId],
            type: 'product',
            data: product,
            stockInfo
          });
        }
      }
    }
    setProductCartData(tempProductData);

    const tempDealData = [];
    for (const dealId in cartDeals) {
      if (cartDeals[dealId] > 0) {
        const deal = deals.find(d => d._id === dealId);
        if (deal) {
          const stockInfo = getDealStockInfo(dealId, cartDeals[dealId]);
          
          if (stockInfo.isOutOfStock) {
            outOfStockFound = true;
          }

          tempDealData.push({
            id: dealId, 
            quantity: cartDeals[dealId],
            type: 'deal',
            data: deal,
            stockInfo
          });
        }
      }
    }
    setDealCartData(tempDealData);
    setHasOutOfStockItems(outOfStockFound);
  }, [cartItems, cartDeals, products, deals, getProductStockInfo, getDealStockInfo]);

  const getItemDisplayData = (item) => {
    if (item.type === 'product') {
      const product = item.data;
      const unitPrice = product.discountprice > 0 ? product.discountprice : product.price;
      const itemTotalPrice = unitPrice * item.quantity;
      
      const stockInfo = item.stockInfo || getProductStockInfo(item.id, item.quantity);
      const availableStock = stockInfo.available || 0;
      
      const isOutOfStock = availableStock === 0;
      const canAddMore = availableStock > 0 && item.quantity < availableStock;

      return {
        name: product.name,
        image: product.image?.[0] || assets.placeholder_image,
        unitPrice,
        itemTotalPrice,
        type: 'product',
        description: product.description,
        fullData: product,
        originalPrice: product.price,
        hasDiscount: product.discountprice > 0,
        availableStock,
        isOutOfStock,
        canAddMore,
        stockMessage: getStockMessage(availableStock, item.quantity, isOutOfStock)
      };
    } else {
      const deal = item.data;
      const unitPrice = deal.dealFinalPrice || deal.dealTotal;
      const itemTotalPrice = unitPrice * item.quantity;
      
      const stockInfo = item.stockInfo || getDealStockInfo(item.id, item.quantity);
      const isOutOfStock = stockInfo.isOutOfStock;
      const canAddMore = !isOutOfStock;

      return {
        name: deal.dealName,
        image: deal.dealImages?.[0] || assets.placeholder_image,
        unitPrice,
        itemTotalPrice,
        type: 'deal',
        description: deal.dealDescription,
        fullData: deal,
        originalTotalPrice: deal.dealTotal,
        savings: deal.dealSavings,
        availableStock: 999,
        isOutOfStock,
        canAddMore,
        stockMessage: getStockMessage(999, item.quantity, isOutOfStock)
      };
    }
  };

  // Stock message logic
  const getStockMessage = (availableStock, currentQuantity, isOutOfStock) => {
    if (isOutOfStock) {
      return "Out of Stock";
    } else if (currentQuantity > availableStock) {
      return `Only ${availableStock} available`;
    } else if (availableStock < 5) {
      return `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} left!`;
    } else if (availableStock < 10) {
      return `${availableStock} items left`;
    } else if (availableStock < 20) {
      return "Limited items left";
    } else {
      return "In Stock";
    }
  };

  // Stock status rendering
  const renderStockStatus = (availableStock, currentQuantity, isOutOfStock) => {
    if (isOutOfStock) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <p className="text-red-500 font-medium">Out of Stock</p>
        </div>
      );
    } else if (currentQuantity > availableStock) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div>
            <p className="text-red-500 font-medium">Only {availableStock} available</p>
            <p className="text-red-400 text-xs mt-1">Quantity adjusted to available stock</p>
          </div>
        </div>
      );
    } else if (availableStock < 5) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div>
            <p className="text-red-500 font-medium">Only {availableStock} item{availableStock !== 1 ? 's' : ''} left!</p>
            <p className="text-red-400 text-xs mt-1">Hurry, low stock</p>
          </div>
        </div>
      );
    } else if (availableStock < 10) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <div>
            <p className="text-orange-500">{availableStock} items left</p>
            <p className="text-orange-400 text-xs mt-1">Limited stock available</p>
          </div>
        </div>
      );
    } else if (availableStock < 20) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <p className="text-yellow-600">Limited items left</p>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div>
            <p className="text-green-500 font-medium">In Stock</p>
            <p className="text-green-600 text-xs mt-1">Available for immediate shipping</p>
          </div>
        </div>
      );
    }
  };

  // Quantity update functions
  const handleQuantityUpdate = (itemId, quantity, itemType) => {
    if (itemType === 'deal') {
      updateDealQuantity(itemId, quantity);
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId, itemType) => {
    handleQuantityUpdate(itemId, 0, itemType);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  const toggleDealExpansion = (dealId) => {
    setExpandedDeals(prev => ({
      ...prev,
      [dealId]: !prev[dealId]
    }));
  };

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) {
      return;
    }
    
    if (productCartData.length === 0 && dealCartData.length === 0) {
      return;
    }
    
    navigate('/place-order');
  };

  // Fixed Quantity Controls component
  const QuantityControls = ({ item, itemType }) => {
    const itemData = getItemDisplayData(item);
    
    if (itemData.isOutOfStock) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <FaExclamationTriangle className="w-3 h-3" />
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
        </div>
      );
    }

    const maxQuantity = Math.min(50, itemData.availableStock);
    
    const handleIncrement = () => {
      if (item.quantity < maxQuantity) {
        handleQuantityUpdate(item.id, item.quantity + 1, itemType);
      }
    };

    const handleDecrement = () => {
      if (item.quantity > 1) {
        handleQuantityUpdate(item.id, item.quantity - 1, itemType);
      }
    };

    const handleDirectUpdate = (newQuantity) => {
      const parsedQuantity = parseInt(newQuantity) || 1;
      if (parsedQuantity >= 1 && parsedQuantity <= maxQuantity) {
        handleQuantityUpdate(item.id, parsedQuantity, itemType);
      } else if (parsedQuantity > maxQuantity) {
        handleQuantityUpdate(item.id, maxQuantity, itemType);
      }
    };

    const isIncrementDisabled = item.quantity >= maxQuantity;
    const isDecrementDisabled = item.quantity <= 1;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center border rounded-lg border-gray-300 bg-white">
          <button
            onClick={handleDecrement}
            disabled={isDecrementDisabled}
            className={`px-3 py-1.5 ${
              isDecrementDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaMinus className="w-3 h-3" />
          </button>
          
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleDirectUpdate(e.target.value)}
            min={1}
            max={maxQuantity}
            disabled={itemData.isOutOfStock}
            className={`w-14 border-0 text-center text-sm focus:ring-0 focus:outline-none ${
              itemData.isOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          
          <button
            onClick={handleIncrement}
            disabled={isIncrementDisabled}
            className={`px-3 py-1.5 ${
              isIncrementDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaPlus className="w-3 h-3" />
          </button>
        </div>
        
        <div className="text-xs">
          {renderStockStatus(itemData.availableStock, item.quantity, itemData.isOutOfStock)}
        </div>
      </div>
    );
  };

  // Get deal products with proper data
  const getDealProducts = (deal) => {
    const dealProducts = getDealProductsFromDeal(deal);
    return dealProducts.map(product => {
      if (!product) return null;
      
      const availableStock = product.quantity || product.stock || 0;
      const isOutOfStock = availableStock === 0;
      
      return {
        ...product,
        quantity: product.quantity || 1,
        availableStock,
        stockMessage: getStockMessage(availableStock, product.quantity || 1, isOutOfStock),
        isOutOfStock
      };
    }).filter(Boolean);
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    const itemData = getItemDisplayData(selectedItem);
    const isProduct = selectedItem.type === 'product';
    const product = itemData.fullData;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isProduct ? (
                    <FaLeaf className="text-gray-600" />
                  ) : (
                    <div className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">DEAL</div>
                  )}
                  <span className="text-sm text-gray-600">Product Details</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{itemData.name}</h2>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image */}
              <div className="relative">
                <img
                  src={itemData.image}
                  alt={itemData.name}
                  className="w-full h-64 lg:h-80 object-cover rounded-xl"
                />
                {itemData.isOutOfStock && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-3 py-1.5 font-bold rounded-full">
                    OUT OF STOCK
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-6">
                {/* Stock Status */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  {renderStockStatus(itemData.availableStock, selectedItem.quantity, itemData.isOutOfStock)}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {itemData.description || "No description available."}
                  </p>
                </div>

                {/* Pricing Summary */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900">Pricing Summary</h3>
                  
                  {isProduct && itemData.hasDiscount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="line-through text-gray-500">
                        {currency}{itemData.originalPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {!isProduct && itemData.originalTotalPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Original Total:</span>
                      <span className="line-through text-gray-500">
                        {currency}{itemData.originalTotalPrice.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {currency}{itemData.unitPrice.toFixed(2)}
                    </span>
                  </div>

                  {isProduct && itemData.hasDiscount && (
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                      <span className="font-medium text-green-700">You Save:</span>
                      <span className="font-semibold text-green-700">
                        {currency}{(itemData.originalPrice - itemData.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {!isProduct && itemData.savings && (
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                      <span className="font-medium text-green-700">Deal Savings:</span>
                      <span className="font-semibold text-green-700">
                        {currency}{itemData.savings.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Quantity:</span>
                    <span className="font-bold text-gray-900">{selectedItem.quantity}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {currency}{itemData.itemTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deal Products Section */}
            {!isProduct && product.dealProducts && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Includes {product.dealProducts.length} Products
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getDealProducts(product).map((dealProduct, index) => (
                    <div key={index} className={`p-4 rounded-xl border ${dealProduct.isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex items-start gap-4">
                        <img
                          src={dealProduct.image?.[0] || assets.placeholder_image}
                          alt={dealProduct.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${dealProduct.isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                            {dealProduct.name}
                          </h4>
                          <div className="mt-2 flex justify-between items-center">
                            <div>
                              {dealProduct.discountprice > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-xs text-gray-500">
                                    {currency}{dealProduct.price}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {currency}{dealProduct.discountprice}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold text-gray-900">
                                  {currency}{dealProduct.price}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">Qty: {dealProduct.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render empty cart
  const renderEmptyCart = () => (
    <div className="text-center py-20">
      <div className="mb-8">
        <FaBoxOpen className="text-gray-300 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Start adding some herbal goodness to your cart
        </p>
      </div>
      <button
        onClick={() => navigate('/shop')}
        className="group inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-900 transition-colors font-medium"
      >
        <FaShoppingBag className="w-4 h-4" />
        BROWSE PRODUCTS
        <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  return (
    <div className="pt-8 md:pt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6">
          <Title text1={'Your'} text2={'Cart'} />
        </div>
        <p className="text-gray-600 text-lg">
          Review your selection of herbal products
        </p>
      </div>

      {/* Cart Content */}
      {productCartData.length === 0 && dealCartData.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          {/* Products Section */}
          {productCartData.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  Products <span className="text-gray-500">({productCartData.length})</span>
                </h3>
                {hasOutOfStockItems && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span>Contains out-of-stock items</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {productCartData.map((item, index) => {
                  const itemData = getItemDisplayData(item);

                  return (
                    <div
                      key={`product-${item.id}-${index}`}
                      className={`bg-white rounded-xl p-6 ${
                        itemData.isOutOfStock 
                          ? 'border-2 border-red-300 bg-red-50/30' 
                          : 'border border-gray-200 hover:border-gray-300'
                      } transition-all duration-300`}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        <div className="relative flex-shrink-0">
                          <img
                            className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            src={itemData.image}
                            alt={itemData.name}
                            onClick={() => handleViewDetails(item)}
                          />
                          {itemData.isOutOfStock && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 font-bold rounded">
                              OUT OF STOCK
                            </div>
                          )}
                          {itemData.hasDiscount && (
                            <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 font-bold rounded">
                              SALE
                            </div>
                          )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="mb-4">
                                <h4 
                                  className={`text-xl font-semibold cursor-pointer hover:text-gray-700 transition-colors line-clamp-2 mb-2 ${
                                    itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                  }`}
                                  onClick={() => handleViewDetails(item)}
                                >
                                  {itemData.name}
                                </h4>
                                
                                <div className="flex items-center gap-4 mb-4">
                                  {itemData.hasDiscount ? (
                                    <div className="flex items-center gap-3">
                                      <span className="line-through text-gray-500">
                                        {currency}{itemData.originalPrice}
                                      </span>
                                      <span className={`text-2xl font-bold ${
                                        itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                      }`}>
                                        {currency}{itemData.unitPrice}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={`text-2xl font-bold ${
                                      itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {currency}{itemData.unitPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Price and Actions */}
                            <div className="flex flex-col items-end gap-4">
                              <div className="text-right">
                                <div className="text-sm text-gray-600 mb-1">Total</div>
                                <div className={`text-2xl font-bold ${
                                  itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                }`}>
                                  {currency}{itemData.itemTotalPrice.toFixed(2)}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleRemoveItem(item.id, 'product')}
                                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm"
                              >
                                <FaTrash className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Controls and Details */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => handleViewDetails(item)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                              >
                                <FaInfoCircle className="w-4 h-4" />
                                View Details
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                              <QuantityControls item={item} itemType="product" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deals Section */}
          {dealCartData.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Special Deals <span className="text-gray-500">({dealCartData.length})</span>
              </h3>
              
              <div className="space-y-6">
                {dealCartData.map((item, index) => {
                  const itemData = getItemDisplayData(item);
                  const deal = item.data;
                  const isExpanded = expandedDeals[item.id];
                  const dealProducts = getDealProducts(deal);

                  return (
                    <div
                      key={`deal-${item.id}-${index}`}
                      className={`bg-white rounded-xl p-6 ${
                        itemData.isOutOfStock 
                          ? 'border-2 border-red-300 bg-red-50/30' 
                          : 'border border-gray-200 hover:border-gray-300'
                      } transition-all duration-300`}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        <div className="relative flex-shrink-0">
                          <img
                            className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            src={itemData.image}
                            alt={itemData.name}
                            onClick={() => handleViewDetails(item)}
                          />
                          {itemData.isOutOfStock && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 font-bold rounded">
                              OUT OF STOCK
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 font-bold rounded">
                            DEAL
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            {/* Deal Info */}
                            <div className="flex-1 min-w-0">
                              <div className="mb-4">
                                <h4 
                                  className="text-xl font-semibold cursor-pointer hover:text-gray-700 transition-colors line-clamp-2 mb-2 text-gray-900"
                                  onClick={() => handleViewDetails(item)}
                                >
                                  {itemData.name}
                                </h4>
                                
                                {itemData.description && (
                                  <p className="text-gray-600 line-clamp-2 mb-4">
                                    {itemData.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 mb-4">
                                  {itemData.originalTotalPrice && itemData.originalTotalPrice > itemData.unitPrice ? (
                                    <div className="flex items-center gap-3">
                                      <span className="line-through text-gray-500">
                                        {currency}{itemData.originalTotalPrice.toFixed(2)}
                                      </span>
                                      <span className={`text-2xl font-bold ${
                                        itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                      }`}>
                                        {currency}{itemData.unitPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={`text-2xl font-bold ${
                                      itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {currency}{itemData.unitPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mb-4">
                                  {renderStockStatus(itemData.availableStock, item.quantity, itemData.isOutOfStock)}
                                </div>
                              </div>
                            </div>

                            {/* Price and Actions */}
                            <div className="flex flex-col items-end gap-4">
                              <div className="text-right">
                                <div className="text-sm text-gray-600 mb-1">Total</div>
                                <div className={`text-2xl font-bold ${
                                  itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                                }`}>
                                  {currency}{itemData.itemTotalPrice.toFixed(2)}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleRemoveItem(item.id, 'deal')}
                                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm"
                              >
                                <FaTrash className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {/* Controls and Details */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => handleViewDetails(item)}
                                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                              >
                                <FaInfoCircle className="w-4 h-4" />
                                View Deal Details
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                              <QuantityControls item={item} itemType="deal" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deal Products Toggle */}
                      {dealProducts.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <button
                            onClick={() => toggleDealExpansion(item.id)}
                            className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <span className="font-medium text-gray-900">
                              View included products ({dealProducts.length})
                            </span>
                            {isExpanded ? (
                              <FaChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <FaChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {dealProducts.map((product, idx) => (
                                <div key={idx} className={`p-4 rounded-lg border ${product.isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={product.image?.[0] || assets.placeholder_image}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm text-gray-900">{product.name}</h5>
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">
                                          {currency}{product.discountprice > 0 ? product.discountprice : product.price}
                                        </span>
                                        <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cart Total and Checkout */}
          {(productCartData.length > 0 || dealCartData.length > 0) && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="flex flex-col items-end gap-8 ">
                {/* Cart Summary */}
                <div className="lg:w-1/2">
                  <CartTotal />
                </div>

                {/* Checkout Section */}
                <div >
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Checkout?</h4>
                        <p className="text-gray-600 text-sm">
                          Complete your purchase with our secure checkout process
                        </p>
                      </div>
                      
                      <button
                        onClick={handleProceedToCheckout}
                        disabled={hasOutOfStockItems}
                         className={` w-full flex items-center justify-center gap-2 py-4 px-4  bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105  whitespace-nowrap"
        ${
                          hasOutOfStockItems
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-900 hover:shadow-lg'
                        }`}
                      >
                        <span>PROCEED TO CHECKOUT</span>
                        <FaArrowRight className={`w-4 h-4 ${!hasOutOfStockItems && 'group-hover:translate-x-1'} transition-transform`} />
                      </button>
                      
                      {hasOutOfStockItems && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-lg">
                          <FaExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                          <p className="text-sm">
                            Please remove out-of-stock items before checkout
                          </p>
                        </div>
                      )}
                      
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product/Deal Details Modal */}
      {showDetailsModal && renderDetailsModal()}
    </div>
  );
};

export default Cart;