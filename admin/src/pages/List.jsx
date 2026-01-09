import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import ProductDetails from '../components/ProductDetails'
import DealDetails from '../components/DealDetails'
import { 
  FaBox, 
  FaTags, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt,
  FaShoppingBag,
  FaPercentage,
  FaDollarSign,
  FaCube,
  FaFire,
  FaPlus,
  FaMinus,
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaClock,
  FaHourglassEnd,
  FaFlask,
  FaInfoCircle,
  FaListUl
} from 'react-icons/fa'

const List = ({ token }) => {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [previewProduct, setPreviewProduct] = useState(null)
  const [categories, setCategories] = useState([]) // Store categories globally

  // Fetch categories for mapping
  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(backendUrl + '/api/product/list')
      
      if (response.data.success) {
        setProducts(response.data.products)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const response = await axios.get(backendUrl + '/api/deal/list')
      if (response.data.success) {
        const dealsData = response.data.deals;
        console.log('Fetched deals from backend:', dealsData.length);
        
        // Check for expired deals and update local state only
        const updatedDeals = dealsData.map(deal => {
          if (deal.status === 'published' && deal.dealEndDate) {
            const endDate = new Date(deal.dealEndDate);
            const now = new Date();
            if (endDate < now) {
              console.log(`Deal ${deal._id} is expired, setting to draft locally`);
              return { ...deal, status: 'draft' };
            }
          }
          return deal;
        });
        
        setDeals(updatedDeals);
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fixed function to update expired deals on backend
  const updateExpiredDealsOnBackend = async () => {
    try {
      const now = new Date();
      const expiredDeals = deals.filter(deal => {
        if (deal.status === 'published' && deal.dealEndDate) {
          const endDate = new Date(deal.dealEndDate);
          return endDate < now;
        }
        return false;
      });

      console.log('Found expired deals to update:', expiredDeals.length);

      // Update each expired deal on backend
      const updatePromises = expiredDeals.map(async (deal) => {
        try {
          const response = await axios.post(
            backendUrl + '/api/deal/update-status',
            { 
              id: deal._id, 
              status: 'draft' 
            },
            { 
              headers: { 
                token: token,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          if (response.data.success) {
            console.log(`✅ Successfully updated deal ${deal._id} to draft status`);
            return { success: true, dealId: deal._id };
          } else {
            console.error(`❌ Failed to update deal ${deal._id}:`, response.data.message);
            return { success: false, dealId: deal._id, error: response.data.message };
          }
        } catch (error) {
          console.error(`❌ Error updating deal ${deal._id}:`, error.response?.data || error.message);
          return { success: false, dealId: deal._id, error: error.message };
        }
      });

      const results = await Promise.all(updatePromises);
      const successfulUpdates = results.filter(result => result.success);
      
      console.log(`Updated ${successfulUpdates.length} expired deals on backend`);
      
      if (successfulUpdates.length > 0) {
        // Refresh deals list to get updated data from backend
        await fetchDeals();
      }

    } catch (error) {
      console.error('❌ Error in updateExpiredDealsOnBackend:', error);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    try {
      const response = await axios.post(
        backendUrl + '/api/product/remove', 
        { id }, 
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchProducts()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeDeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return
    }
    
    try {
      const response = await axios.post(
        backendUrl + '/api/deal/remove', 
        { id }, 
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchDeals()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateProductStatus = async (id, status) => {
    try {
      setProducts(prev =>
        prev.map(p => (p._id === id ? { ...p, status } : p))
      )

      const response = await axios.post(
        backendUrl + '/api/product/update-status',
        { id, status },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success('Product status updated successfully')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log('Product status update error:', error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // Fixed Deal Status Update Function
  const updateDealStatus = async (id, status) => {
    try {
      console.log('Updating deal status:', { id, status });
      
      const response = await axios.post(
        backendUrl + '/api/deal/update-status',
        { 
          id: id, 
          status: status 
        },
        { 
          headers: { 
            token: token,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        toast.success('Deal status updated successfully');
        // Refresh the deals list to get updated data
        await fetchDeals();
      } else {
        toast.error(response.data.message);
        // Revert frontend state if backend update failed
        await fetchDeals();
      }
    } catch (error) {
      console.log('Deal status update error:', error);
      toast.error(error.response?.data?.message || error.message);
      // Revert frontend state on error
      await fetchDeals();
    }
  };

  const updateProductStock = async (productId, newQuantity) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/product/update-stock',
        { id: productId, quantity: newQuantity },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success('Stock updated successfully')
        setProducts(prev =>
          prev.map(p => p._id === productId ? { ...p, quantity: newQuantity } : p)
        )
        return true
      } else {
        toast.error(response.data.message)
        return false
      }
    } catch (error) {
      console.log('Stock update error:', error)
      toast.error(error.response?.data?.message || error.message)
      return false
    }
  }

  const handleViewProduct = (product) => {
    setPreviewProduct(product)
  }

  const handleClosePreview = () => {
    setPreviewProduct(null)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setViewMode('edit')
  }

  const handleViewDeal = (deal) => {
    setSelectedDeal(deal)
    setViewMode('view')
  }

  const handleEditDeal = (deal) => {
    setSelectedDeal(deal)
    setViewMode('edit')
  }

  const handleBackToList = () => {
    setSelectedProduct(null)
    setSelectedDeal(null)
    setViewMode('list')
    if (activeTab === 'products') {
      fetchProducts()
    } else {
      fetchDeals()
    }
  }

  useEffect(() => {
    if (viewMode === 'list') {
      if (activeTab === 'products') {
        fetchProducts()
      } else {
        fetchDeals()
      }
    }
  }, [activeTab, viewMode])

  // Improved useEffect for Backend Updates
  useEffect(() => {
    const checkAndUpdateExpiredDeals = async () => {
      if (deals.length > 0) {
        const now = new Date();
        const hasExpiredPublishedDeals = deals.some(deal => {
          if (deal.status === 'published' && deal.dealEndDate) {
            const endDate = new Date(deal.dealEndDate);
            return endDate < now;
          }
          return false;
        });

        if (hasExpiredPublishedDeals) {
          console.log('Found expired published deals, updating backend...');
          await updateExpiredDealsOnBackend();
        }
      }
    };

    checkAndUpdateExpiredDeals();
  }, [deals, token]);

  if (viewMode !== 'list') {
    if (activeTab === 'products' && selectedProduct) {
      return (
        <ProductDetails
          product={selectedProduct}
          mode={viewMode}
          token={token}
          onBack={handleBackToList}
          onSave={handleBackToList}
          categories={categories} 
        />
      )
    } else if (activeTab === 'deals' && selectedDeal) {
      return (
        <DealDetails
          deal={selectedDeal}
          mode={viewMode}
          token={token}
          onBack={handleBackToList}
          onSave={handleBackToList}
        />
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-6 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-48 sm:w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="h-32 sm:h-40 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-6 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Management Dashboard</h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">Manage your products and deals efficiently</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-gray-500">
                {activeTab === 'products' ? `${products.length} products` : `${deals.length} deals`}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 sm:mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-3 sm:space-x-6 lg:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 min-w-max ${
                    activeTab === 'products'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <FaBox className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Products</span>
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium">
                      {products.length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('deals')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 min-w-max ${
                    activeTab === 'deals'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <FaTags className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Deals</span>
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium">
                      {deals.length}
                    </span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'products' && (
          <ProductListView
            products={products}
            onView={handleViewProduct}
            onEdit={handleEditProduct}
            onDelete={removeProduct}
            onStatusChange={updateProductStatus}
            onStockUpdate={updateProductStock}
            token={token}
            categories={categories} // Pass categories to ProductListView
          />
        )}

        {activeTab === 'deals' && (
          <DealListView
            deals={deals}
            onView={handleViewDeal}
            onEdit={handleEditDeal}
            onDelete={removeDeal}
            onStatusChange={updateDealStatus}
          />
        )}

        {/* Product Preview Modal */}
        {previewProduct && (
          <ProductDetailsPreview
            product={previewProduct}
            onClose={handleClosePreview}
            onEdit={(product) => {
              handleClosePreview();
              setSelectedProduct(product);
              setViewMode('edit');
            }}
            categories={categories} // Pass categories to preview modal
          />
        )}
      </div>
    </div>
  )
}

// Product List View Component - UPDATED with proper category name mapping
const ProductListView = ({ products, onView, onEdit, onDelete, onStatusChange, onStockUpdate, token, categories }) => {
  
  // Function to get category name by ID
  const getCategoryName = (categoryIdOrName) => {
    if (!categoryIdOrName) return 'Uncategorized';
    
    // Check if it's already a name (not an ID)
    if (typeof categoryIdOrName === 'string' && !categoryIdOrName.match(/^[0-9a-fA-F]{24}$/)) {
      return categoryIdOrName;
    }
    
    // Find in categories array
    if (categories && Array.isArray(categories)) {
      const category = categories.find(cat => cat._id === categoryIdOrName);
      if (category) return category.name;
    }
    
    // If not found and looks like an ObjectId
    if (typeof categoryIdOrName === 'string' && categoryIdOrName.match(/^[0-9a-fA-F]{24}$/)) {
      return 'Deleted Category';
    }
    
    return categoryIdOrName;
  };

  // Function to get subcategory name by ID
  const getSubcategoryName = (categoryId, subcategoryId) => {
    if (!subcategoryId) return 'Uncategorized';
    
    // Check if it's already a name
    if (typeof subcategoryId === 'string' && !subcategoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return subcategoryId;
    }
    
    // Find in categories array
    if (categories && Array.isArray(categories)) {
      const category = categories.find(cat => cat._id === categoryId);
      if (category && category.subcategories && Array.isArray(category.subcategories)) {
        const subcategory = category.subcategories.find(sub => sub._id === subcategoryId);
        if (subcategory) return subcategory.name;
      }
    }
    
    // If not found and looks like an ObjectId
    if (typeof subcategoryId === 'string' && subcategoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return 'Deleted Subcategory';
    }
    
    return subcategoryId;
  };

  // Function to safely check array length
  const getArrayLength = (array) => {
    if (!array || !Array.isArray(array)) return 0;
    return array.length;
  };

  return (
    <div>
      {/* Mobile Grid View */}
      <div className="lg:hidden">
        {products.length === 0 ? (
          <EmptyState type="products" />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {products.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-3">
                  {/* Image and Basic Info */}
                  <div className="flex items-start space-x-3">
                    <img 
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" 
                      src={item.image?.[0] || '/placeholder-image.jpg'} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="flex-1 flex-wrap min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{item.name}</h3>
                      <p className="text-gray-500 text-xs mb-2 line-clamp-2 break-words max-w-full">
                        {item.description || 'No description available'}
                      </p>
                      
                      {/* Quick Info Row */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-green-600">{currency}{item.discountprice || item.price}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                          {getCategoryName(item.category)}
                        </span>
                        <StockIndicator quantity={item.quantity} />
                      </div>
                      
                      {/* Indicators for New Fields */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getArrayLength(item.ingredients) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            <FaFlask className="w-3 h-3 mr-1" />
                            {getArrayLength(item.ingredients)} ingredients
                          </span>
                        )}
                        {getArrayLength(item.benefits) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                            <FaCheckCircle className="w-3 h-3 mr-1" />
                            {getArrayLength(item.benefits)} benefits
                          </span>
                        )}
                        {item.howToUse && item.howToUse.trim() !== "" && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                            <FaInfoCircle className="w-3 h-3 mr-1" />
                            Usage guide
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <StatusDropdown 
                        currentStatus={item.status || 'draft'} 
                        onStatusChange={(status) => onStatusChange(item._id, status)}
                      />
                      {item.totalSales > 0 && (
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          {item.totalSales} sold
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons - Bottom aligned */}
                    <div className="flex space-x-2">
                      <MobileActionButton
                        onClick={() => onView(item)}
                        variant="primary"
                        icon="view"
                        label="View"
                      />
                      <MobileActionButton
                        onClick={() => onEdit(item)}
                        variant="secondary"
                        icon="edit"
                        label="Edit"
                      />
                      <MobileActionButton
                        onClick={() => onDelete(item._id)}
                        variant="danger"
                        icon="delete"
                        label="Delete"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tablet Grid View */}
      <div className="hidden lg:block xl:hidden">
        {products.length === 0 ? (
          <EmptyState type="products" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    <img 
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" 
                      src={item.image?.[0] || '/placeholder-image.jpg'} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{item.name}</h3>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2 break-words max-w-full">
                        {item.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-medium text-green-600">{currency}{item.discountprice || item.price}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                          {getCategoryName(item.category)}
                        </span>
                        <StockIndicator quantity={item.quantity} />
                      </div>
                      
                      {/* Subcategory */}
                      <div className="text-xs text-gray-600 mb-2">
                        Sub: {getSubcategoryName(item.category, item.subcategory)}
                      </div>
                      
                      {/* Indicators for New Fields */}
                      <div className="mb-3 flex flex-wrap gap-1">
                        {getArrayLength(item.ingredients) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                            <FaFlask className="w-3 h-3 mr-1" />
                            {getArrayLength(item.ingredients)} ingredients
                          </span>
                        )}
                        {getArrayLength(item.benefits) > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                            <FaCheckCircle className="w-3 h-3 mr-1" />
                            {getArrayLength(item.benefits)} benefits
                          </span>
                        )}
                        {item.howToUse && item.howToUse.trim() !== "" && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                            <FaInfoCircle className="w-3 h-3 mr-1" />
                            Usage guide
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <StatusDropdown 
                          currentStatus={item.status || 'draft'} 
                          onStatusChange={(status) => onStatusChange(item._id, status)}
                        />
                        <div className="flex space-x-1">
                          <ActionButton
                            onClick={() => onView(item)}
                            variant="primary"
                            icon="view"
                            size="xs"
                          />
                          <ActionButton
                            onClick={() => onEdit(item)}
                            variant="secondary"
                            icon="edit"
                            size="xs"
                          />
                          <ActionButton
                            onClick={() => onDelete(item._id)}
                            variant="danger"
                            icon="delete"
                            size="xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>

                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState type="products" />
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200" 
                          src={item.image?.[0] || '/placeholder-image.jpg'} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                          <p className="text-gray-500 text-xs line-clamp-2 break-words mt-0.5">
                            {item.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full capitalize mb-1">
                          {getCategoryName(item.category)}
                        </span>
                        <div className="text-xs text-gray-600">
                          {getSubcategoryName(item.category, item.subcategory)}
                        </div>
                      </div>
                    </td>
               
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-600 text-sm">{currency}{item.discountprice || item.price}</span>
                        {item.price > item.discountprice && (
                          <span className="text-gray-400 line-through text-xs">{currency}{item.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StockIndicator quantity={item.quantity} />
                    </td>
                    <td className="py-3 px-4">
                      {item.totalSales > 0 ? (
                        <div className="flex items-center space-x-1">
                          <FaShoppingBag className="w-3 h-3 text-purple-500" />
                          <span className="text-sm text-gray-600">{item.totalSales}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusDropdown 
                        currentStatus={item.status || 'draft'} 
                        onStatusChange={(status) => onStatusChange(item._id, status)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <ActionButton
                          onClick={() => onView(item)}
                          variant="primary"
                          icon="view"
                          size="xs"
                        />
                        <ActionButton
                          onClick={() => onEdit(item)}
                          variant="secondary"
                          icon="edit"
                          size="xs"
                        />
                        <ActionButton
                          onClick={() => onDelete(item._id)}
                          variant="danger"
                          icon="delete"
                          size="xs"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DealListView = ({ deals, onView, onEdit, onDelete, onStatusChange }) => {
  const [dealTypesMap, setDealTypesMap] = useState({});
  
  useEffect(() => {
    const fetchDealTypes = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/deal-types');
        if (response.data.success) {
          const typesMap = {};
          response.data.dealTypes.forEach(type => {
            typesMap[type._id] = type.name;
          });
          setDealTypesMap(typesMap);
        }
      } catch (error) {
        console.error('Error fetching deal types:', error);
      }
    };
    
    fetchDealTypes();
  }, []);

  const getDealPrice = (deal) => {
    if (deal.dealFinalPrice) {
      return deal.dealFinalPrice;
    }
    
    const total = deal.dealTotal || 0;
    const discountValue = deal.dealDiscountValue || 0;
    
    if (deal.dealDiscountType === 'percentage') {
      return total - (total * discountValue / 100);
    } else {
      return total - discountValue;
    }
  };

  const getDateStatus = (deal) => {
    const now = new Date();
    const startDate = new Date(deal.dealStartDate);
    const endDate = deal.dealEndDate ? new Date(deal.dealEndDate) : null;
    
    if (endDate && endDate < now) {
      return { status: 'expired', label: 'Expired', icon: FaHourglassEnd, color: 'text-red-600' };
    }
    if (startDate > now) {
      return { status: 'upcoming', label: 'Starts Soon', icon: FaClock, color: 'text-blue-600' };
    }
    if (endDate && endDate > now) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return { status: 'active', label: `${daysLeft} days left`, icon: FaClock, color: 'text-green-600' };
    }
    return { status: 'active', label: 'Active', icon: FaCheckCircle, color: 'text-green-600' };
  };

  const getDealTypeName = (deal) => {
    if (!deal.dealType) return 'Standard';
    
    if (typeof deal.dealType === 'object' && deal.dealType.name) {
      return deal.dealType.name;
    }
    
    if (typeof deal.dealType === 'string') {
      return dealTypesMap[deal.dealType] || 'Standard';
    }
    
    return 'Standard';
  };

  return (
    <div>
      {deals.length === 0 ? (
        <EmptyState type="deals" />
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {deals.map((item) => {
                const dealPrice = getDealPrice(item);
                const dealTypeName = getDealTypeName(item);
                const dateInfo = getDateStatus(item);
                const DateStatusIcon = dateInfo.icon;
                
                return (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-3">
                      <div className="flex items-start space-x-3">
                        <img 
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" 
                          src={item.dealImages?.[0] || '/placeholder-image.jpg'} 
                          alt={item.dealName || 'Deal Image'} 
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {item.dealName || 'Unnamed Deal'}
                          </h3>
                          <p className="text-gray-500 text-xs mb-2 line-clamp-2 break-words">
                            {item.dealDescription || 'No description'}
                          </p>
                          
                          {/* Quick Info */}
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span className="font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                                {dealTypeName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Price:</span>
                              <span className="font-semibold text-green-600">
                                {currency}{dealPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Products:</span>
                              <span className="font-medium">
                                {item.dealProducts?.length || 0} items
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <div className="flex items-center space-x-1">
                                <DateStatusIcon className={`w-3 h-3 ${dateInfo.color}`} />
                                <span className={`text-xs font-medium ${dateInfo.color}`}>
                                  {dateInfo.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <DealStatusDropdown 
                            currentStatus={item.status || 'draft'} 
                            onStatusChange={(status) => onStatusChange(item._id, status)}
                            deal={item}
                          />
                          <div className="text-xs text-gray-600">
                            {item.dealStartDate ? new Date(item.dealStartDate).toLocaleDateString() : 'No start'}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <MobileActionButton
                            onClick={() => onView(item)}
                            variant="primary"
                            icon="view"
                            label="View"
                          />
                          <MobileActionButton
                            onClick={() => onEdit(item)}
                            variant="secondary"
                            icon="edit"
                            label="Edit"
                          />
                          <MobileActionButton
                            onClick={() => onDelete(item._id)}
                            variant="danger"
                            icon="delete"
                            label="Delete"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tablet Grid View */}
          <div className="hidden lg:block xl:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deals.map((item) => {
                const dealPrice = getDealPrice(item);
                const dealTypeName = getDealTypeName(item);
                const dateInfo = getDateStatus(item);
                const DateStatusIcon = dateInfo.icon;
                
                return (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        <img 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" 
                          src={item.dealImages?.[0] || '/placeholder-image.jpg'} 
                          alt={item.dealName || 'Deal Image'}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {item.dealName || 'Unnamed Deal'}
                          </h3>
                          <p className="text-gray-500 text-xs mb-3 line-clamp-2 break-words">
                            {item.dealDescription || 'No description'}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full capitalize ml-1">
                                {dealTypeName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="font-semibold text-green-600 ml-1">
                                {currency}{dealPrice.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Products:</span>
                              <span className="font-medium ml-1">
                                {item.dealProducts?.length || 0}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <DateStatusIcon className={`w-3 h-3 ${dateInfo.color} mr-1`} />
                              <span className={`font-medium ${dateInfo.color}`}>
                                {dateInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <DealStatusDropdown 
                              currentStatus={item.status || 'draft'} 
                              onStatusChange={(status) => onStatusChange(item._id, status)}
                              deal={item}
                            />
                            <div className="flex space-x-1">
                              <ActionButton
                                onClick={() => onView(item)}
                                variant="primary"
                                icon="view"
                                size="xs"
                              />
                              <ActionButton
                                onClick={() => onEdit(item)}
                                variant="secondary"
                                icon="edit"
                                size="xs"
                              />
                              <ActionButton
                                onClick={() => onDelete(item._id)}
                                variant="danger"
                                icon="delete"
                                size="xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deal</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Discount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Products</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deals.map((item) => {
                    const dealPrice = getDealPrice(item);
                    const dealTypeName = getDealTypeName(item);
                    const dateInfo = getDateStatus(item);
                    const DateStatusIcon = dateInfo.icon;
                    
                    return (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200" 
                              src={item.dealImages?.[0] || '/placeholder-image.jpg'} 
                              alt={item.dealName || 'Deal Image'}
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="min-w-0 max-w-xs">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {item.dealName || 'Unnamed Deal'}
                              </p>
                              <p className="text-gray-500 text-xs line-clamp-2 break-words">
                                {item.dealDescription || 'No description'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium capitalize">
                            <FaFire className="w-3 h-3 mr-1" />
                            {dealTypeName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-green-600 text-sm">
                              {currency}{dealPrice.toFixed(2)}
                            </span>
                            {(item.dealTotal || 0) > dealPrice && (
                              <span className="text-gray-400 line-through text-xs">
                                {currency}{(item.dealTotal || 0)?.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            {item.dealDiscountType === 'percentage' ? (
                              <FaPercentage className="w-3 h-3 text-green-500" />
                            ) : (
                              <FaDollarSign className="w-3 h-3 text-green-500" />
                            )}
                            <span className="font-semibold text-green-600 text-sm">
                              {item.dealDiscountType === 'percentage' ? 
                                `${item.dealDiscountValue || 0}%` : 
                                `${currency}${item.dealDiscountValue || 0}`
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <FaCube className="w-3 h-3 mr-1" />
                            {item.dealProducts?.length || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col space-y-1">
                            <DealStatusDropdown 
                              currentStatus={item.status || 'draft'} 
                              onStatusChange={(status) => onStatusChange(item._id, status)}
                              deal={item}
                            />
                            <div className="flex items-center space-x-1 text-xs">
                              <DateStatusIcon className={`w-3 h-3 ${dateInfo.color}`} />
                              <span className={dateInfo.color}>
                                {dateInfo.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <ActionButton
                              onClick={() => onView(item)}
                              variant="primary"
                              icon="view"
                              size="xs"
                            />
                            <ActionButton
                              onClick={() => onEdit(item)}
                              variant="secondary"
                              icon="edit"
                              size="xs"
                            />
                            <ActionButton
                              onClick={() => onDelete(item._id)}
                              variant="danger"
                              icon="delete"
                              size="xs"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Deal Status Dropdown Component
const DealStatusDropdown = ({ currentStatus, onStatusChange, deal }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'published', label: 'Published', color: 'text-green-600' },
  ]

  const isExpired = () => {
    if (!deal || !deal.dealEndDate) return false;
    const endDate = new Date(deal.dealEndDate);
    const now = new Date();
    return endDate < now;
  };

  const expired = isExpired();

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsUpdating(true);
    
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Status change failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={expired || isUpdating}
        className={`text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors duration-200 ${
          expired || isUpdating ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value} className={option.color}>
            {option.label}
          </option>
        ))}
      </select>
      {isUpdating && (
        <span className="text-xs text-blue-600">Updating...</span>
      )}
     
    </div>
  )
}

// Stock Indicator Component
const StockIndicator = ({ quantity }) => {
  const getStockConfig = (qty) => {
    if (qty === 0) return { color: 'bg-red-100 text-red-700', label: 'Out' };
    if (qty <= 5) return { color: 'bg-red-100 text-red-700', label: 'Low' };
    if (qty <= 10) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' };
    if (qty <= 20) return { color: 'bg-blue-100 text-blue-700', label: 'Good' };
    return { color: 'bg-green-100 text-green-700', label: 'In Stock' };
  };

  const config = getStockConfig(quantity);

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
      {quantity} {config.label}
    </span>
  );
};

// Status Dropdown Component
const StatusDropdown = ({ currentStatus, onStatusChange }) => {
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'published', label: 'Published', color: 'text-green-600' },
  ]

  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors duration-200"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value} className={option.color}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Mobile Action Button Component
const MobileActionButton = ({ onClick, variant, icon, label }) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 flex-1"
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-black text-xs",
    secondary: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 text-xs",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 text-xs",
  }

  const icons = {
    view: <FaEye className="w-3 h-3 mr-1" />,
    edit: <FaEdit className="w-3 h-3 mr-1" />,
    delete: <FaTrash className="w-3 h-3 mr-1" />
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} px-2 py-1.5`}
    >
      {icons[icon]}
      {label}
    </button>
  )
}

// Action Button Component
const ActionButton = ({ onClick, variant, icon, label, size = 'md', fullWidth = false }) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1"
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 focus:ring-black",
    secondary: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500"
  }

  const sizes = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  }

  const widthClass = fullWidth ? "w-full" : ""

  const icons = {
    view: <FaEye className="w-3 h-3" />,
    edit: <FaEdit className="w-3 h-3" />,
    delete: <FaTrash className="w-3 h-3" />
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass}`}
      title={label}
    >
      {icons[icon]}
      {size !== 'xs' && <span className="ml-1">{label}</span>}
    </button>
  )
}

// Empty State Component
const EmptyState = ({ type }) => (
  <div className="py-8 sm:py-12 text-center">
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
        {type === 'products' ? (
          <FaShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
        ) : (
          <FaTags className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No {type} found</h3>
      <p className="text-gray-500 mb-4 text-sm">Get started by creating your first {type.slice(0, -1)}</p>
      <button className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 text-sm">
        Create {type.slice(0, -1)}
      </button>
    </div>
  </div>
)

// Product Details Preview Modal Component - UPDATED with category names
const ProductDetailsPreview = ({ product, onClose, onEdit, categories }) => {
  if (!product) return null;

  // Helper function to get category/subcategory names
  const getCategoryName = (categoryIdOrName) => {
    if (!categoryIdOrName) return 'Uncategorized';
    
    if (typeof categoryIdOrName === 'string' && !categoryIdOrName.match(/^[0-9a-fA-F]{24}$/)) {
      return categoryIdOrName;
    }
    
    if (categories && Array.isArray(categories)) {
      const category = categories.find(cat => cat._id === categoryIdOrName);
      if (category) return category.name;
    }
    
    return typeof categoryIdOrName === 'string' && categoryIdOrName.match(/^[0-9a-fA-F]{24}$/) 
      ? 'Deleted Category' 
      : categoryIdOrName;
  };

  const getSubcategoryName = (categoryId, subcategoryId) => {
    if (!subcategoryId) return 'Uncategorized';
    
    if (typeof subcategoryId === 'string' && !subcategoryId.match(/^[0-9a-fA-F]{24}$/)) {
      return subcategoryId;
    }
    
    if (categories && Array.isArray(categories)) {
      const category = categories.find(cat => cat._id === categoryId);
      if (category && category.subcategories && Array.isArray(category.subcategories)) {
        const subcategory = category.subcategories.find(sub => sub._id === subcategoryId);
        if (subcategory) return subcategory.name;
      }
    }
    
    return typeof subcategoryId === 'string' && subcategoryId.match(/^[0-9a-fA-F]{24}$/) 
      ? 'Deleted Subcategory' 
      : subcategoryId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
          {/* Images */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Product Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {product.image && product.image.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.name} - Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ))}
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Product Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 whitespace-pre-line">{product.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{getCategoryName(product.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subcategory</label>
                  <p className="text-gray-900">{getSubcategoryName(product.category, product.subcategory)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Pricing & Inventory</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Price</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">{currency}{product.discountprice || product.price}</span>
                    {product.discountprice && product.discountprice < product.price && (
                      <span className="text-gray-400 line-through">{currency}{product.price}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cost</label>
                  <p className="text-gray-900">{currency}{product.cost || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="text-gray-900">{product.quantity} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Sales</label>
                  <p className="text-gray-900">{product.totalSales || 0} sold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients Section */}
          {product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                <FaFlask className="w-5 h-5 mr-2 text-blue-600" />
                Ingredients
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          {product.benefits && Array.isArray(product.benefits) && product.benefits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                <FaCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Benefits
              </h3>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* How to Use Section */}
          {product.howToUse && product.howToUse.trim() !== "" && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                <FaInfoCircle className="w-5 h-5 mr-2 text-purple-600" />
                How to Use
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="text-gray-700 whitespace-pre-line">{product.howToUse}</div>
              </div>
            </div>
          )}

          {/* Status & Flags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500 mb-1">Status</label>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                product.status === 'published' ? 'bg-green-100 text-green-800' :
                product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {product.status || 'draft'}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500 mb-1">Bestseller</label>
              <div className="flex items-center">
                {product.bestseller ? (
                  <FaCheckCircle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-sm font-medium text-gray-500 mb-1">Views</label>
              <p className="text-gray-900">{product.views || 0}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            <FaEdit className="w-4 h-4 mr-2" />
            Edit Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default List