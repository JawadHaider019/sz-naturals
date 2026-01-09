import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from '../components/Title';
import ProductItem from "../components/ProductItem";
import { 
  FaFilter, 
  FaTimes, 
  FaSortAmountDown, 
  FaTag, 
  FaStar, 
  FaFire, 
  FaChevronRight,
  FaSearch
} from "react-icons/fa";

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [sortType, setSortType] = useState('default');
  const [backendCategories, setBackendCategories] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [subcategoryIdMap, setSubcategoryIdMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${backendURL}/api/categories`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        let categories = data;
        
        if (data.data && Array.isArray(data.data)) {
          categories = data.data;
        }
        
        if (data.categories && Array.isArray(data.categories)) {
          categories = data.categories;
        }
        
        if (!Array.isArray(categories)) {
          throw new Error('Categories data is not an array');
        }

        // Create mapping from IDs to names
        const idToNameMap = {};
        const subcategoryIdToNameMap = {};

        const transformedCategories = categories.map((cat) => {
          const categoryId = cat._id || cat.id;
          const categoryName = cat.name || cat.categoryName || cat.title || 'Category';
          
          if (categoryId) {
            idToNameMap[categoryId] = categoryName;
          }

          const subcategories = (cat.subcategories || cat.subCategories || []).map((sub) => {
            const subcategoryId = sub._id || sub.id;
            const subcategoryName = sub.name || sub.subcategoryName || sub.title || sub || 'Subcategory';
            
            if (subcategoryId) {
              subcategoryIdToNameMap[subcategoryId] = subcategoryName;
            }
            
            return {
              id: subcategoryId,
              name: subcategoryName
            };
          });

          return {
            id: categoryId,
            name: categoryName,
            subcategories
          };
        });

        setBackendCategories(transformedCategories);
        setCategoryIdMap(idToNameMap);
        setSubcategoryIdMap(subcategoryIdToNameMap);
        setError(null);
        
      } catch (error) {
        setError(error.message);
        // Fallback: extract categories from products
        const categoryMap = {};
        products.forEach(product => {
          if (product && product.category) {
            const categoryName = product.category;
            const subcategoryName = product.subcategory;
            
            if (!categoryMap[categoryName]) {
              categoryMap[categoryName] = {
                name: categoryName,
                subcategories: new Set()
              };
            }
            
            if (subcategoryName) {
              categoryMap[categoryName].subcategories.add(subcategoryName);
            }
          }
        });

        const fallbackCategories = Object.values(categoryMap).map(cat => ({
          name: cat.name,
          subcategories: Array.from(cat.subcategories).map(sub => ({
            name: sub
          }))
        }));
        
        setBackendCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    if (backendURL) {
      fetchCategories();
    } else {
      setError('Backend URL configuration missing');
      setLoading(false);
    }
  }, [backendURL]);

  // Helper functions
  const getCategoryName = useCallback((categoryId) => {
    return categoryIdMap[categoryId] || categoryId;
  }, [categoryIdMap]);

  const getSubcategoryName = useCallback((subcategoryId) => {
    return subcategoryIdMap[subcategoryId] || subcategoryId;
  }, [subcategoryIdMap]);

  const getCategoryId = useCallback((categoryName) => {
    return Object.keys(categoryIdMap).find(id => categoryIdMap[id] === categoryName) || categoryName;
  }, [categoryIdMap]);

  const getSubcategoryId = useCallback((subcategoryName) => {
    return Object.keys(subcategoryIdMap).find(id => subcategoryIdMap[id] === subcategoryName) || subcategoryName;
  }, [subcategoryIdMap]);

  // Toggle functions
  const toggleCategory = useCallback((categoryName) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]
    );
    setSelectedSubCategories([]);
  }, []);

  const toggleSubCategory = useCallback((subcategoryName) => {
    setSelectedSubCategories(prev => 
      prev.includes(subcategoryName) ? prev.filter(s => s !== subcategoryName) : [...prev, subcategoryName]
    );
  }, []);

  // Reset all filters function
  const resetAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSortType('default');
  }, []);

  // Get available subcategories based on selected categories
  const getAvailableSubcategories = useCallback(() => {
    if (selectedCategories.length === 0) {
      const allSubcategories = new Set();
      backendCategories.forEach(cat => {
        if (cat.subcategories) {
          cat.subcategories.forEach(sub => {
            allSubcategories.add(sub.name);
          });
        }
      });
      return Array.from(allSubcategories);
    } else {
      const availableSubcategories = new Set();
      backendCategories.forEach(cat => {
        if (selectedCategories.includes(cat.name) && cat.subcategories) {
          cat.subcategories.forEach(sub => {
            availableSubcategories.add(sub.name);
          });
        }
      });
      return Array.from(availableSubcategories);
    }
  }, [selectedCategories, backendCategories]);

  // Apply filters and sorting
  useEffect(() => {
    let productsCopy = [...products];

    // Search filter
    if (showSearch && search) {
      productsCopy = productsCopy.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      productsCopy = productsCopy.filter(item => {
        const itemCategoryId = item.category;
        const itemCategoryName = getCategoryName(itemCategoryId);
        
        return selectedCategories.some(selectedCat => {
          const selectedCategoryId = getCategoryId(selectedCat);
          return itemCategoryId === selectedCategoryId || itemCategoryName === selectedCat;
        });
      });
    }

    // Sub-category filter
    if (selectedSubCategories.length > 0) {
      productsCopy = productsCopy.filter(item => {
        const itemSubcategoryId = item.subcategory;
        const itemSubcategoryName = getSubcategoryName(itemSubcategoryId);
        
        return selectedSubCategories.some(selectedSub => {
          const selectedSubcategoryId = getSubcategoryId(selectedSub);
          return itemSubcategoryId === selectedSubcategoryId || itemSubcategoryName === selectedSub;
        });
      });
    }

    // Apply sorting
    switch (sortType) {
      case 'low-high':
        productsCopy.sort((a, b) => (a.discountprice || a.price) - (b.discountprice || b.price));
        break;
      case 'high-low':
        productsCopy.sort((a, b) => (b.discountprice || b.price) - (a.discountprice || a.price));
        break;
      case 'bestseller':
        productsCopy.sort((a, b) => {
          const aBest = a.bestseller ? 1 : 0;
          const bBest = b.bestseller ? 1 : 0;
          return bBest - aBest;
        });
        break;
      case 'rating':
        productsCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        productsCopy.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        break;
    }

    setFilterProducts(productsCopy);
  }, [
    products, 
    search, 
    showSearch, 
    selectedCategories, 
    selectedSubCategories, 
    sortType,
    getCategoryName,
    getCategoryId,
    getSubcategoryName,
    getSubcategoryId
  ]);

  // Get product counts for categories
  const getCategoryProductCount = useCallback((categoryName) => {
    const categoryId = getCategoryId(categoryName);
    return products.filter(product => {
      const productCategoryId = product.category;
      const productCategoryName = getCategoryName(productCategoryId);
      return productCategoryId === categoryId || productCategoryName === categoryName;
    }).length;
  }, [products, getCategoryId, getCategoryName]);

  // Get product counts for subcategories
  const getSubcategoryProductCount = useCallback((subcategoryName) => {
    const subcategoryId = getSubcategoryId(subcategoryName);
    return products.filter(product => {
      const parentCategorySelected = selectedCategories.length === 0 || 
        selectedCategories.some(cat => {
          const categoryId = getCategoryId(cat);
          const productCategoryId = product.category;
          const productCategoryName = getCategoryName(productCategoryId);
          return productCategoryId === categoryId || productCategoryName === cat;
        });
      
      const productSubcategoryId = product.subcategory;
      const productSubcategoryName = getSubcategoryName(productSubcategoryId);
      
      return parentCategorySelected && 
        (productSubcategoryId === subcategoryId || productSubcategoryName === subcategoryName);
    }).length;
  }, [products, selectedCategories, getSubcategoryId, getCategoryId, getCategoryName, getSubcategoryName]);

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.length > 0 || selectedSubCategories.length > 0 || sortType !== 'default';

  // Available subcategories
  const availableSubcategories = getAvailableSubcategories();

  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Relevance', icon: <FaSearch className="w-3 h-3" /> },
    { value: 'bestseller', label: 'Bestseller', icon: <FaFire className="w-3 h-3" /> },
    { value: 'rating', label: 'Highest Rated', icon: <FaStar className="w-3 h-3" /> },
    { value: 'low-high', label: 'Price: Low to High', icon: <FaSortAmountDown className="w-3 h-3" /> },
    { value: 'high-low', label: 'Price: High to Low', icon: <FaSortAmountDown className="w-3 h-3 rotate-180" /> }
  ];

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
        <div className="text-red-500 text-lg font-medium">Error loading categories</div>
        <div className="text-gray-500 text-center text-sm max-w-md">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-black text-white hover:bg-gray-900 transition-colors rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="pt-8 sm:pt-12 mx-auto max-w-7xl pb-16">
      {/* Header Section */}
      <div className="mb-8 px-4 sm:px-0">
        <div className="mb-6">
          <Title text1={'Our'} text2={'Collections'} />
        </div>
        
        {/* Search Info */}
        {showSearch && search && (
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <FaSearch className="w-4 h-4" />
            <span>Search results for: <span className="font-semibold text-black">"{search}"</span></span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden px-4">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg w-full justify-center"
          >
            <FaFilter className="w-4 h-4" />
            {showFilter ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-black text-xs px-2 py-0.5 rounded-full">
                {selectedCategories.length + selectedSubCategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Sidebar */}
        <div className={`lg:w-64 xl:w-72 px-4 lg:px-0 ${showFilter ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 sticky top-24">
            {/* Filters Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaFilter className="w-4 h-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-sm text-black hover:text-gray-600 underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <span 
                      key={cat} 
                      className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
                    >
                      {cat}
                      <button 
                        onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedSubCategories.map(sub => (
                    <span 
                      key={sub} 
                      className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
                    >
                      {sub}
                      <button 
                        onClick={() => setSelectedSubCategories(prev => prev.filter(s => s !== sub))}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Section */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FaTag className="w-3 h-3" />
                Categories
              </h4>
              <div className="space-y-2">
                {backendCategories.length > 0 ? (
                  backendCategories.map(cat => {
                    const productCount = getCategoryProductCount(cat.name);
                    const isSelected = selectedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.name}
                        onClick={() => toggleCategory(cat.name)}
                        className={`flex items-center justify-between w-full p-2 rounded-lg transition-all duration-200 ${
                          isSelected 
                            ? 'bg-black text-white' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 flex items-center justify-center rounded border ${
                            isSelected ? 'border-white' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-white text-black' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {productCount}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-gray-500 text-sm p-2">No categories available</div>
                )}
              </div>
            </div>

            {/* Subcategories Section */}
            {availableSubcategories.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Subcategories</h4>
                <div className="space-y-2">
                  {availableSubcategories.map(sub => {
                    const productCount = getSubcategoryProductCount(sub);
                    const isSelected = selectedSubCategories.includes(sub);
                    const isDisabled = productCount === 0;
                    
                    return (
                      <button
                        key={sub}
                        onClick={() => !isDisabled && toggleSubCategory(sub)}
                        disabled={isDisabled}
                        className={`flex items-center justify-between w-full p-2 rounded-lg transition-all duration-200 ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-black text-white' 
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 flex items-center justify-center rounded border ${
                            isSelected ? 'border-white' : isDisabled ? 'border-gray-200' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <span className="text-sm">{sub}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-white text-black' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {productCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-black">{filterProducts.length}</span> of{" "}
                <span className="font-semibold text-black">{products.length}</span> products
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 px-4 lg:px-0">
          {/* Sort and Filter Bar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2 flex-wrap">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortType(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                      sortType === option.value
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Results Count (Desktop) */}
              <div className="hidden sm:block text-sm text-gray-600">
                {filterProducts.length} products found
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filterProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 md:gap-6">
              {filterProducts.map((item) => (
                <ProductItem
                  key={item._id}
                  id={item._id}
                  image={item.image && item.image.length > 0 ? item.image[0] : assets.fallback_image}
                  name={item.name}
                  price={item.price}
                  discount={item.discountprice}
                  rating={item.rating || 0}
                  bestseller={item.bestseller}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4 text-6xl">😔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters 
                    ? 'No products match your current filters.'
                    : 'No products available at the moment.'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="px-6 py-3 bg-black text-white hover:bg-gray-900 transition-colors rounded-lg"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;