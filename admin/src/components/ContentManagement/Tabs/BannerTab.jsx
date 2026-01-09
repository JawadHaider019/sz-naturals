import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';

// API service configuration
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Enhanced axios instance with retry logic and longer timeout
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000, // Increased to 30 seconds
  });

  // Add retry interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // If no retry count, initialize it
      if (!config.retryCount) {
        config.retryCount = 0;
      }
      
      // Maximum retry attempts
      const MAX_RETRY = 3;
      
      // Check if should retry (timeout errors and 5xx errors)
      if (config.retryCount < MAX_RETRY && 
          (error.code === 'ECONNABORTED' || !error.response || error.response.status >= 500)) {
        
        config.retryCount += 1;
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, config.retryCount) * 1000;
        
        console.log(`Retrying request (${config.retryCount}/${MAX_RETRY}) after ${delay}ms`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return instance(config);
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

const api = createApiInstance(API_BASE_URL);

// Image optimization helper
const optimizeImageUpload = (file, maxSizeMB = 5) => {
  return new Promise((resolve, reject) => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      reject(new Error(`Image size must be less than ${maxSizeMB}MB`));
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Please upload a valid image (JPEG, PNG, or WebP)'));
      return;
    }

    resolve(file);
  });
};

// Connection health check
const checkConnectionHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.warn('Connection health check failed:', error.message);
    return false;
  }
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 sm:px-6 sm:py-4 shadow-lg z-50 flex items-center gap-3 max-w-xs sm:max-w-md sm:min-w-80 mx-2 sm:mx-0 rounded-lg`}>
      <i className={`fas ${icon} text-base sm:text-lg`}></i>
      <span className="flex-1 text-sm sm:text-base">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 text-base sm:text-lg transition-colors"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, banner }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white max-w-sm sm:max-w-md w-full mx-2 sm:mx-0 rounded-lg shadow-xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 sm:p-3 rounded-full">
              <i className="fas fa-exclamation-triangle text-red-600 text-lg sm:text-xl"></i>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Banner</h3>
              <p className="text-gray-600 text-sm sm:text-base">This action cannot be undone.</p>
            </div>
          </div>
          
          {banner && (
            <div className="bg-gray-50 p-3 sm:p-4 mb-4 rounded-lg">
              <p className="font-medium text-gray-800 text-sm sm:text-base">Banner Details:</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {banner.headingLine1 || 'Untitled Banner'} (Order: {banner.order})
              </p>
              {banner.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={banner.imageUrl} 
                    alt="Banner preview" 
                    className="h-16 sm:h-20 w-24 sm:w-32 object-contain border rounded"
                  />
                </div>
              )}
            </div>
          )}

          <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
            Are you sure you want to delete this banner? This will permanently remove the banner and its associated image.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base rounded-md flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 text-sm sm:text-base rounded-md flex-1 sm:flex-none justify-center"
            >
              <i className="fas fa-trash-alt"></i>
              Delete Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Banner Management Component
export const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, banner: null, index: null });
  const previewUrlsRef = useRef([]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Load banners from backend
  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check connection first
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy) {
        showToast('Connection is slow, please wait...', 'warning');
      }
      
      const response = await api.get('/api/banners');
      
      if (response.data.success) {
        const sortedBanners = response.data.data.sort((a, b) => a.order - b.order);
        const bannersWithPreview = sortedBanners.map(banner => ({
          ...banner,
          imagePreview: banner.imageUrl,
          imageFile: null,
          isEditing: false
        }));
        setBanners(bannersWithPreview);
        showToast('Banners loaded successfully', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to load banners');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load banners';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save individual banner with progress tracking
  const handleSaveBanner = async (bannerData, onProgress = null) => {
    try {
      const formData = new FormData();
      
      const fields = ['headingLine1', 'headingLine2', 'subtext', 'buttonText', 'redirectUrl', 'isActive', 'order'];
      fields.forEach(field => {
        if (bannerData[field] !== undefined && bannerData[field] !== null) {
          formData.append(field, bannerData[field]);
        }
      });

      if (bannerData.imageFile) {
        formData.append('image', bannerData.imageFile);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 seconds for uploads
        onUploadProgress: onProgress || (() => {}),
      };

      let response;
      if (bannerData._id) {
        response = await api.put(`/api/banners/${bannerData._id}`, formData, config);
      } else {
        response = await api.post('/api/banners', formData, config);
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save banner';
      throw new Error(errorMessage);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (bannerId, index) => {
    try {
      if (bannerId) {
        await api.delete(`/api/banners/${bannerId}`);
      }
      
      const updatedBanners = banners.filter((_, i) => i !== index);
      setBanners(updatedBanners);
      showToast('Banner deleted successfully', 'success');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete banner');
    }
  };

  // Add new banner
  const handleAddBanner = () => {
    const newOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0;
    setBanners([...banners, {
      headingLine1: '',
      headingLine2: '',
      subtext: '',
      buttonText: '',
      redirectUrl: '',
      imageFile: null,
      imagePreview: '',
      isActive: true,
      order: newOrder,
      isEditing: true
    }]);
    showToast('New banner added', 'info');
  };

  // Save all banners
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      
      for (let i = 0; i < banners.length; i++) {
        const banner = banners[i];
        await handleSaveBanner(banner);
      }
      
      await loadBanners();
      showToast('All banners saved successfully', 'success');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save banners';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (index) => {
    setDeleteModal({
      isOpen: true,
      banner: banners[index],
      index: index
    });
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, banner: null, index: null });
  };

  // Confirm delete banner
  const confirmDeleteBanner = async () => {
    const { index } = deleteModal;
    const banner = banners[index];
    
    try {
      await handleDeleteBanner(banner._id, index);
      closeDeleteModal();
    } catch (error) {
      showToast('Error deleting banner: ' + error.message, 'error');
      closeDeleteModal();
    }
  };

  // Toggle edit mode for a banner
  const toggleEditMode = (index) => {
    const updated = [...banners];
    updated[index].isEditing = !updated[index].isEditing;
    setBanners(updated);
  };

  // Move banner up in order
  const moveBannerUp = (index) => {
    if (index === 0) return;
    
    const updated = [...banners];
    const currentOrder = updated[index].order;
    const prevOrder = updated[index - 1].order;
    
    updated[index].order = prevOrder;
    updated[index - 1].order = currentOrder;
    
    updated.sort((a, b) => a.order - b.order);
    setBanners(updated);
    showToast('Banner order updated', 'info');
  };

  // Move banner down in order
  const moveBannerDown = (index) => {
    if (index === banners.length - 1) return;
    
    const updated = [...banners];
    const currentOrder = updated[index].order;
    const nextOrder = updated[index + 1].order;
    
    updated[index].order = nextOrder;
    updated[index + 1].order = currentOrder;
    
    updated.sort((a, b) => a.order - b.order);
    setBanners(updated);
    showToast('Banner order updated', 'info');
  };

  // Update banner order manually
  const updateBannerOrder = (index, newOrder) => {
    const updated = [...banners];
    const oldOrder = updated[index].order;
    
    const existingBannerIndex = updated.findIndex(b => b.order === newOrder && b !== updated[index]);
    if (existingBannerIndex !== -1) {
      updated[existingBannerIndex].order = oldOrder;
    }
    
    updated[index].order = newOrder;
    updated.sort((a, b) => a.order - b.order);
    setBanners(updated);
  };

  // Load banners on component mount
  useEffect(() => {
    loadBanners();
  }, []);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-base sm:text-lg text-gray-600">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading banners...
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBanner}
        banner={deleteModal.banner}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Banner Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} found
            {banners.filter(b => b._id).length > 0 && ` (${banners.filter(b => b._id).length} saved)`}
          </p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddBanner}
            className="flex-1 sm:flex-none bg-black text-white px-3 sm:px-4 py-2 hover:bg-gray-800 transition-colors flex items-center gap-2 justify-center text-sm sm:text-base rounded-md"
          >
            <i className="fas fa-plus"></i>
            Add Banner
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex-1 sm:flex-none bg-black text-white px-3 sm:px-4 py-2 hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2 justify-center text-sm sm:text-base rounded-md"
          >
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Banner List */}
      <div className="space-y-4 sm:space-y-6">
        {banners.map((banner, index) => (
          <BannerCard
            key={banner._id || `banner-${index}`}
            banner={banner}
            index={index}
            banners={banners}
            setBanners={setBanners}
            previewUrlsRef={previewUrlsRef}
            setSelectedImage={setSelectedImage}
            onRemove={() => openDeleteModal(index)}
            onSave={handleSaveBanner}
            onReload={loadBanners}
            onToggleEdit={() => toggleEditMode(index)}
            onMoveUp={() => moveBannerUp(index)}
            onMoveDown={() => moveBannerDown(index)}
            onUpdateOrder={(newOrder) => updateBannerOrder(index, newOrder)}
            showToast={showToast}
          />
        ))}
      </div>

      {banners.length === 0 && !loading && (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <i className="fas fa-image text-3xl sm:text-4xl text-gray-400 mb-3 sm:mb-4"></i>
          <p className="text-gray-500 text-base sm:text-lg">No banners created yet</p>
          <button
            onClick={handleAddBanner}
            className="mt-3 sm:mt-4 bg-black text-white px-3 sm:px-4 py-2 hover:bg-gray-800 transition-colors text-sm sm:text-base rounded-md"
          >
            Create Your First Banner
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white text-gray-800 p-1 sm:p-2 hover:bg-gray-200 transition-colors rounded-full"
            >
              <i className="fas fa-times text-sm sm:text-base"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Combined Banner Card with Edit/Save functionality
const BannerCard = ({ 
  banner, 
  index, 
  banners, 
  setBanners, 
  previewUrlsRef, 
  setSelectedImage, 
  onRemove,
  onSave,
  onReload,
  onToggleEdit,
  onMoveUp,
  onMoveDown,
  onUpdateOrder,
  showToast
}) => {
  const [isActive, setIsActive] = useState(banner.isActive !== false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleBannerImageChange = async (index, file) => {
    if (!file) return;

    try {
      // Validate and optimize image
      const optimizedFile = await optimizeImageUpload(file);
      
      const updated = [...banners];

      // Remove old preview if exists
      const old = updated[index]?.imagePreview;
      if (old && old.startsWith('blob:')) {
        URL.revokeObjectURL(old);
        previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== old);
      }

      // Create new preview
      const preview = URL.createObjectURL(optimizedFile);
      previewUrlsRef.current.push(preview);

      updated[index] = {
        ...updated[index],
        imageFile: optimizedFile,
        imagePreview: preview,
      };

      setBanners(updated);
      
    } catch (error) {
      showToast(`Image error: ${error.message}`, 'error');
    }
  };

  const removeBannerImage = (index) => {
    const updated = [...banners];
    const old = updated[index]?.imagePreview;
    if (old && old.startsWith('blob:')) {
      URL.revokeObjectURL(old);
      previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== old);
    }

    updated[index] = {
      ...updated[index],
      imageFile: null,
      imagePreview: "",
    };

    setBanners(updated);
  };

  const handleActiveToggle = (checked) => {
    setIsActive(checked);
    const updated = [...banners];
    updated[index].isActive = checked;
    setBanners(updated);
  };

  const handleSaveSingle = async () => {
    try {
      setSaving(true);
      setIsUploading(true);
      setUploadProgress(0);
      
      if (typeof onSave !== 'function') {
        throw new Error('Save function is not available');
      }
      
      const result = await onSave(banner, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      });
      
      if (result && result.data) {
        const updated = [...banners];
        updated[index] = {
          ...result.data,
          imagePreview: result.data.imageUrl,
          imageFile: null,
          isEditing: false
        };
        setBanners(updated);
        
        setLastSaved(new Date());
        showToast('Banner saved successfully', 'success');
        
        if (onReload) {
          setTimeout(onReload, 1000);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      showToast('Error saving banner: ' + error.message, 'error');
    } finally {
      setSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const hasUnsavedChanges = () => {
    if (!banner._id) {
      return banner.headingLine1 || banner.headingLine2 || banner.subtext || banner.buttonText || banner.redirectUrl || banner.imageFile;
    }
    return false;
  };

  return (
    <div className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 md:p-5 border-b border-gray-200 gap-3 sm:gap-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Order: {banner.order}</span>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="bg-gray-200 text-gray-700 p-1 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs rounded"
              >
                <i className="fas fa-chevron-up"></i>
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === banners.length - 1}
                className="bg-gray-200 text-gray-700 p-1 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs rounded"
              >
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => handleActiveToggle(e.target.checked)}
              className="border-gray-300 text-indigo-600 focus:ring-indigo-500 rounded"
            />
            <span className="text-xs sm:text-sm text-gray-600">Active</span>
          </label>
          
          {/* Status Badges */}
          <div className="flex gap-1 sm:gap-2">
            {banner._id && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 flex items-center gap-1 rounded-full">
                <i className="fas fa-check"></i>
                Saved
              </span>
            )}
            {hasUnsavedChanges() && banner.isEditing && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 flex items-center gap-1 rounded-full">
                <i className="fas fa-edit"></i>
                Unsaved
              </span>
            )}
            {lastSaved && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 hidden sm:block rounded-full">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={banner.isEditing ? handleSaveSingle : onToggleEdit}
            disabled={saving}
            className={`flex-1 sm:flex-none flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-2 transition-colors rounded-md ${
              banner.isEditing 
                ? 'bg-black text-white hover:bg-gray-800 disabled:opacity-50' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : banner.isEditing ? 'fa-save' : 'fa-edit'}`}></i>
            {saving ? 'Saving...' : banner.isEditing ? 'Save' : 'Edit'}
          </button>
          <button
            onClick={onRemove}
            className="flex-1 sm:flex-none flex items-center gap-1 text-xs sm:text-sm bg-red-600 text-white px-2 sm:px-3 py-2 hover:bg-red-700 transition-colors rounded-md"
          >
            <i className="fas fa-trash-alt"></i>
            Delete
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-5">
        {banner.isEditing ? (
          /* Edit Mode */
          <>
            {/* Image Upload */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image {!banner.imageUrl && <span className="text-red-500">*</span>}
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="relative flex-1 w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-gray-300 cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center justify-center pt-4 pb-5 sm:pt-5 sm:pb-6">
                      <i className="fas fa-cloud-upload-alt text-xl sm:text-3xl text-gray-400 mb-1 sm:mb-2"></i>
                      <p className="text-xs sm:text-sm text-gray-500">Click to upload an image</p>
                      <p className="text-xs text-gray-400 mt-1 hidden sm:block">Max 5MB, JPEG/PNG/WebP</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBannerImageChange(index, file);
                      }}
                    />
                  </label>
                </div>

                {(banner.imagePreview || banner.imageUrl) && (
                  <div className="relative group flex-shrink-0">
                    <img
                      src={banner.imagePreview || banner.imageUrl}
                      alt={`Banner ${index + 1} Preview`}
                      className="h-24 sm:h-32 w-32 sm:w-48 object-cover border-2 border-gray-200 cursor-pointer shadow-sm rounded-lg"
                      onClick={() => setSelectedImage(banner.imagePreview || banner.imageUrl)}
                    />
                    <button
                      onClick={() => removeBannerImage(index)}
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white p-1 text-xs hover:bg-red-700 transition-colors shadow-md rounded-full"
                    >
                      <i className="fas fa-times w-2 h-2 sm:w-3 sm:h-3"></i>
                    </button>
                    {banner.imageUrl && !banner.imageFile && (
                      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black bg-opacity-50 text-white text-xs px-1 sm:px-2 py-1 rounded">
                        From DB
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Text Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {[
                { 
                  label: "Order Number", 
                  field: "order", 
                  icon: "fas fa-sort-numeric-down", 
                  placeholder: "0",
                  type: "number",
                  required: true
                },
                { 
                  label: "Heading Line 1", 
                  field: "headingLine1", 
                  icon: "fas fa-heading", 
                  placeholder: "First line of heading",
                  required: true
                },
                { 
                  label: "Heading Line 2", 
                  field: "headingLine2", 
                  icon: "fas fa-heading", 
                  placeholder: "Second line of heading",
                  required: true
                },
                { 
                  label: "Subtext", 
                  field: "subtext", 
                  icon: "fas fa-text-height", 
                  placeholder: "Banner description text",
                  type: "textarea"
                },
                { 
                  label: "Button Text", 
                  field: "buttonText", 
                  icon: "fas fa-mouse-pointer", 
                  placeholder: "Shop Now" 
                },
                { 
                  label: "Redirect URL", 
                  field: "redirectUrl", 
                  icon: "fas fa-link", 
                  placeholder: "/shop or /collection" 
                }
              ].map((item) => (
                <div key={item.field} className={item.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <i className={`${item.icon} absolute left-3 top-2 sm:top-3 text-gray-400 text-sm sm:text-base`}></i>
                    {item.type === "textarea" ? (
                      <textarea
                        placeholder={item.placeholder}
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none text-sm sm:text-base rounded-md"
                        rows={2}
                        value={banner[item.field] || ""}
                        onChange={(e) => {
                          const updated = [...banners];
                          updated[index][item.field] = e.target.value;
                          setBanners(updated);
                        }}
                      />
                    ) : item.type === "number" ? (
                      <input
                        type="number"
                        placeholder={item.placeholder}
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm sm:text-base rounded-md"
                        value={banner[item.field] || 0}
                        min="0"
                        onChange={(e) => {
                          const newOrder = parseInt(e.target.value) || 0;
                          onUpdateOrder(newOrder);
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={item.placeholder}
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 sm:py-2 border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm sm:text-base rounded-md"
                        value={banner[item.field] || ""}
                        onChange={(e) => {
                          const updated = [...banners];
                          updated[index][item.field] = e.target.value;
                          setBanners(updated);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* View Mode - Updated with HeroSection styling */
          <div className="flex flex-col gap-4">
            {/* Banner Preview with HeroSection styling */}
            <div className="relative">
              {/* Dark overlay */}
              <div className=" absolute inset-0 bg-black bg-opacity-40 z-10 rounded-3xl"></div>
              
              {/* Main Image */}
              <img
                src={banner.imagePreview || banner.imageUrl}
                alt="Banner Preview"
                className=" w-full h-[90vh] object-cover rounded-3xl"
                loading="eager"
                decoding="sync"
                width={1920}
                height={1080}
              />
              
              {/* Content */}
              <div className="absolute inset-0 z-20 flex flex-col items-center -translate-y-10 justify-center text-center text-white px-4">
                <div>
                  {/* Headline */}
                  <h1 className="lg:text-8xl text-7xl font-bold mb-6 uppercase">
                    {banner.headingLine1 || "Your Banner Heading"}
                    {banner.headingLine2 && (
                      <> <span className="font-bold">{banner.headingLine2}</span></>
                    )}
                  </h1>
                
                  {/* Subtext */}
                  {banner.subtext && (
                    <p className="text-xl md:text-2xl font-light max-w-3xl leading-relaxed">
                      {banner.subtext}
                    </p>
                  )}

                  {/* Button */}
                  {banner.buttonText && banner.redirectUrl && (
                    <div className="mt-8">
                      <Link
                        to={banner.redirectUrl}
                        className="inline-flex items-center gap-3 px-8 py-4 text-white border border-white/50 rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/80 group"
                        aria-label={banner.buttonText}
                      >
                        <span className="text-sm font-medium tracking-wider uppercase">
                          {banner.buttonText}
                        </span>
                        <IoIosArrowForward size={14} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Banner Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium">Order:</span>
                    <p className="text-gray-600">{banner.order}</p>
                  </div>
                  <div>
                    <span className="font-medium">Heading 1:</span>
                    <p className="text-gray-600">{banner.headingLine1 || "Not set"}</p>
                  </div>
                  {banner.headingLine2 && (
                    <div>
                      <span className="font-medium">Heading 2:</span>
                      <p className="text-gray-600">{banner.headingLine2}</p>
                    </div>
                  )}
                  {banner.subtext && (
                    <div className="sm:col-span-2">
                      <span className="font-medium">Subtext:</span>
                      <p className="text-gray-600">{banner.subtext}</p>
                    </div>
                  )}
                  {banner.buttonText && (
                    <div>
                      <span className="font-medium">Button Text:</span>
                      <p className="text-gray-600">{banner.buttonText}</p>
                    </div>
                  )}
                  {banner.redirectUrl && (
                    <div>
                      <span className="font-medium">Redirect URL:</span>
                      <p className="text-gray-600">{banner.redirectUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Info */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>{banner.isEditing ? "Edit mode - Make changes and click Save" : "View mode - Click Edit to modify this banner"}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Banner Display Component for Website - Updated with HeroSection styling
export const BannerDisplay = ({ banners = [] }) => {
  const [activeBanners, setActiveBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Load active banners from backend if not provided
  useEffect(() => {
    const loadActiveBanners = async () => {
      if (banners.length === 0) {
        try {
          setLoading(true);
          const response = await api.get('/api/banners/active');
          if (response.data.success) {
            const sortedBanners = response.data.data.sort((a, b) => a.order - b.order);
            setActiveBanners(sortedBanners);
          }
        } catch (error) {
          console.error('Error loading active banners:', error);
        } finally {
          setLoading(false);
        }
      } else {
        const sortedBanners = banners
          .filter(banner => banner.isActive !== false)
          .sort((a, b) => a.order - b.order);
        setActiveBanners(sortedBanners);
      }
    };

    loadActiveBanners();
  }, [banners]);

  // Auto-rotate banners if multiple active
  useEffect(() => {
    if (activeBanners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeBanners.length]);

  if (loading) {
    return (
      <div className="relative">
        <div className=" absolute inset-0 bg-black bg-opacity-40 z-10 rounded-3xl"></div>
        <div className=" w-full h-[90vh] object-cover rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
        
        <div className="absolute inset-0 z-20 flex flex-col items-center -translate-y-10 justify-center text-center text-white px-4">
          <div className="h-20 bg-white/10 animate-pulse rounded-full mb-6 w-96 mx-auto"></div>
          <div className="h-6 bg-white/10 animate-pulse rounded-full w-80 mx-auto mt-4"></div>
          <div className="h-12 bg-white/10 animate-pulse rounded-full w-40 mx-auto mt-8"></div>
        </div>
      </div>
    );
  }

  if (activeBanners.length === 0) {
    return (
      <div className="relative">
        <div className=" absolute inset-0 bg-black bg-opacity-40 z-10 rounded-3xl"></div>
        <div className=" w-full h-[90vh] object-cover rounded-3xl bg-gradient-to-r from-gray-100 to-gray-200"></div>
        
        <div className="absolute inset-0 z-20 flex flex-col items-center -translate-y-10 justify-center text-center text-gray-600 px-4">
          <div>
            <p className="text-xl font-medium mb-4">No active banners available</p>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[currentBannerIndex];

  return (
    <div className="relative w-full overflow-hidden" aria-label="Featured banners">
      {/* Single Banner Display with HeroSection styling */}
      <div className="relative">
        {/* Dark overlay */}
        <div className=" absolute inset-0 bg-black bg-opacity-40 z-10 rounded-3xl"></div>
        
        {/* Background Image */}
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.headingLine1 || "Banner"}
          className=" w-full h-[90vh] object-cover rounded-3xl"
          loading="eager"
          decoding="sync"
          width={1920}
          height={1080}
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center -translate-y-10 justify-center text-center text-white px-4">
          <div>
            {/* Headline */}
            <h1 className="lg:text-8xl text-7xl font-bold mb-6 uppercase">
              {currentBanner.headingLine1}
              {currentBanner.headingLine2 && (
                <> <span className="font-bold">{currentBanner.headingLine2}</span></>
              )}
            </h1>
          
            {/* Subtext */}
            {currentBanner.subtext && (
              <p className="text-xl md:text-2xl font-light max-w-3xl leading-relaxed">
                {currentBanner.subtext}
              </p>
            )}

            {/* Button */}
            {currentBanner.buttonText && currentBanner.redirectUrl && (
              <div className="mt-8">
                <Link
                  to={currentBanner.redirectUrl}
                  className="inline-flex items-center gap-3 px-8 py-4 text-white border border-white/50 rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/80 group"
                  aria-label={`${currentBanner.buttonText} - ${currentBanner.headingLine1}`}
                >
                  <span className="text-sm font-medium tracking-wider uppercase">
                    {currentBanner.buttonText}
                  </span>
                  <IoIosArrowForward size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Dots for multiple banners */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`w-2 h-2 transition-all duration-300 rounded-full ${
                index === currentBannerIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCard;