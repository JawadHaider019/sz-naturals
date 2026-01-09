import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const DealDetails = ({ deal, mode, token, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    ...deal,
    dealName: deal.dealName || '',
    dealDescription: deal.dealDescription || '',
    dealDiscountType: deal.dealDiscountType || 'percentage',
    dealDiscountValue: deal.dealDiscountValue || 0,
    dealTotal: deal.dealTotal || 0,
    dealFinalPrice: deal.dealFinalPrice || 0,
    dealStartDate: deal.dealStartDate ? new Date(deal.dealStartDate).toISOString().split('T')[0] : '',
    dealEndDate: deal.dealEndDate ? new Date(deal.dealEndDate).toISOString().split('T')[0] : '',
    dealType: deal.dealType || '',
    status: deal.status || 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [newImages, setNewImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [dealProducts, setDealProducts] = useState(deal.dealProducts || [])
  
  // Fetch deal types from backend
  const [dealTypes, setDealTypes] = useState([])
  const [dealTypesLoading, setDealTypesLoading] = useState(true)

  // Fetch deal types from backend
  useEffect(() => {
    const fetchDealTypes = async () => {
      try {
        setDealTypesLoading(true)
        const response = await axios.get(backendUrl + '/api/deal-types')
        if (response.data) {
          setDealTypes(response.data)
          
          // Set default deal type if none is selected
          if (!deal.dealType && response.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              dealType: response.data[0]._id
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching deal types:', error)
        toast.error('Failed to load deal types')
      } finally {
        setDealTypesLoading(false)
      }
    }

    fetchDealTypes()
  }, [deal.dealType])

  // Helper function to get deal type name
  const getDealTypeName = (dealTypeId) => {
    if (!dealTypeId) return 'Select Deal Type'
    const dealType = dealTypes.find(type => type._id === dealTypeId)
    return dealType ? dealType.name : 'Unknown Deal Type'
  }

  // Calculate total price from all products
  const calculateDealTotal = () => {
    return dealProducts.reduce((total, product) => {
      const productTotal = (product.price || 0) * (product.quantity || 1);
      return total + productTotal;
    }, 0);
  }

  // Calculate final price after discount
  const calculateFinalPrice = () => {
    const total = calculateDealTotal();
    const discountValue = parseFloat(formData.dealDiscountValue) || 0;
    
    if (formData.dealDiscountType === 'percentage') {
      // Percentage discount
      const discountAmount = total * (discountValue / 100);
      return Math.max(0, total - discountAmount);
    } else {
      // Fixed amount discount
      return Math.max(0, total - discountValue);
    }
  }

  // Update formData when products or discount changes
  useEffect(() => {
    const total = calculateDealTotal();
    const finalPrice = calculateFinalPrice();
    
    setFormData(prev => ({
      ...prev,
      dealTotal: parseFloat(total.toFixed(2)),
      dealFinalPrice: parseFloat(finalPrice.toFixed(2))
    }));
  }, [dealProducts, formData.dealDiscountType, formData.dealDiscountValue]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  // Remove existing image
  const removeExistingImage = (index) => {
    setRemovedImages(prev => [...prev, formData.dealImages[index]])
    setFormData(prev => ({
      ...prev,
      dealImages: prev.dealImages.filter((_, i) => i !== index)
    }))
  }

  // Remove new image (before upload)
  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  // Add new product to deal
  const addNewProduct = () => {
    setDealProducts(prev => [...prev, {
      name: '',
      price: 0,
      cost: 0,
      quantity: 1,
      total: 0
    }])
  }

  // Remove product from deal
  const removeProduct = (index) => {
    setDealProducts(prev => prev.filter((_, i) => i !== index))
  }

  // Update product field
  const updateProduct = (index, field, value) => {
    const updatedProducts = [...dealProducts]
    updatedProducts[index][field] = value
    
    // Calculate total if price or quantity changes
    if (field === 'price' || field === 'quantity') {
      const price = parseFloat(updatedProducts[index].price) || 0;
      const quantity = parseInt(updatedProducts[index].quantity) || 1;
      updatedProducts[index].total = price * quantity;
    }
    
    setDealProducts(updatedProducts)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      console.log("=== DEBUG: Saving Deal ===");
      console.log("Deal ID:", deal._id);
      console.log("Calculated Total:", formData.dealTotal);
      console.log("Calculated Final Price:", formData.dealFinalPrice);
      console.log("Products to save:", dealProducts);
      console.log("Deal Type being sent:", formData.dealType);

      // Create FormData
      const formDataToSend = new FormData()
      
      // Add basic fields
      formDataToSend.append('id', deal._id)
      formDataToSend.append('dealName', formData.dealName)
      formDataToSend.append('dealDescription', formData.dealDescription)
      formDataToSend.append('dealDiscountType', formData.dealDiscountType)
      formDataToSend.append('dealDiscountValue', formData.dealDiscountValue)
      formDataToSend.append('dealTotal', formData.dealTotal)
      formDataToSend.append('dealFinalPrice', formData.dealFinalPrice)
      formDataToSend.append('dealStartDate', formData.dealStartDate)
      formDataToSend.append('dealEndDate', formData.dealEndDate || '')
      formDataToSend.append('dealType', formData.dealType) // This should now be a valid ObjectId
      formDataToSend.append('status', formData.status)
      
      // Add products as JSON string
      formDataToSend.append('dealProducts', JSON.stringify(dealProducts))
      
      // Add removed images as JSON string
      formDataToSend.append('removedImages', JSON.stringify(removedImages))
      
      // Add new images with proper field names
      newImages.forEach((image, index) => {
        formDataToSend.append(`dealImage${index + 1}`, image)
      })

      const response = await axios.post(
        backendUrl + '/api/deal/update',
        formDataToSend,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      )
      
      if (response.data.success) {
        toast.success('Deal updated successfully')
        
        // Clear the image states after successful save
        setNewImages([])
        setRemovedImages([])
        
        onSave()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log('Deal update error:', error)
      console.log('Error details:', error.response?.data)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return
    }
    
    try {
      const response = await axios.post(
        backendUrl + '/api/deal/remove', 
        { id: deal._id }, 
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        onBack()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to List
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'view' ? 'Deal Details' : 'Edit Deal'}
            </h2>
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

        {/* Deal Details */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {mode === 'view' ? (
              <ViewMode 
                deal={deal} 
                getDealTypeName={getDealTypeName}
              />
            ) : (
              <EditMode 
                formData={formData}
                onChange={handleChange}
                loading={loading}
                dealTypes={dealTypes}
                dealTypesLoading={dealTypesLoading}
                // Image management props
                newImages={newImages}
                removedImages={removedImages}
                onImageUpload={handleImageUpload}
                onRemoveExistingImage={removeExistingImage}
                onRemoveNewImage={removeNewImage}
                // Product management props
                dealProducts={dealProducts}
                onAddProduct={addNewProduct}
                onRemoveProduct={removeProduct}
                onUpdateProduct={updateProduct}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ViewMode = ({ deal, getDealTypeName }) => {
  // Calculate prices for display
  const calculatedTotal = deal.dealProducts?.reduce((total, product) => 
    total + ((product.price || 0) * (product.quantity || 1)), 0
  ) || deal.dealTotal;
  
  const calculatedFinal = deal.dealDiscountType === 'percentage' 
    ? calculatedTotal - (calculatedTotal * ((deal.dealDiscountValue || 0) / 100))
    : Math.max(0, calculatedTotal - (deal.dealDiscountValue || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Images */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Deal Images</h3>
        <div className="grid grid-cols-2 gap-4">
          {deal.dealImages && deal.dealImages.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`${deal.dealName} ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Deal Information</h3>
          <div className="space-y-3">
            <DetailRow label="Deal Name" value={deal.dealName} />
            <DetailRow label="Description" value={deal.dealDescription} />
            <DetailRow label="Deal Type" value={getDealTypeName(deal.dealType)} />
            <DetailRow label="Discount Type" value={deal.dealDiscountType} />
            <DetailRow 
              label="Discount Value" 
              value={
                deal.dealDiscountType === 'percentage' 
                  ? `${deal.dealDiscountValue}%` 
                  : `${currency}${deal.dealDiscountValue}`
              } 
            />
            <DetailRow label="Total Price" value={`${currency}${calculatedTotal.toFixed(2)}`} />
            <DetailRow label="Final Price" value={`${currency}${calculatedFinal.toFixed(2)}`} />
            <DetailRow label="Products Included" value={deal.dealProducts?.length || 0} />
            <DetailRow label="Start Date" value={new Date(deal.dealStartDate).toLocaleDateString()} />
            <DetailRow label="End Date" value={deal.dealEndDate ? new Date(deal.dealEndDate).toLocaleDateString() : 'No end date'} />
            <DetailRow label="Status" value={deal.status || 'draft'} />
            <DetailRow label="Date Created" value={new Date(deal.date).toLocaleDateString()} />
          </div>
        </div>

        {/* Products List */}
        {deal.dealProducts && deal.dealProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Included Products</h3>
            <div className="space-y-2">
              {deal.dealProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="text-gray-700 font-medium">{product.name}</span>
                    <div className="text-sm text-gray-500">
                      {product.quantity} × {currency}{product.price} = {currency}{product.total}
                    </div>
                  </div>
                  <span className="text-gray-900 font-medium">{currency}{product.total}</span>
                </div>
              ))}
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
  dealTypes,
  dealTypesLoading,
  newImages,
  removedImages,
  onImageUpload,
  onRemoveExistingImage,
  onRemoveNewImage,
  dealProducts,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct
}) => {
  const savings = formData.dealTotal - formData.dealFinalPrice;
  
  return (
    <div className="space-y-8">
      {/* Deal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Name</label>
            <input
              type="text"
              name="dealName"
              value={formData.dealName}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
            {dealTypesLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                Loading deal types...
              </div>
            ) : (
              <select
                name="dealType"
                value={formData.dealType}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Deal Type</option>
                {dealTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
            <select
              name="dealDiscountType"
              value={formData.dealDiscountType}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
            <input
              type="number"
              name="dealDiscountValue"
              value={formData.dealDiscountValue}
              onChange={onChange}
              min="0"
              step={formData.dealDiscountType === 'percentage' ? "1" : "0.01"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Price ({currency})
              <span className="text-green-600 ml-2 text-sm font-normal">✓ Auto-calculated</span>
            </label>
            <input
              type="number"
              name="dealTotal"
              value={formData.dealTotal}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              Sum of all product prices × quantities
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Price ({currency})
              <span className="text-green-600 ml-2 text-sm font-normal">✓ Auto-calculated</span>
            </label>
            <input
              type="number"
              name="dealFinalPrice"
              value={formData.dealFinalPrice}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              Total price after applying {formData.dealDiscountValue}
              {formData.dealDiscountType === 'percentage' ? '%' : currency} discount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              name="dealStartDate"
              value={formData.dealStartDate}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              name="dealEndDate"
              value={formData.dealEndDate}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Management */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Deal Images</h3>
        
        {/* Removed Images Info */}
        {removedImages.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">{removedImages.length} image(s)</span> will be removed when you save changes.
            </p>
          </div>
        )}
        
        {/* Existing Images */}
        {formData.dealImages && formData.dealImages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Current Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.dealImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Deal image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">New Images to Upload</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">You can select multiple images. New images will be added to existing ones.</p>
        </div>
      </div>

      {/* Product Management */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Deal Products</h3>
          <button
            type="button"
            onClick={onAddProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Product
          </button>
        </div>

        {dealProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products added to this deal
          </div>
        ) : (
          <div className="space-y-4">
            {dealProducts.map((product, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Product {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => onUpdateProduct(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost ({currency})</label>
                    <input
                      type="number"
                      value={product.cost}
                      onChange={(e) => onUpdateProduct(index, 'cost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ({currency})</label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => onUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => onUpdateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total ({currency})</label>
                    <input
                      type="number"
                      value={product.total}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          name="dealDescription"
          value={formData.dealDescription}
          onChange={onChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Price Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Price Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Products Total:</span>
            <div className="font-medium text-lg">{currency}{formData.dealTotal.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-gray-600">Discount:</span>
            <div className="font-medium text-lg text-red-600">
              {formData.dealDiscountType === 'percentage' 
                ? `${formData.dealDiscountValue}%`
                : `${currency}${formData.dealDiscountValue}`
              }
            </div>
          </div>
          <div>
            <span className="text-gray-600">Final Price:</span>
            <div className="font-medium text-lg text-green-600">
              {currency}{formData.dealFinalPrice.toFixed(2)}
            </div>
          </div>
        </div>
        {savings > 0 && (
          <div className="mt-2 text-sm text-blue-700">
            Customer saves: {currency}{savings.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

// Fixed DetailRow component that safely handles object values
const DetailRow = ({ label, value }) => {
  // Safely convert value to display string
  const displayValue = React.useMemo(() => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      // If it's an object, try to get a meaningful string representation
      if (value.name) return value.name;
      if (value._id) return value._id;
      if (value.toString) return value.toString();
      return JSON.stringify(value); // fallback
    }
    return value;
  }, [value]);

  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-900">{displayValue}</span>
    </div>
  );
}

export default DealDetails