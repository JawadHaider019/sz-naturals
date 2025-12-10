import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import { useAuth } from "../context/AuthContext"; 

// Font Awesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faTags, 
  faSpinner, 
  faExclamationTriangle, 
  faPlusCircle, 
  faCloudUploadAlt, 
  faStar, 
  faChartLine, 
  faBoxes, 
  faTrashAlt, 
  faPercent, 
  faReceipt,
  faShoppingBag,
  faCalendarAlt,
  faDollarSign,
  faFlask,
  faInfoCircle,
  faCheckCircle,
  faListUl
} from '@fortawesome/free-solid-svg-icons';

const Add = () => { 
  const { token, logout } = useAuth(); 
  
  // --- Category & Subcategory State ---
  const [categories, setCategories] = useState([]);
  const [dealTypes, setDealTypes] = useState([]);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // --- Product Info State ---
  const [images, setImages] = useState([null, null, null, null]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [discountprice, setDiscountprice] = useState("");
  const [cost, setCost] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- New Optional Fields ---
  const [ingredients, setIngredients] = useState(""); // Comma-separated string
  const [howToUse, setHowToUse] = useState("");
  const [benefits, setBenefits] = useState(""); // Comma-separated string

  // --- Deal State ---
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'deals'
  const [dealProducts, setDealProducts] = useState([]);
  const [dealType, setDealType] = useState("");
  const [dealDiscountType, setDealDiscountType] = useState("percentage");
  const [dealDiscountValue, setDealDiscountValue] = useState(0);
  const [dealName, setDealName] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [dealImages, setDealImages] = useState([null, null, null, null]);
  const [dealStartDate, setDealStartDate] = useState("");
  const [dealEndDate, setDealEndDate] = useState("");

  // Fetch categories and deal types from backend
  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from:', backendUrl + '/api/categories');
      const response = await axios.get(backendUrl + '/api/categories');
      console.log('Categories API response:', response.data);
      if (response.data) {
        setCategories(response.data);
        console.log('Categories set:', response.data.length);
        
        // Set default category and subcategory
        if (response.data.length > 0) {
          const firstCategory = response.data[0];
          setCategory(firstCategory._id);
          if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
            setSubCategory(firstCategory.subcategories[0]._id);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchDealTypes = async () => {
    try {
      console.log('Fetching deal types from:', backendUrl + '/api/deal-types');
      const response = await axios.get(backendUrl + '/api/deal-types');
      console.log('Deal types API response:', response.data);
      if (response.data) {
        setDealTypes(response.data);
        console.log('Deal types set:', response.data.length);
        
        // Set default deal type
        if (response.data.length > 0) {
          setDealType(response.data[0]._id);
        }
      }
    } catch (error) {
      console.log('Error fetching deal types:', error);
      toast.error('Failed to load deal types');
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDealTypes();
  }, []);

  // Helper functions to get category and subcategory names
  const getCategoryName = (categoryId) => {
    if (!categoryId) return '';
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : '';
  };

  const getSubcategoryName = (categoryId, subcategoryId) => {
    if (!categoryId || !subcategoryId) return '';
    const category = categories.find(cat => cat._id === categoryId);
    if (!category || !category.subcategories) return '';
    
    const subcategory = category.subcategories.find(sub => sub._id === subcategoryId);
    return subcategory ? subcategory.name : '';
  };

  const getDealTypeName = (dealTypeId) => {
    if (!dealTypeId) return '';
    const dealTypeObj = dealTypes.find(type => type._id === dealTypeId);
    return dealTypeObj ? dealTypeObj.name : '';
  };

  // Memoized calculations
  const calculateDealTotal = useCallback(() => {
    return dealProducts.reduce((total, product) => {
      return total + (Number(product.total) || 0);
    }, 0);
  }, [dealProducts]);

  const calculateFinalPrice = useCallback(() => {
    const total = calculateDealTotal();
    if (dealDiscountType === "percentage") {
      return total - (total * (Number(dealDiscountValue) || 0)) / 100;
    } else {
      return total - (Number(dealDiscountValue) || 0);
    }
  }, [calculateDealTotal, dealDiscountType, dealDiscountValue]);

  // Product calculations
  const calculateProductSavings = useCallback(() => {
    if (!discountprice || !price) return 0;
    return Number(price) - Number(discountprice);
  }, [price, discountprice]);

  const calculateProductDiscountPercentage = useCallback(() => {
    if (!discountprice || !price || price === 0) return 0;
    return ((Number(price) - Number(discountprice)) / Number(price)) * 100;
  }, [price, discountprice]);

  const calculateProductProfit = useCallback(() => {
    if (!cost) return 0;
    const sellingPrice = discountprice && discountprice > 0 ? Number(discountprice) : Number(price);
    return sellingPrice - Number(cost);
  }, [cost, price, discountprice]);

  const calculateProductProfitPercentage = useCallback(() => {
    if (!cost || cost === 0) return 0;
    const profit = calculateProductProfit();
    return (profit / Number(cost)) * 100;
  }, [cost, calculateProductProfit]);

  const dealTotal = useMemo(() => calculateDealTotal(), [calculateDealTotal]);
  const finalPrice = useMemo(() => calculateFinalPrice(), [calculateFinalPrice]);
  const productSavings = useMemo(() => calculateProductSavings(), [calculateProductSavings]);
  const productDiscountPercentage = useMemo(() => calculateProductDiscountPercentage(), [calculateProductDiscountPercentage]);
  const productProfit = useMemo(() => calculateProductProfit(), [calculateProductProfit]);
  const productProfitPercentage = useMemo(() => calculateProductProfitPercentage(), [calculateProductProfitPercentage]);

  // Helper function to convert comma-separated string to array
  const convertStringToArray = (str) => {
    if (!str || str.trim() === '') return [];
    return str.split(',').map(item => item.trim()).filter(item => item !== '');
  };

  // Calculate ingredient and benefit counts for display
  const ingredientCount = useMemo(() => convertStringToArray(ingredients).length, [ingredients]);
  const benefitCount = useMemo(() => convertStringToArray(benefits).length, [benefits]);

  // --- Handlers ---
  const handleImageChange = useCallback((e, index) => {
    const file = e.target.files[0];
    if (file) setImages((prev) => prev.map((img, i) => (i === index ? file : img)));
  }, []);

  const handleDealImageChange = useCallback((e, index) => {
    const file = e.target.files[0];
    if (file) setDealImages((prev) => prev.map((img, i) => (i === index ? file : img)));
  }, []);

  const handleAddDealProduct = useCallback(() => {
    setDealProducts((prev) => [
      ...prev,
      { 
        name: "", 
        cost: 0, 
        price: 0, 
        quantity: 1, 
        total: 0 
      },
    ]);
  }, []);

  const handleRemoveDealProduct = useCallback((index) => {
    setDealProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDealProductChange = useCallback((index, field, value) => {
    setDealProducts((prev) =>
      prev.map((p, i) => {
        if (i === index) {
          const updated = { ...p, [field]: value };
          if (["cost", "price", "quantity"].includes(field)) {
            updated.total = (Number(updated.price) || 0) * (Number(updated.quantity) || 0);
          }
          return updated;
        }
        return p;
      })
    );
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setImages([null, null, null, null]);
    setQuantity("");
    setCost("");
    setPrice("");
    setDiscountprice("");
    setBestseller(false);
    setDealProducts([]);
    setDealDiscountValue(0);
    setDealName("");
    setDealDescription("");
    setDealImages([null, null, null, null]);
    setDealStartDate("");
    setDealEndDate("");
    // Reset new optional fields
    setIngredients("");
    setHowToUse("");
    setBenefits("");
    
    // Reset to first category and subcategory
    if (categories.length > 0) {
      const firstCategory = categories[0];
      setCategory(firstCategory._id);
      if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
        setSubCategory(firstCategory.subcategories[0]._id);
      }
    }
    
    // Reset to first deal type
    if (dealTypes.length > 0) {
      setDealType(dealTypes[0]._id);
    }
  }, [categories, dealTypes]);

  const onSubmitHandler = useCallback(async (e) => {
    e.preventDefault();
    
    // Check if token exists before proceeding
    if (!token) {
      toast.error("Please login to continue");
      logout();
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      if (activeTab === 'products') {
        // === PRODUCT SUBMISSION ===
        // Product basic data
        formData.append("name", name);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("subcategory", subCategory);
        formData.append("quantity", Number(quantity));
        formData.append("bestseller", bestseller);
        formData.append("cost", Number(cost || 0));
        formData.append("price", Number(price));
        formData.append("discountprice", Number(discountprice || 0));
        
        // New optional fields - convert comma-separated strings to arrays
        const ingredientsArray = convertStringToArray(ingredients);
        const benefitsArray = convertStringToArray(benefits);
        
        if (ingredientsArray.length > 0) {
          formData.append("ingredients", JSON.stringify(ingredientsArray));
        }
        
        if (howToUse.trim() !== "") {
          formData.append("howToUse", howToUse);
        }
        
        if (benefitsArray.length > 0) {
          formData.append("benefits", JSON.stringify(benefitsArray));
        }

        // Append product images with correct field names
        images.forEach((img, index) => {
          if (img) {
            formData.append(`image${index + 1}`, img);
          }
        });

        console.log("=== PRODUCT FORM DATA ===");
        for (let [key, value] of formData.entries()) {
          console.log(key, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
        }

        const { data } = await axios.post(`${backendUrl}/api/product/add`, formData, {
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (data.success) {
          toast.success(data.message);
          resetForm();
        } else {
          toast.error(data.message);
        }
      } else {
        // === DEAL SUBMISSION ===
        // Deal basic data
        formData.append("dealName", dealName);
        formData.append("dealDescription", dealDescription);
        formData.append("dealType", dealType);
        formData.append("dealDiscountType", dealDiscountType);
        formData.append("dealDiscountValue", Number(dealDiscountValue));
        formData.append("dealTotal", dealTotal);
        formData.append("dealFinalPrice", finalPrice);
        
        if (dealStartDate) formData.append("dealStartDate", dealStartDate);
        if (dealEndDate) formData.append("dealEndDate", dealEndDate);

        // Deal products data (without images)
        const dealProductsData = dealProducts.map(p => ({
          name: p.name,
          cost: Number(p.cost || 0),
          price: Number(p.price || 0),
          quantity: Number(p.quantity || 1),
          total: Number(p.total || 0)
        }));
        formData.append("dealProducts", JSON.stringify(dealProductsData));

        // Append deal images
        dealImages.forEach((img, index) => {
          if (img) {
            formData.append(`dealImage${index + 1}`, img); 
          }
        });

        console.log("=== DEAL FORM DATA ===");
        for (let [key, value] of formData.entries()) {
          console.log(key, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
        }

        const { data } = await axios.post(`${backendUrl}/api/deal/add`, formData, {
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (data.success) {
          toast.success(data.message);
          resetForm();
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      console.error("Submission Error:", err);
      
      // Handle token expiration specifically
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout(); // This will redirect to login page
        return;
      }
      
      toast.error(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [
    activeTab, name, description, category, subCategory, quantity, bestseller, cost, price, discountprice, images,
    ingredients, howToUse, benefits,
    dealName, dealDescription, dealType, dealDiscountType, dealDiscountValue, dealTotal, finalPrice, dealStartDate,
    dealEndDate, dealProducts, dealImages, token, resetForm, backendUrl, logout
  ]);

  // Memoized sub-components
  const productImagesSection = useMemo(() => (
    <ProductImagesSection images={images} handleImageChange={handleImageChange} />
  ), [images, handleImageChange]);

  const dealImagesSection = useMemo(() => (
    <DealImagesSection dealImages={dealImages} handleDealImageChange={handleDealImageChange} />
  ), [dealImages, handleDealImageChange]);

  const productSection = useMemo(() => (
    <ProductSection
      categories={categories}
      category={category}
      setCategory={setCategory}
      subCategory={subCategory}
      setSubCategory={setSubCategory}
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      cost={cost}
      setCost={setCost}
      price={price}
      setPrice={setPrice}
      discountprice={discountprice}
      setDiscountprice={setDiscountprice}
      quantity={quantity}
      setQuantity={setQuantity}
      bestseller={bestseller}
      setBestseller={setBestseller}
      productSavings={productSavings}
      productDiscountPercentage={productDiscountPercentage}
      productProfit={productProfit}
      productProfitPercentage={productProfitPercentage}
      // New optional fields
      ingredients={ingredients}
      setIngredients={setIngredients}
      howToUse={howToUse}
      setHowToUse={setHowToUse}
      benefits={benefits}
      setBenefits={setBenefits}
      ingredientCount={ingredientCount}
      benefitCount={benefitCount}
    />
  ), [
    categories, category, subCategory, name, description, cost, price, discountprice, quantity, bestseller, 
    productSavings, productDiscountPercentage, productProfit, productProfitPercentage,
    ingredients, howToUse, benefits, ingredientCount, benefitCount
  ]);

  const dealSection = useMemo(() => (
    <DealSection
      dealName={dealName}
      setDealName={setDealName}
      dealDescription={dealDescription}
      setDealDescription={setDealDescription}
      dealTypes={dealTypes}
      dealType={dealType}
      setDealType={setDealType}
      dealStartDate={dealStartDate}
      setDealStartDate={setDealStartDate}
      dealEndDate={dealEndDate}
      setDealEndDate={setDealEndDate}
      dealProducts={dealProducts}
      handleDealProductChange={handleDealProductChange}
      handleRemoveDealProduct={handleRemoveDealProduct}
      handleAddDealProduct={handleAddDealProduct}
      dealDiscountType={dealDiscountType}
      setDealDiscountType={setDealDiscountType}
      dealDiscountValue={dealDiscountValue}
      setDealDiscountValue={setDealDiscountValue}
      dealTotal={dealTotal}
      finalPrice={finalPrice}
    />
  ), [
    dealName, dealDescription, dealTypes, dealType, dealStartDate, dealEndDate, dealProducts, handleDealProductChange,
    handleRemoveDealProduct, handleAddDealProduct, dealDiscountType,
    dealDiscountValue, dealTotal, finalPrice
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {activeTab === 'products' ? "Add New Product" : "Create New Deal"}
          </h2>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            {activeTab === 'products'
              ? "Fill in the details to add a new product to your store"
              : "Bundle products together with special discounts"}
          </p>
        </div>

        <form onSubmit={onSubmitHandler} className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
          {/* Tabs for Product/Deal */}
          <div className="mb-6 sm:mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 min-w-max ${
                    activeTab === 'products'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <FontAwesomeIcon icon={faBox} className="text-sm sm:text-lg" />
                    <span>Add Product</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deals')}
                  className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 min-w-max ${
                    activeTab === 'deals'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <FontAwesomeIcon icon={faTags} className="text-sm sm:text-lg" />
                    <span>Create Deal</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Images */}
          {activeTab === 'products' ? productImagesSection : dealImagesSection}

          {/* Form Sections */}
          {activeTab === 'products' ? productSection : dealSection}

          {/* Submit */}
          <div className="flex items-center justify-center mt-6 sm:mt-8">
            <button
              type="submit"
              disabled={loading || !token}
              className={`w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3 font-medium rounded-lg flex items-center justify-center transition-colors text-sm sm:text-base ${
                loading || !token ? "bg-gray-400 cursor-not-allowed text-white" : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Saving...
                </>
              ) : !token ? (
                <>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  Please Login
                </>
              ) : activeTab === 'deals' ? (
                <>
                  <FontAwesomeIcon icon={faTags} className="mr-2" />
                  Create Deal
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Memoized sub-components (updated to use dynamic data)
const ProductImagesSection = memo(({ images, handleImageChange }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">Product Images</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {images.map((img, index) => (
          <label key={index} htmlFor={`image${index}`} className="relative group cursor-pointer">
            <div className="w-full h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-black transition-colors">
              {img ? (
                <img className="w-full h-full object-cover" src={URL.createObjectURL(img)} alt="Upload preview" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-2">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </div>
            <input type="file" id={`image${index}`} hidden onChange={(e) => handleImageChange(e, index)} accept="image/*" />
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Click on each box to upload product images</p>
    </div>
  );
});

const DealImagesSection = memo(({ dealImages, handleDealImageChange }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">Deal Images</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {dealImages.map((img, index) => (
          <label key={index} htmlFor={`dealImage${index + 1}`} className="relative group cursor-pointer">
            <div className="w-full h-24 sm:h-28 md:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-black transition-colors">
              {img ? (
                <img className="w-full h-full object-cover" src={URL.createObjectURL(img)} alt="Deal preview" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-2">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id={`dealImage${index + 1}`} 
              hidden 
              onChange={(e) => handleDealImageChange(e, index)} 
              accept="image/*" 
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">Click on each box to upload deal images</p>
    </div>
  );
});

const ProductSection = memo(({
  categories,
  category,
  setCategory,
  subCategory,
  setSubCategory,
  name,
  setName,
  description,
  setDescription,
  cost,
  setCost,
  price,
  setPrice,
  discountprice,
  setDiscountprice,
  quantity,
  setQuantity,
  bestseller,
  setBestseller,
  productSavings,
  productDiscountPercentage,
  productProfit,
  productProfitPercentage,
  // New optional fields
  ingredients,
  setIngredients,
  howToUse,
  setHowToUse,
  benefits,
  setBenefits,
  ingredientCount,
  benefitCount
}) => {
  const finalPrice = discountprice && discountprice > 0 ? Number(discountprice) : Number(price);
  const hasDiscount = discountprice && discountprice > 0 && discountprice < price;
  const hasCost = cost && cost > 0;

  // Get current category's subcategories
  const currentCategory = categories.find(cat => cat._id === category);
  const subcategories = currentCategory?.subcategories || [];

  return (
    <>
      {/* Product Name & Description */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Enter product name"
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
        />
      </div>
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your product in detail..."
          required
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors h-24 sm:h-32 resize-none text-sm sm:text-base"
        />
      </div>

      {/* Category / Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const selectedCategory = categories.find(cat => cat._id === e.target.value);
              if (selectedCategory?.subcategories?.length > 0) {
                setSubCategory(selectedCategory.subcategories[0]._id);
              } else {
                setSubCategory("");
              }
            }}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory *</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
            disabled={!category}
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prices / Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <InputField label="Cost Price" value={cost} onChange={setCost} />
        <InputField label="Selling Price *" value={price} onChange={setPrice} required />
        <InputField label="Discount Price" value={discountprice} onChange={setDiscountprice} />
        <InputField label="Quantity *" value={quantity} onChange={setQuantity} required />
      </div>

      {/* Ingredients Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <FontAwesomeIcon icon={faFlask} className="mr-2 text-gray-600" />
            Ingredients (Optional)
          </label>
          <span className="text-xs text-gray-500">{ingredientCount} ingredient(s)</span>
        </div>
        
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Enter ingredients separated by commas, e.g., Aloe Vera Extract, Vitamin C, Hyaluronic Acid"
          rows="3"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter ingredients separated by commas. Example: "Aloe Vera Extract, Vitamin C, Hyaluronic Acid"
        </p>
      </div>

      {/* How to Use Section */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-600" />
          How to Use (Optional)
        </label>
        <textarea
          value={howToUse}
          onChange={(e) => setHowToUse(e.target.value)}
          placeholder="Provide instructions for using the product..."
          rows="4"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors h-20 sm:h-24 resize-none text-sm sm:text-base"
        />
        <p className="text-xs text-gray-500 mt-1">Provide usage instructions if applicable</p>
      </div>

      {/* Benefits Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-gray-600" />
            Benefits (Optional)
          </label>
          <span className="text-xs text-gray-500">{benefitCount} benefit(s)</span>
        </div>
        
        <textarea
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
          placeholder="Enter benefits separated by commas, e.g., Hydrates skin, Reduces wrinkles, Brightens complexion"
          rows="3"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter benefits separated by commas. Example: "Hydrates skin, Reduces wrinkles, Brightens complexion"
        </p>
      </div>

      {/* Product Summary */}
      {price && (
        <div className="bg-blue-50 p-3 sm:p-4 md:p-5 rounded-lg mb-4 sm:mb-6 border border-blue-200">
          <h4 className="text-sm sm:text-md font-medium mb-3 sm:mb-4 flex items-center">
            <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-600" />
            Product Pricing Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
            <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
              <div className="text-gray-600">Original Price</div>
              <div className="text-base sm:text-lg font-bold text-gray-800">{Number(price).toFixed(2)}</div>
            </div>
            
            {hasDiscount ? (
              <>
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                  <div className="text-gray-600">Discount</div>
                  <div className="text-base sm:text-lg font-bold text-red-600">
                    {productDiscountPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Save {productSavings.toFixed(2)}</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                  <div className="text-gray-600">Final Price</div>
                  <div className="text-base sm:text-lg font-bold text-green-600">{finalPrice.toFixed(2)}</div>
                </div>
              </>
            ) : (
              <div className="text-center p-2 sm:p-3 bg-white rounded-lg col-span-2">
                <div className="text-gray-600">Current Price</div>
                <div className="text-base sm:text-lg font-bold text-green-600">{finalPrice.toFixed(2)}</div>
              </div>
            )}
            
            {hasCost && (
              <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                <div className="text-gray-600">Profit</div>
                <div className={`text-base sm:text-lg font-bold ${productProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {productProfit.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{productProfitPercentage.toFixed(1)}% margin</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bestseller */}
      <div className="mb-4 sm:mb-6">
        <label className="flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only" checked={bestseller} onChange={() => setBestseller((prev) => !prev)} />
          <div className={`w-10 h-6 rounded-full ${bestseller ? "bg-black" : "bg-gray-300"} relative`}>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${bestseller ? "translate-x-4" : ""}`}></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700 flex items-center">
            <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500" />
            Mark as Bestseller
          </span>
        </label>
      </div>
    </>
  );
});

const DealSection = memo(({
  dealName,
  setDealName,
  dealDescription,
  setDealDescription,
  dealTypes,
  dealType,
  setDealType,
  dealStartDate,
  setDealStartDate,
  dealEndDate,
  setDealEndDate,
  dealProducts,
  handleDealProductChange,
  handleRemoveDealProduct,
  handleAddDealProduct,
  dealDiscountType,
  setDealDiscountType,
  dealDiscountValue,
  setDealDiscountValue,
  dealTotal,
  finalPrice
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Deal Name / Description */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deal Name *</label>
          <input
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            type="text"
            placeholder="e.g., Summer Skincare Bundle"
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deal Description</label>
          <textarea
            value={dealDescription}
            onChange={(e) => setDealDescription(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors h-20 sm:h-24 resize-none text-sm sm:text-base"
            placeholder="Describe this deal and its benefits..."
          />
        </div>
      </div>

      {/* Deal Type - Dropdown */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type *</label>
        <select
          value={dealType}
          onChange={(e) => setDealType(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
        >
          <option value="">Select Deal Type</option>
          {dealTypes.map((type) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Deal Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <div className="relative">
            <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input 
              type="date" 
              value={dealStartDate}
              onChange={(e) => setDealStartDate(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <div className="relative">
            <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input 
              type="date" 
              value={dealEndDate}
              onChange={(e) => setDealEndDate(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base" 
            />
          </div>
        </div>
      </div>

      {/* Deal Products */}
      <div className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
          <h4 className="text-sm sm:text-md font-medium flex items-center">
            <FontAwesomeIcon icon={faBoxes} className="mr-2 text-black" />
            Products in Deal
          </h4>
          <span className="text-xs sm:text-sm text-gray-500">{dealProducts.length} product(s) added</span>
        </div>

        {dealProducts.map((p, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3 items-end">
              <InputSmall label="Name" value={p.name} onChange={(v) => handleDealProductChange(index, "name", v)} />
              <InputSmall label="Cost" value={p.cost} onChange={(v) => handleDealProductChange(index, "cost", Number(v))} />
              <InputSmall label="Price" value={p.price} onChange={(v) => handleDealProductChange(index, "price", Number(v))} />
              <InputSmall label="Qty" value={p.quantity} onChange={(v) => handleDealProductChange(index, "quantity", Number(v))} />
              <InputSmall label="Total" value={p.total} readOnly />
              <button 
                type="button" 
                onClick={() => handleRemoveDealProduct(index)} 
                className="text-red-600 hover:text-red-800 transition-colors p-1 sm:p-2 text-xs sm:text-sm flex items-center justify-center mt-1"
              >
                <FontAwesomeIcon icon={faTrashAlt} className="mr-1 text-xs" />
                Delete
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddDealProduct}
          className="flex items-center justify-center w-full py-2 sm:py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors text-sm sm:text-base"
        >
          <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
          Add Product to Deal
        </button>
      </div>

      {/* Discount */}
      <div className="bg-gray-50 p-3 sm:p-4 md:p-5 rounded-lg mb-4 sm:mb-6">
        <h4 className="text-sm sm:text-md font-medium mb-3 sm:mb-4 flex items-center">
          <FontAwesomeIcon icon={faPercent} className="mr-2 text-black" />
          Discount Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
            <div className="flex space-x-3 sm:space-x-4">
              {["percentage", "flat"].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    checked={dealDiscountType === type}
                    onChange={(e) => setDealDiscountType(e.target.value)}
                    className="mr-2 text-black"
                  />
                  <span className="text-sm">{type === "percentage" ? "Percentage" : "Flat Amount"}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {dealDiscountType === "percentage" ? (
                  <FontAwesomeIcon icon={faPercent} className="text-gray-500 text-sm" />
                ) : (
                  <FontAwesomeIcon icon={faDollarSign} className="text-gray-500 text-sm" />
                )}
              </div>
              <input
                type="number"
                min="0"
                value={dealDiscountValue}
                onChange={(e) => setDealDiscountValue(e.target.value)}
                placeholder={dealDiscountType === "percentage" ? "e.g., 20" : "e.g., 5"}
                required
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Deal Summary */}
      <div className="bg-blue-50 p-3 sm:p-4 md:p-5 rounded-lg mb-4 sm:mb-6 border border-blue-200">
        <h4 className="text-sm sm:text-md font-medium mb-3 sm:mb-4 flex items-center">
          <FontAwesomeIcon icon={faReceipt} className="mr-2 text-blue-600" />
          Deal Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
            <div className="text-gray-600">Total Value</div>
            <div className="text-base sm:text-lg font-bold text-gray-800">{dealTotal.toFixed(2)}</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
            <div className="text-gray-600">Discount</div>
            <div className="text-base sm:text-lg font-bold text-red-600">
              {dealDiscountType === "percentage" ? `${dealDiscountValue}%` : `$${dealDiscountValue}`}
            </div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
            <div className="text-gray-600">Final Price</div>
            <div className="text-base sm:text-lg font-bold text-green-600">{finalPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

const InputField = memo(({ label, value, onChange, required = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        min="0"
        step="0.01"
        required={required}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
      />
    </div>
  );
});

const InputSmall = memo(({ label, value, onChange, readOnly = false }) => {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-black focus:border-black transition-colors ${
          readOnly ? "bg-gray-100" : ""
        }`}
      />
    </div>
  );
});

export default Add;