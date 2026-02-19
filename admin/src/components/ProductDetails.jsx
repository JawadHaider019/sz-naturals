import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { 
  FaArrowLeft, 
  FaTimes, 
  FaInfoCircle, 
  FaFlask, 
  FaCheckCircle,
  FaListUl,
  FaVideo,
  FaPlayCircle,
  FaTrash,
  FaExclamationTriangle
} from 'react-icons/fa'

const ProductDetails = ({ product, mode, token, onBack, onSave }) => {
  // Debug logs at component start
  console.log('🚀 ========== PRODUCT DETAILS MOUNTED ==========');
  console.log('📦 Product received:', {
    exists: !!product,
    id: product?._id,
    name: product?.name,
    hasVideo: !!product?.video,
    videoUrl: product?.video,
    mode: mode
  });
  console.log('===============================================');

  // Safety check for missing product
  if (!product) {
    console.error('❌ No product provided to ProductDetails');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">No product data available</p>
          <button 
            onClick={onBack} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    ...product,
    name: product.name || '',
    description: product.description || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    cost: product.cost || 0,
    price: product.price || 0,
    discountprice: product.discountprice || 0,
    quantity: Math.max(0, product.quantity || 0), // Ensure not negative
    bestseller: product.bestseller || false,
    status: product.status || 'draft',
    // Video field
    video: product.video || null,
    // New fields - converted to comma-separated strings
    ingredients: product.ingredients && Array.isArray(product.ingredients) 
      ? product.ingredients.join(', ') 
      : '',
    howToUse: product.howToUse || '',
    benefits: product.benefits && Array.isArray(product.benefits) 
      ? product.benefits.join(', ') 
      : ''
  })
  
  const [loading, setLoading] = useState(false)
  const [newImages, setNewImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  
  // Video state
  const [newVideo, setNewVideo] = useState(null)
  const [removeCurrentVideo, setRemoveCurrentVideo] = useState(false)
  const [videoPreview, setVideoPreview] = useState(null)
  
  // Fetch categories and subcategories from backend
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Helper function to find subcategory by name or ID
  const findSubcategoryId = (subcategoryIdOrName, subcategoriesList) => {
    if (!subcategoryIdOrName || !subcategoriesList) return '';
    
    // Try to find by ID first
    const byId = subcategoriesList.find(sub => sub._id === subcategoryIdOrName);
    if (byId) return byId._id;
    
    // Try to find by name
    const byName = subcategoriesList.find(sub => sub.name === subcategoryIdOrName);
    if (byName) return byName._id;
    
    return '';
  };

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await axios.get(backendUrl + '/api/categories')
        
        console.log('Categories API Response:', response.data)
        
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data)
          
          // If product has a category, load its subcategories
          if (product.category) {
            console.log('Product category:', product.category)
            
            // Try to find category by _id first, then by name if needed
            const selectedCategory = response.data.find(cat => 
              cat._id === product.category || 
              cat.name === product.category ||
              cat._id === formData.category || 
              cat.name === formData.category
            )
            
            if (selectedCategory && selectedCategory.subcategories) {
              console.log('Found subcategories:', selectedCategory.subcategories)
              setSubcategories(selectedCategory.subcategories)
              
              // Also set the category in formData if it's not set
              if (!formData.category && selectedCategory._id) {
                setFormData(prev => ({ 
                  ...prev, 
                  category: selectedCategory._id 
                }))
              }
              
              // Try to preserve the subcategory if it exists
              if (product.subcategory) {
                const subcategoryId = findSubcategoryId(product.subcategory, selectedCategory.subcategories);
                if (subcategoryId) {
                  setFormData(prev => ({ 
                    ...prev, 
                    subcategory: subcategoryId 
                  }));
                }
              }
            }
          }
        } else {
          console.warn('Unexpected categories response format:', response.data)
          toast.error('Failed to load categories: Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    
    fetchCategories()
  }, [product.category, product.subcategory, formData.category])

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(cat => cat._id === formData.category)
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories)
        
        // Reset subcategory if it doesn't belong to the new category
        if (formData.subcategory) {
          const subcategoryExists = selectedCategory.subcategories.find(
            sub => sub._id === formData.subcategory
          )
          if (!subcategoryExists) {
            setFormData(prev => ({ ...prev, subcategory: '' }))
          }
        }
      } else {
        setSubcategories([])
        setFormData(prev => ({ ...prev, subcategory: '' }))
      }
    } else {
      setSubcategories([])
      setFormData(prev => ({ ...prev, subcategory: '' }))
    }
  }, [formData.category, categories])

  // Create video preview URL when new video is selected
  useEffect(() => {
    if (newVideo) {
      const url = URL.createObjectURL(newVideo)
      setVideoPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setVideoPreview(null)
    }
  }, [newVideo])

  // Helper functions to get names for display
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Select Category'
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const getSubcategoryName = (subcategoryId) => {
    if (!subcategoryId) return 'Select Subcategory'
    const subcategory = subcategories.find(sub => sub._id === subcategoryId)
    return subcategory ? subcategory.name : 'Unknown Subcategory'
  }

  // Calculate basic pricing metrics
  const calculatePricingSummary = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;
    const discountPrice = parseFloat(formData.discountprice) || 0;

    const actualSellingPrice = discountPrice > 0 ? discountPrice : price;
    const discountAmount = discountPrice > 0 ? price - discountPrice : 0;
    const discountPercentage = price > 0 ? ((discountAmount / price) * 100) : 0;

    return {
      discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
      discountPercentage: isNaN(discountPercentage) ? 0 : discountPercentage,
      actualSellingPrice: isNaN(actualSellingPrice) ? 0 : actualSellingPrice
    };
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Special handling for category change
    if (name === 'category') {
      const selectedCategory = categories.find(cat => cat._id === value)
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Only clear subcategory if the new category doesn't have the current subcategory
        subcategory: selectedCategory && formData.subcategory 
          ? (selectedCategory.subcategories?.find(
              sub => sub._id === formData.subcategory || sub.name === formData.subcategory
            )?._id || '')
          : ''
      }))
    } else if (name === 'quantity') {
      // Handle quantity change with validation
      let newValue = parseInt(value) || 0;
      // Prevent negative values
      if (newValue < 0) {
        newValue = 0;
        toast.info("Quantity cannot be negative");
      }
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  // Video handlers
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Video file too large. Maximum size is 10MB");
        return;
      }
      // Check file type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload MP4, WebM, MOV, or 3GP video formats");
        return;
      }
      setNewVideo(file);
      setRemoveCurrentVideo(false); // If uploading new video, don't remove current
    }
  };

  const handleRemoveVideo = () => {
    if (formData.video && !newVideo) {
      // If there's an existing video and no new video, mark for removal
      setRemoveCurrentVideo(true);
    } else {
      // If there's a new video, just clear it
      setNewVideo(null);
    }
  };

  const handleCancelVideoRemoval = () => {
    setRemoveCurrentVideo(false);
  };

  // Helper function to convert comma-separated string to array
  const convertStringToArray = (str) => {
    if (!str || str.trim() === '') return [];
    return str.split(',').map(item => item.trim()).filter(item => item !== '');
  }

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  // Remove existing image
  const removeExistingImage = (index) => {
    setRemovedImages(prev => [...prev, formData.image[index]])
    setFormData(prev => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== index)
    }))
  }

  // Remove new image (before upload)
  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add basic fields
      formDataToSend.append('id', product._id)
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('subcategory', formData.subcategory)
      formDataToSend.append('cost', formData.cost.toString())
      formDataToSend.append('price', formData.price.toString())
      formDataToSend.append('discountprice', formData.discountprice.toString())
      formDataToSend.append('quantity', formData.quantity.toString())
      formDataToSend.append('bestseller', formData.bestseller.toString())
      formDataToSend.append('status', formData.status)
      
      // Add new fields - convert comma-separated strings to arrays
      const ingredientsArray = convertStringToArray(formData.ingredients);
      const benefitsArray = convertStringToArray(formData.benefits);
      
      if (ingredientsArray.length > 0) {
        formDataToSend.append("ingredients", JSON.stringify(ingredientsArray));
      } else {
        formDataToSend.append("ingredients", "[]"); // Empty array
      }
      
      formDataToSend.append("howToUse", formData.howToUse);
      
      if (benefitsArray.length > 0) {
        formDataToSend.append("benefits", JSON.stringify(benefitsArray));
      } else {
        formDataToSend.append("benefits", "[]"); // Empty array
      }
      
      // Video handling
      if (removeCurrentVideo) {
        formDataToSend.append('removeVideo', 'true');
      }
      
      if (newVideo) {
        formDataToSend.append('video', newVideo);
      }
      
      // Send removedImages as a proper JSON string
      formDataToSend.append('removedImages', JSON.stringify(removedImages))
      
      // Add new images
      newImages.forEach((image, index) => {
        formDataToSend.append(`image${index + 1}`, image)
      })

      const response = await axios.post(
        backendUrl + '/api/product/update',
        formDataToSend,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      )
      
      if (response.data.success) {
        toast.success('Product updated successfully')
        
        // Clear the image states after successful save
        setNewImages([])
        setRemovedImages([])
        setNewVideo(null)
        setRemoveCurrentVideo(false)
        
        onSave()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Product update error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    try {
      const response = await axios.post(
        backendUrl + '/api/product/remove', 
        { id: product._id }, 
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        onBack()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  }

  // Calculate ingredient and benefit counts for display
  const ingredientCount = formData.ingredients ? convertStringToArray(formData.ingredients).length : 0;
  const benefitCount = formData.benefits ? convertStringToArray(formData.benefits).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2 transition-colors duration-200"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'view' ? 'Product Details' : 'Edit Product'}
            </h2>
            {mode === 'edit' && (
              <p className="text-gray-600 mt-1">Make changes to your product information</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {mode === 'edit' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 font-medium flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {console.log('🔄 Rendering section - mode:', mode, 'product:', product?._id)}
            {mode === 'view' ? (
              <ViewMode 
                product={product} 
                getCategoryName={getCategoryName}
                getSubcategoryName={getSubcategoryName}
              />
            ) : (
              <EditMode 
                formData={formData}
                onChange={handleChange}
                loading={loading}
                categories={categories}
                subcategories={subcategories}
                categoriesLoading={categoriesLoading}
                // Image management props
                newImages={newImages}
                removedImages={removedImages}
                onImageUpload={handleImageUpload}
                onRemoveExistingImage={removeExistingImage}
                onRemoveNewImage={removeNewImage}
                // Video props
                newVideo={newVideo}
                removeCurrentVideo={removeCurrentVideo}
                videoPreview={videoPreview}
                onVideoChange={handleVideoChange}
                onRemoveVideo={handleRemoveVideo}
                onCancelVideoRemoval={handleCancelVideoRemoval}
                // Pricing summary
                pricingSummary={calculatePricingSummary()}
                // Helper functions
                getCategoryName={getCategoryName}
                getSubcategoryName={getSubcategoryName}
                // Counts for display
                ingredientCount={ingredientCount}
                benefitCount={benefitCount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ViewMode = ({ product, getCategoryName, getSubcategoryName }) => {
  // Debug logs
  console.log('========== VIEW MODE DEBUG ==========');
  console.log('1. Full product object:', JSON.stringify(product, null, 2));
  console.log('2. Video field:', product?.video);
  console.log('3. Video type:', typeof product?.video);
  console.log('4. Has video?', !!product?.video);
  console.log('5. Video exists condition:', product?.video ? 'true' : 'false');
  console.log('=====================================');

  // Test if video URL is accessible
  if (product?.video) {
    fetch(product.video, { method: 'HEAD' })
      .then(res => console.log('Video URL status:', res.status))
      .catch(err => console.error('Video URL error:', err));
  }
  
  // Convert arrays to comma-separated strings for display
  const ingredientsString = product.ingredients && Array.isArray(product.ingredients) 
    ? product.ingredients.join(', ') 
    : '';
  const benefitsString = product.benefits && Array.isArray(product.benefits) 
    ? product.benefits.join(', ') 
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Images & Video */}
      <div className="space-y-6">
        {/* Product Images Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Images</h3>
          <div className="grid grid-cols-2 gap-4">
            {product.image && product.image.length > 0 ? (
              product.image.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                No images available
              </div>
            )}
          </div>
        </div>

        {/* Debug Info - Shows video URL */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-bold text-yellow-800 mb-2">Debug Info</h4>
          <p className="text-sm text-yellow-700 break-all">
            <span className="font-medium">Video URL:</span> {product.video || 'No video URL'}
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            <span className="font-medium">Has Video:</span> {product.video ? '✅ Yes' : '❌ No'}
          </p>
        </div>

        {/* Product Video Section - Simple Test */}
        {product.video ? (
          <div className="border-4 border-blue-500 rounded-xl p-4 bg-blue-50">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <FaVideo className="w-5 h-5 mr-2 text-blue-600" />
              Product Video Test
            </h3>
            
            {/* Direct video player */}
            <div className="mb-4">
              <video 
                src={product.video}
                controls
                className="w-full rounded-lg shadow-lg"
                style={{ minHeight: '200px', backgroundColor: '#000' }}
                onError={(e) => {
                  console.error('Video failed to load:', e);
                  e.target.style.display = 'none';
                }}
              >
                <source src={product.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Direct link */}
            <div className="mt-2 text-center">
              <a 
                href={product.video} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Open video directly in new tab
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <FaVideo className="w-5 h-5 mr-2 text-gray-400" />
              Product Video
            </h3>
            <div className="text-center text-gray-500 py-8">
              <FaVideo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No video available for this product</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Product Details */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <DetailRow label="Name" value={product.name} highlight />
              <DetailRow label="Description" value={product.description} />
              <DetailRow label="Category" value={getCategoryName(product.category)} />
              <DetailRow label="Subcategory" value={getSubcategoryName(product.subcategory) || 'N/A'} />
              <DetailRow label="Cost Price" value={`${currency}${Number(product.cost).toFixed(2)}`} />
              <DetailRow label="Original Price" value={`${currency}${Number(product.price).toFixed(2)}`} />
              <DetailRow label="Discount Price" value={product.discountprice > 0 ? `${currency}${Number(product.discountprice).toFixed(2)}` : 'No discount'} />
              <DetailRow label="Quantity in Stock" value={product.quantity} />
              <DetailRow label="Bestseller" value={product.bestseller ? '✓ Yes' : '✗ No'} />
              <DetailRow label="Status" value={
                <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                  product.status === 'published' ? 'bg-green-100 text-green-800' :
                  product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  product.status === 'archived' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {product.status}
                </span>
              } />
              <DetailRow label="Date Added" value={new Date(product.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} />
            </div>
          </div>
        </div>
        
        {/* Ingredients Section */}
        {ingredientsString && ingredientsString.trim() !== "" && (
          <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaFlask className="w-5 h-5 mr-2 text-blue-600" />
                Ingredients
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({product.ingredients?.length || 0} ingredients)
                </span>
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-gray-700 leading-relaxed">{ingredientsString}</p>
              </div>
            </div>
          </div>
        )}

        {/* How to Use Section */}
        {product.howToUse && product.howToUse.trim() !== "" && (
          <div className="bg-white rounded-xl border border-purple-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaInfoCircle className="w-5 h-5 mr-2 text-purple-600" />
                How to Use
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">{product.howToUse}</div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        {benefitsString && benefitsString.trim() !== "" && (
          <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Benefits
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({product.benefits?.length || 0} benefits)
                </span>
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-gray-700 leading-relaxed">{benefitsString}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const EditMode = ({ 
  formData, 
  onChange, 
  loading,
  categories,
  subcategories,
  categoriesLoading,
  newImages,
  removedImages,
  onImageUpload,
  onRemoveExistingImage,
  onRemoveNewImage,
  // Video props
  newVideo,
  removeCurrentVideo,
  videoPreview,
  onVideoChange,
  onRemoveVideo,
  onCancelVideoRemoval,
  pricingSummary,
  getCategoryName,
  getSubcategoryName,
  ingredientCount,
  benefitCount
}) => {
  const {
    discountAmount,
    discountPercentage,
    actualSellingPrice
  } = pricingSummary;

  return (
    <div className="space-y-8">
      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            {categoriesLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                Loading categories...
              </div>
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={onChange}
              disabled={!formData.category || categoriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {!formData.category && !categoriesLoading && (
              <p className="text-sm text-gray-500 mt-1">Please select a category first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price ({currency})</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ({currency})</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price ({currency})</label>
            <input
              type="number"
              name="discountprice"
              value={formData.discountprice}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={(e) => {
                let value = parseInt(e.target.value) || 0;
                // Prevent negative values
                if (value < 0) {
                  value = 0;
                  toast.info("Quantity cannot be negative");
                }
                onChange({
                  target: {
                    name: 'quantity',
                    value: value
                  }
                });
              }}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">Current status: <span className="font-medium capitalize">{formData.status}</span></p>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              name="bestseller"
              checked={formData.bestseller}
              onChange={onChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 font-medium">Mark as Bestseller</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter product description..."
            />
          </div>
        </div>
      </div>

      {/* New Optional Fields Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">Additional Information</h3>
        
        {/* Ingredients Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaFlask className="w-4 h-4 mr-2 text-blue-600" />
              Ingredients (Optional)
            </label>
            <span className="text-xs text-gray-500">{ingredientCount} ingredient(s)</span>
          </div>
          
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={onChange}
            placeholder="Enter ingredients separated by commas, e.g., Aloe Vera Extract, Vitamin C, Hyaluronic Acid"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter ingredients separated by commas. Example: "Aloe Vera Extract, Vitamin C, Hyaluronic Acid"
          </p>
        </div>

        {/* How to Use Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FaInfoCircle className="w-4 h-4 mr-2 text-purple-600" />
            How to Use (Optional)
          </label>
          <textarea
            name="howToUse"
            value={formData.howToUse}
            onChange={onChange}
            placeholder="Provide instructions for using the product..."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Provide usage instructions if applicable</p>
        </div>

        {/* Benefits Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <FaCheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Benefits (Optional)
            </label>
            <span className="text-xs text-gray-500">{benefitCount} benefit(s)</span>
          </div>
          
          <textarea
            name="benefits"
            value={formData.benefits}
            onChange={onChange}
            placeholder="Enter benefits separated by commas, e.g., Hydrates skin, Reduces wrinkles, Brightens complexion"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter benefits separated by commas. Example: "Hydrates skin, Reduces wrinkles, Brightens complexion"
          </p>
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <FaVideo className="w-5 h-5 mr-2 text-purple-600" />
          Product Video (Optional)
        </h3>
        
        {/* Current Video */}
        {formData.video && !removeCurrentVideo && !newVideo && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-700">Current Video</h4>
              <button
                type="button"
                onClick={onRemoveVideo}
                className="text-red-600 hover:text-red-800 transition-colors text-sm flex items-center"
              >
                <FaTrash className="mr-1" />
                Remove Video
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <video 
                src={formData.video} 
                controls 
                className="w-full max-h-64 rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Video Marked for Removal */}
        {removeCurrentVideo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  Current video will be removed when you save changes.
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelVideoRemoval}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* New Video Preview */}
        {newVideo && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-700">New Video to Upload</h4>
              <button
                type="button"
                onClick={onRemoveVideo}
                className="text-red-600 hover:text-red-800 transition-colors text-sm flex items-center"
              >
                <FaTrash className="mr-1" />
                Remove
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <video 
                src={videoPreview} 
                controls 
                className="w-full max-h-64 rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
              <p className="text-sm text-gray-500 mt-2">
                {newVideo.name} ({(newVideo.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            </div>
          </div>
        )}

        {/* Upload New Video */}
        {!newVideo && (!formData.video || removeCurrentVideo) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video</label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/3gpp"
              onChange={onVideoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            <p className="text-sm text-gray-500 mt-2">
              Upload a short product demo or promotional video (Max 5MB, MP4/WebM/MOV/3GP formats)
            </p>
          </div>
        )}
      </div>

      {/* Image Management */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Images</h3>
        
        {/* Removed Images Info */}
        {removedImages.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">{removedImages.length} image(s)</span> will be removed when you save changes.
            </p>
          </div>
        )}
        
        {/* Existing Images */}
        {formData.image && formData.image.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-700">Current Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.image.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-700">New Images to Upload</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add More Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-sm text-gray-500 mt-2">You can select multiple images. New images will be added to existing ones.</p>
        </div>
      </div>

      {/* Simple Pricing Summary */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <FaInfoCircle className="w-5 h-5 mr-2 text-blue-600" />
          Pricing Summary
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cost Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {currency}{parseFloat(formData.cost || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Cost Price</div>
            </div>

            {/* Selling Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currency}{actualSellingPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Selling Price</div>
            </div>

            {/* Discount */}
            <div className="text-center">
              {discountAmount > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    {discountPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Discount 
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-500">No Discount</div>
                  <div className="text-sm text-gray-600 mt-1">Discount Applied</div>
                </>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {discountAmount > 0 && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-100">
              <div className="text-sm text-gray-600 text-center">
                Original Price: <span className="font-medium line-through">{currency}{parseFloat(formData.price || 0).toFixed(2)}</span>
                {' '}→{' '}
                Discount Price: <span className="font-medium text-green-600">{currency}{actualSellingPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900 font-medium">{value}</span>
  </div>
)

export default ProductDetails