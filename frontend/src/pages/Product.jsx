import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProduct from '../components/RelatedProduct';
import LoginModal from '../components/Login'; // Add this import
import { 
  FaStar, 
  FaStarHalf, 
  FaRegStar, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaTimes, 
  FaUserShield, 
  FaShoppingCart, 
  FaPlus, 
  FaMinus,
  FaFlask,
  FaInfoCircle,
  FaCheckCircle,
  FaLeaf,
  FaShippingFast,
  FaShieldAlt,
  FaHeart,
  FaTruck,
  FaBoxOpen,
  FaSeedling,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Product = () => {
  const { productId } = useParams();
  const { 
    products, 
    currency, 
    addToCart, 
    user, 
    token, 
    backendUrl,   
    getCartAmount, 
    isFreeDeliveryAvailable,
    getAmountForFreeDelivery 
  } = useContext(ShopContext);
  
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [filterRating, setFilterRating] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  
  // Login Modal State - Add this
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // New state for category data - USING EXACT SAME LOGIC AS COLLECTION
  const [backendCategories, setBackendCategories] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [subcategoryIdMap, setSubcategoryIdMap] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // Use the same backend URL logic as Collection
  const backendURL = import.meta.env.VITE_BACKEND_URL || backendUrl;

  const addToCartCalledRef = useRef(false);

  // Fetch categories from backend - EXACT COPY FROM COLLECTION
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

        // Create mapping from IDs to names - EXACT COPY FROM COLLECTION
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
        setCategoriesError(null);
        
      } catch (error) {
        setCategoriesError(error.message);
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
        setLoadingCategories(false);
      }
    };

    if (backendURL) {
      fetchCategories();
    } else {
      setCategoriesError('Backend URL configuration missing');
      setLoadingCategories(false);
    }
  }, [backendURL, products]);

  // Helper functions - EXACT COPY FROM COLLECTION
  const getCategoryName = useCallback((categoryId) => {
    return categoryIdMap[categoryId] || categoryId;
  }, [categoryIdMap]);

  const getSubcategoryName = useCallback((subcategoryId) => {
    return subcategoryIdMap[subcategoryId] || subcategoryId;
  }, [subcategoryIdMap]);

  // Memoized email masking function
  const maskEmail = useCallback((email) => {
    if (!email || typeof email !== 'string') return 'Unknown User';
    
    if (email.includes('***@') || !email.includes('@')) return email;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return email;
    
    const [localPart, domain] = email.split('@');
    
    if (localPart.length === 1) {
      return `${localPart}***@${domain}`;
    }
    
    const firstChar = localPart[0];
    const maskedLocalPart = firstChar + '***';
    
    return `${maskedLocalPart}@${domain}`;
  }, []);

  // Update the fetchProductDetails function in Product.jsx
  const fetchProductDetails = useCallback(async (productId) => {
    if (!productId || !backendURL) return null;
    
    setLoadingProductDetails(true);
    try {
      const response = await fetch(`${backendURL}/api/product/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: productId })
      });
      
      if (response.ok) {
        const data = await response.json();
        // The single endpoint returns { success: true, product: {...} }
        return data.product;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    } finally {
      setLoadingProductDetails(false);
    }
  }, [backendURL]);

  // Memoized fetch reviews function
  const fetchProductReviews = useCallback(async (productId) => {
    if (!productId || !backendURL) {
      return;
    }

    setLoadingReviews(true);
    try {
      const response = await fetch(`${backendURL}/api/comments?productId=${productId}`);
      
      if (response.ok) {
        const comments = await response.json();
        
        const productReviews = comments.map(comment => ({
          id: comment._id,
          rating: comment.rating,
          comment: comment.content,
          images: comment.reviewImages?.map(img => img.url) || [],
          date: new Date(comment.date).toLocaleDateString(),
          author: comment.email,
          likes: comment.likes || 0,
          dislikes: comment.dislikes || 0,
          likedBy: comment.likedBy?.map(user => user._id || user) || [],
          dislikedBy: comment.dislikedBy?.map(user => user._id || user) || [],
          hasReply: comment.hasReply || false,
          reply: comment.reply ? {
            id: comment.reply._id || 'reply-' + comment._id,
            content: comment.reply.content,
            author: comment.reply.author || 'Admin',
            isAdmin: true,
            date: new Date(comment.reply.date).toLocaleDateString()
          } : null
        }));
        
        setReviews(productReviews);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      toast.error('Error loading reviews');
    } finally {
      setLoadingReviews(false);
    }
  }, [backendURL]);

  // Fetch product data and reviews
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    if (!productId) {
      setError('Product ID not found');
      setLoading(false);
      return;
    }

    if (!products || products.length === 0) {
      setLoading(false);
      return;
    }

    const product = products.find((item) => item._id === productId);

    if (product) {
      setProductData(product);
      setImage(product.image?.[0] || '');
      setError(null);
      
      // Fetch additional details
      fetchProductDetails(productId).then(details => {
        if (details) {
          // Merge additional details with existing product data
          setProductData(prev => ({
            ...prev,
            ingredients: details.ingredients || [],
            benefits: details.benefits || [],
            howToUse: details.howToUse || '',
            // Preserve other fields
            ...(details.quantity !== undefined && { quantity: details.quantity }),
            ...(details.status !== undefined && { status: details.status }),
            ...(details.bestseller !== undefined && { bestseller: details.bestseller }),
          }));
        }
      });
      
      fetchProductReviews(productId);
    } else {
      setError('Product not found');
    }
    setLoading(false);
  }, [productId, products, fetchProductReviews, fetchProductDetails]);

  const stock = productData ? productData.quantity : 0;

  // Get category and subcategory names using the helper functions
  const categoryName = useMemo(() => {
    if (!productData?.category) return null;
    return getCategoryName(productData.category);
  }, [productData, getCategoryName]);

  const subcategoryName = useMemo(() => {
    if (!productData?.subcategory) return null;
    return getSubcategoryName(productData.subcategory);
  }, [productData, getSubcategoryName]);

  // Monitor stock and adjust quantity if needed
  useEffect(() => {
    if (quantity > stock) {
      setQuantity(Math.max(1, stock));
    }
  }, [stock, quantity]);

  // Memoized stock status renderer
  const renderStockStatus = useCallback(() => {
    if (stock === 0) {
      return (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <span className="font-semibold text-red-700">Out of Stock</span>
              <p className="text-sm text-red-600 mt-1">We'll restock soon. Check back later!</p>
            </div>
          </div>
        </div>
      );
    } else if (stock < 5) {
      return (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <span className="font-semibold text-red-700">Only {stock} left in stock</span>
              <p className="text-sm text-red-600 mt-1">Limited quantity available. Order now!</p>
            </div>
          </div>
        </div>
      );
    } else if (stock < 10) {
      return (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <div>
              <span className="font-semibold text-orange-700">{stock} items available</span>
              <p className="text-sm text-orange-600 mt-1">Stock is running low</p>
            </div>
          </div>
        </div>
      );
    } else if (stock < 20) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <span className="font-semibold text-yellow-700">Good Stock Available</span>
              <p className="text-sm text-yellow-600 mt-1">{stock} items ready to ship</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <span className="font-semibold text-green-700">In Stock & Ready to Ship</span>
              <p className="text-sm text-green-600 mt-1">Order now for quick delivery</p>
            </div>
          </div>
        </div>
      );
    }
  }, [stock]);



  const incrementQuantity = useCallback(() => {
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    }
  }, [quantity, stock]);

 const decrementQuantity = useCallback(() => {
  if (quantity > 1) {
    setQuantity(prev => prev - 1);
  } else {
    // Prevent quantity from going below 1
    toast.info("Minimum quantity is 1");
    // Optional: Reset to 1 if somehow it's already below
    if (quantity < 1) {
      setQuantity(1);
    }
  }
}, [quantity]);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imageData = files.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setReviewImages((prevImages) => [...prevImages, ...imageData]);
    }
  }, []);

  const removeReviewImage = useCallback((index) => {
    if (reviewImages[index]?.url) {
      URL.revokeObjectURL(reviewImages[index].url);
    }
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  }, [reviewImages]);

  const handleSubmitReview = useCallback(async () => {
    if (!user || !user._id) {
      toast.error('Please login to submit a review');
      setIsLoginModalOpen(true);
      setAuthMode('login');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      toast.error('Please write a review comment');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('targetType', 'product');
      formData.append('productId', productId);
      formData.append('userId', user._id);
      formData.append('content', comment);
      formData.append('rating', rating);

      reviewImages.forEach((imageData, index) => {
        formData.append('reviewImages', imageData.file);
      });

      const currentToken = token || localStorage.getItem('token');
      
      const response = await fetch(`${backendURL}/api/comments`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.ok) {
        const newComment = await response.json();
        
        const newReview = {
          id: newComment._id,
          rating: newComment.rating,
          comment: newComment.content,
          images: newComment.reviewImages?.map(img => img.url) || [],
          date: new Date(newComment.date).toLocaleDateString(),
          author: newComment.email,
          likes: newComment.likes || 0,
          dislikes: newComment.dislikes || 0,
          likedBy: newComment.likedBy?.map(user => user._id || user) || [],
          dislikedBy: newComment.dislikedBy?.map(user => user._id || user) || [],
          hasReply: newComment.hasReply || false,
          reply: newComment.reply ? {
            id: newComment.reply._id || 'reply-' + newComment._id,
            content: newComment.reply.content,
            author: newComment.reply.author || 'Admin',
            isAdmin: true,
            date: new Date(newComment.reply.date).toLocaleDateString()
          } : null
        };

        setReviews((prevReviews) => [newReview, ...prevReviews]);
        setRating(0);
        setComment('');
        reviewImages.forEach(image => URL.revokeObjectURL(image.url));
        setReviewImages([]);
        
        toast.success('Review submitted successfully!');
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      toast.error('Error submitting review');
    } finally {
      setUploading(false);
    }
  }, [user, rating, comment, reviewImages, productId, token, backendURL]);

  const getUserInteractionStatus = useCallback((review) => {
    if (!user || !user._id) return { hasLiked: false, hasDisliked: false };
    
    const hasLiked = review.likedBy?.includes(user._id) || false;
    const hasDisliked = review.dislikedBy?.includes(user._id) || false;
    
    return { hasLiked, hasDisliked };
  }, [user]);

  const handleLikeReview = useCallback(async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to like reviews');
      setIsLoginModalOpen(true);
      setAuthMode('login');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasLiked, hasDisliked } = getUserInteractionStatus(review);

      let endpoint = '';
      let method = 'PATCH';

      if (hasLiked) {
        endpoint = 'remove-like';
      } else if (hasDisliked) {
        endpoint = 'like';
      } else {
        endpoint = 'like';
      }

      const response = await fetch(`${backendURL}/api/comments/${reviewId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews => 
          prevReviews.map(review => {
            if (review.id === reviewId) {
              const updatedReview = { ...review };
              
              if (hasLiked) {
                updatedReview.likes = Math.max(0, (review.likes || 0) - 1);
                updatedReview.likedBy = (review.likedBy || []).filter(id => id !== user._id);
              } else if (hasDisliked) {
                updatedReview.likes = (review.likes || 0) + 1;
                updatedReview.dislikes = Math.max(0, (review.dislikes || 0) - 1);
                updatedReview.likedBy = [...(review.likedBy || []), user._id];
                updatedReview.dislikedBy = (review.dislikedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.likes = (review.likes || 0) + 1;
                updatedReview.likedBy = [...(review.likedBy || []), user._id];
              }
              
              return updatedReview;
            }
            return review;
          })
        );
      } else {
        toast.error('Failed to update like');
      }
    } catch (error) {
      toast.error('Error updating like');
    }
  }, [user, token, backendURL, reviews, getUserInteractionStatus]);

  const handleDislikeReview = useCallback(async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to dislike reviews');
      setIsLoginModalOpen(true);
      setAuthMode('login');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasLiked, hasDisliked } = getUserInteractionStatus(review);

      let endpoint = '';
      let method = 'PATCH';

      if (hasDisliked) {
        endpoint = 'remove-dislike';
      } else if (hasLiked) {
        endpoint = 'dislike';
      } else {
        endpoint = 'dislike';
      }

      const response = await fetch(`${backendURL}/api/comments/${reviewId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews => 
          prevReviews.map(review => {
            if (review.id === reviewId) {
              const updatedReview = { ...review };
              
              if (hasDisliked) {
                updatedReview.dislikes = Math.max(0, (review.dislikes || 0) - 1);
                updatedReview.dislikedBy = (review.dislikedBy || []).filter(id => id !== user._id);
              } else if (hasLiked) {
                updatedReview.likes = Math.max(0, (review.likes || 0) - 1);
                updatedReview.dislikes = (review.dislikes || 0) + 1;
                updatedReview.dislikedBy = [...(review.dislikedBy || []), user._id];
                updatedReview.likedBy = (review.likedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.dislikes = (review.dislikes || 0) + 1;
                updatedReview.dislikedBy = [...(review.dislikedBy || []), user._id];
              }
              
              return updatedReview;
            }
            return review;
          })
        );
      } else {
        toast.error('Failed to update dislike');
      }
    } catch (error) {
      toast.error('Error updating dislike');
    }
  }, [user, token, backendURL, reviews, getUserInteractionStatus]);

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const toggleShowAllReviews = useCallback(() => {
    setShowAllReviews((prev) => !prev);
  }, []);

  const filterReviewsByRating = useCallback((rating) => {
    if (filterRating === rating) {
      setFilterRating(null);
    } else {
      setFilterRating(rating);
    }
  }, [filterRating]);

  // Memoized rating calculations
  const { averageRating, ratingBreakdown } = useMemo(() => {
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => review.rating === star).length,
    }));

    return { averageRating: avgRating, ratingBreakdown: breakdown };
  }, [reviews]);

  const filteredReviews = useMemo(() => 
    filterRating
      ? reviews.filter((review) => review.rating === filterRating)
      : reviews
  , [reviews, filterRating]);

  const displayedReviews = useMemo(() => 
    showAllReviews ? filteredReviews : filteredReviews.slice(0, 10)
  , [showAllReviews, filteredReviews]);

  // Memoized rating renderer
  const renderRating = useCallback((ratingValue = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStar />
          </span>
        );
      } else if (i - 0.5 <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf />
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar />
          </span>
        );
      }
    }
    return stars;
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (isAddingToCart || addToCartCalledRef.current) {
      return;
    }

    if (stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    const finalQuantity = Math.min(quantity, stock);
    
    if (finalQuantity !== quantity) {
      setQuantity(finalQuantity);
      toast.info(`Quantity adjusted to available stock: ${finalQuantity}`);
    }
    
    setIsAddingToCart(true);
    addToCartCalledRef.current = true;

    try {
      // Get current cart amount BEFORE adding the product
      const currentCartAmount = getCartAmount?.() || 0;
      
      // Calculate the amount this product will add
      const productAmount = (productData.discountprice || productData.price) * finalQuantity;
      
      // Calculate total amount after adding this product
      const totalAmountAfterAdd = currentCartAmount + productAmount;
      
      addToCart(productData._id, finalQuantity);
      
      // Use our calculated amount instead of calling getCartAmount again
      const isFreeDelivery = isFreeDeliveryAvailable?.(totalAmountAfterAdd) || false;
      const amountNeeded = getAmountForFreeDelivery?.(totalAmountAfterAdd) || 0;
      
      // Show professional delivery message
      if (isFreeDelivery) {
        // Free delivery achieved
        toast.success(
          <div className="flex items-center gap-2">
            <FaShippingFast className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-800">Your FREE delivery! 🎉</div>
            </div>
          </div>,
          {
            autoClose: 4000,
            className: 'bg-green-50 border border-green-200',
            progressClassName: 'bg-green-500'
          }
        );
      } else if (amountNeeded > 0) {
        // Need more for free delivery
        toast.success(
          <div>
            <div className="text-red-600 font-medium text-sm mt-1">
              Add <strong>{currency} {amountNeeded.toFixed(2)}</strong> more for FREE delivery
            </div>
          </div>,
          {
            autoClose: 5000,
            className: 'bg-white border border-red-200',
            progressClassName: 'bg-red-500'
          }
        );
      } else {
        // Regular success message
        toast.success(
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="font-semibold">Product added to cart</div>
          </div>,
          {
            autoClose: 3000,
            className: 'bg-green-50 border border-green-200',
            progressClassName: 'bg-green-500'
          }
        );
      }
      
      setQuantity(1);
    
    } catch (error) {
      toast.error('Failed to add product to cart');
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
        addToCartCalledRef.current = false;
      }, 1000);
    }
  }, [isAddingToCart, stock, quantity, productData, getCartAmount, getAmountForFreeDelivery, isFreeDeliveryAvailable, currency]);

  const renderClickableStars = useCallback((currentRating, setRatingFunc) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className="cursor-pointer text-yellow-400 text-xl transition-transform hover:scale-110"
          onClick={() => setRatingFunc(i)}
          aria-label={`Rate ${i} stars`}
        >
          {i <= currentRating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  }, []);

  // Memoized product calculations
  const { hasDiscount, actualPrice, originalPrice, discountPercentage } = useMemo(() => {
    const hasDisc = productData?.discountprice !== undefined && 
                   productData?.discountprice !== null && 
                   productData?.discountprice !== productData?.price;
    
    const actual = hasDisc ? productData?.discountprice : productData?.price;
    const original = hasDisc ? productData?.price : null;
    const discountPct = hasDisc 
      ? Math.round(((productData?.price - productData?.discountprice) / productData?.price) * 100)
      : null;

    return {
      hasDiscount: hasDisc,
      actualPrice: actual,
      originalPrice: original,
      discountPercentage: discountPct
    };
  }, [productData]);

  // Helper function to ensure ingredients is an array
  const getIngredientsArray = useCallback(() => {
    if (!productData?.ingredients) return [];
    
    if (Array.isArray(productData.ingredients)) {
      return productData.ingredients.filter(ing => ing && ing.trim() !== '');
    }
    
    if (typeof productData.ingredients === 'string') {
      return productData.ingredients
        .split(',')
        .map(ing => ing.trim())
        .filter(ing => ing !== '');
    }
    
    return [];
  }, [productData]);

  // Helper function to ensure benefits is an array
  const getBenefitsArray = useCallback(() => {
    if (!productData?.benefits) return [];
    
    if (Array.isArray(productData.benefits)) {
      return productData.benefits.filter(benefit => benefit && benefit.trim() !== '');
    }
    
    if (typeof productData.benefits === 'string') {
      return productData.benefits
        .split(',')
        .map(benefit => benefit.trim())
        .filter(benefit => benefit !== '');
    }
    
    return [];
  }, [productData]);

  // Helper function to get howToUse text
  const getHowToUseText = useCallback(() => {
    if (!productData?.howToUse) return '';
    
    return productData.howToUse;
  }, [productData]);

  // Memoized error state
  const ErrorState = useMemo(() => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-red-600">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Product Not Found</h1>
        <p className="text-gray-600 mb-8 text-lg">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-300 w-full"
        >
          Go Back
        </button>
      </div>
    </div>
  ), [error]);

  // Memoized loading state
  const LoadingState = useMemo(() => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg">Loading product details...</p>
      </div>
    </div>
  ), []);

  if (error) return ErrorState;
  if (loading || !productData) return LoadingState;

  const ingredientsList = getIngredientsArray();
  const benefitsList = getBenefitsArray();
  const howToUseText = getHowToUseText();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Product Header */}
        <div className="mb-6 md:mb-12 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 break-words">{productData.name}</h1>
          
          {/* Category and Subcategory Display - USING THE HELPER FUNCTIONS */}
          <div className="my-3 md:my-4 flex justify-center gap-1 flex-wrap">
            {categoryName && (
              <span className="text-black text-base sm:text-lg font-medium">
                {categoryName}
              </span>
            )}
            {subcategoryName && (
              <span className="text-gray-500 text-base sm:text-lg font-medium">
                ({subcategoryName})
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto">
            Pure, natural goodness for your well-being
          </p>
        </div>

        {/* Product Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 md:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Image Gallery */}
            <div className="space-y-4 md:space-y-6">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden">
                {discountPercentage && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {discountPercentage}% OFF
                  </div>
                )}
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] ">
                  <img
                    src={image || productData.image?.[0]}
                    alt={productData.name}
                    className="w-full h-auto max-w-full object-contain rounded-2xl"
                    style={{ 
                      maxHeight: '500px',
                      width: 'auto',
                      height: 'auto'
                    }}
                    loading="eager"
                    decoding="sync"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500?text=Product+Image';
                    }}
                  />
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {productData.image?.map((item, index) => (
                  <img
                    key={index}
                    src={item}
                    alt={`${productData.name} thumbnail ${index + 1}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg cursor-pointer border-2 transition-all duration-300 flex-shrink-0 ${
                      image === item ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setImage(item)}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=Image';
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6 md:space-y-8">
              {/* Rating */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                <div className="flex items-center gap-1 md:gap-2">
                  {renderRating(averageRating)}
                  <span className="ml-1 md:ml-2 text-lg sm:text-xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-gray-600 text-sm sm:text-base">{reviews.length} customer reviews</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {currency} {actualPrice.toFixed(2)}
                </span>
                {originalPrice && (
                  <>
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      {currency} {originalPrice.toFixed(2)}
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-full text-xs sm:text-sm">
                      Save {currency} {(originalPrice - actualPrice).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="prose prose-sm max-w-none text-gray-700 mb-4 md:mb-6">
                  <p className="text-sm sm:text-base">{productData.description}</p>
                </div>
              </div>

              {/* Stock Status */}
              {renderStockStatus()}

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2 md:mb-3">Quantity:</p>
                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1 || stock === 0}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                    <span className="w-12 sm:w-16 text-center text-lg sm:text-xl font-bold">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= stock || stock === 0}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={stock === 0 || isAddingToCart}
                  className={`mt-4 md:mt-6 flex items-center justify-center gap-2 py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto ${
                    stock === 0 || isAddingToCart
                      ? 'bg-gray-400 cursor-not-allowed text-white hover:bg-gray-400 hover:text-white hover:border-transparent hover:scale-100'
                      : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl transform hover:-translate-y-1'
                  }`}
                  aria-label={stock === 0 ? 'Out of stock' : 'Add to cart'}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">Adding to Cart...</span>
                    </div>
                  ) : stock === 0 ? (
                    'Out of Stock'
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      <span className="text-sm sm:text-base">Add to Cart</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Delivery Info */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <FaTruck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Free Delivery Available</p>
                    <p className="text-xs sm:text-sm text-gray-600">Add more items to qualify for free shipping</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8 md:mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-thin">
              <button
                className={`px-4 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'description'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                className={`px-4 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'ingredients'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('ingredients')}
              >
                Ingredients
              </button>
              <button
                className={`px-4 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'howtouse'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('howtouse')}
              >
                How to Use
              </button>
              <button
                className={`px-4 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'benefits'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('benefits')}
              >
                Benefits
              </button>
              <button
                className={`px-4 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'reviews'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="space-y-6 md:space-y-8">
                <div className="prose prose-sm sm:prose max-w-none">
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">{productData.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-6 md:space-y-8">
                {loadingProductDetails ? (
                  <div className="text-center py-8 md:py-12">
                    <FaSpinner className="animate-spin w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">Loading ingredients...</p>
                  </div>
                ) : ingredientsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {ingredientsList.map((ingredient, index) => (
                      <div key={index} className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{ingredient}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">100% natural ingredient</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-2xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <FaFlask className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No Ingredients Listed</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Ingredients information is not available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'howtouse' && (
              <div className="space-y-6 md:space-y-8">
                {loadingProductDetails ? (
                  <div className="text-center py-8 md:py-12">
                    <FaSpinner className="animate-spin w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">Loading usage instructions...</p>
                  </div>
                ) : howToUseText ? (
                  <div className="prose prose-sm sm:prose max-w-none">
                    <div className="text-gray-700 whitespace-pre-line text-sm sm:text-base md:text-lg leading-relaxed">
                      {howToUseText}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-2xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <FaInfoCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Usage Instructions Not Available</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Usage information is not available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="space-y-6 md:space-y-8">
                {loadingProductDetails ? (
                  <div className="text-center py-8 md:py-12">
                    <FaSpinner className="animate-spin w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-3 md:mb-4" />
                    <p className="text-gray-600 text-sm md:text-base">Loading benefits...</p>
                  </div>
                ) : benefitsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {benefitsList.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 md:gap-4 rounded-xl">
                        <div className="flex-shrink-0">
                          <FaCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">{benefit}</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">Experience natural benefits with regular use</p>
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-2xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <FaCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Benefits Not Listed</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Benefit information is not available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 md:space-y-8">
                {/* Customer Reviews Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                    {/* Average Rating */}
                    <div className="text-center lg:text-left">
                      <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1 md:mb-2">{averageRating.toFixed(1)}</div>
                      <div className="flex gap-1 text-xl sm:text-2xl mb-2 md:mb-3 justify-center lg:justify-start">{renderRating(averageRating)}</div>
                      <p className="text-gray-600 text-sm sm:text-base">Based on {reviews.length} customer reviews</p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 max-w-md w-full">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">Rating Breakdown</h3>
                      <div className="space-y-2 md:space-y-3">
                        {ratingBreakdown.map(({ star, count }) => (
                          <div
                            key={star}
                            className={`flex items-center gap-2 md:gap-3 p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                              filterRating === star ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => filterReviewsByRating(star)}
                          >
                            <div className="flex gap-1 text-xs sm:text-sm min-w-[80px]">{renderRating(star)}</div>
                            <div className="h-2 flex-1 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
                                style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600 w-8 sm:w-12 text-right">({count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 md:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Share Your Experience</h3>
                  {!user || !user._id ? (
                    <div className="text-center flex flex-col items-center py-6 md:py-8">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <FaUserShield className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 md:mb-3">Sign In to Review</h4>
                      <p className="text-gray-600 text-sm sm:text-base mb-4 md:mb-6">Please login to share your experience with this product</p>
                      <button 
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setAuthMode('login');
                        }}
                        className="mt-4 md:mt-6  py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto"
                      >
                        Sign In Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 md:mb-4">Your Rating</label>
                        <div className="flex gap-2 md:gap-3 text-2xl sm:text-3xl">
                          {renderClickableStars(rating, setRating)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 md:mb-4">Your Review</label>
                        <textarea
                          className="w-full rounded-xl border-2 border-gray-300 p-4 md:p-6 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm sm:text-base md:text-lg"
                          rows="4"
                          placeholder="Share your honest thoughts about this product..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-base sm:text-lg font-medium text-gray-900 mb-2 md:mb-4">Add Photos (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 text-center hover:border-gray-400 transition-all duration-300 cursor-pointer bg-gray-50">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="review-images"
                          />
                          <label htmlFor="review-images" className="cursor-pointer block">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                              <span className="text-xl sm:text-2xl">📷</span>
                            </div>
                            <p className="text-sm sm:text-base md:text-lg font-medium text-gray-800 mb-1 md:mb-2">
                              Upload photos of your experience
                            </p>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              Click to upload or drag and drop images here
                            </p>
                          </label>
                        </div>
                      </div>

                      {reviewImages.length > 0 && (
                        <div className="flex flex-wrap gap-3 md:gap-4">
                          {reviewImages.map((imageData, index) => (
                            <div key={index} className="relative">
                              <img
                                src={imageData.url}
                                alt={`Preview ${index + 1}`}
                                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                                loading="lazy"
                                decoding="async"
                              />
                              <button
                                onClick={() => removeReviewImage(index)}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-red-600 transition-all duration-300"
                                aria-label="Remove image"
                              >
                                <FaTimes className="w-2 h-2 sm:w-3 sm:h-3" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        className="bg-black text-white px-6 py-3 sm:px-10 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        onClick={handleSubmitReview}
                        disabled={uploading || rating === 0 || !comment.trim()}
                      >
                        {uploading ? (
                          <div className="flex items-center justify-center gap-2 md:gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                            <span className="text-sm sm:text-base">Submitting Review...</span>
                          </div>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Customer Reviews {filterRating && `- ${filterRating} Star${filterRating > 1 ? 's' : ''}`}
                    </h3>
                    {filterRating && (
                      <button
                        onClick={() => setFilterRating(null)}
                        className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 text-sm sm:text-base"
                      >
                        Clear Filter
                        <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>

                  {loadingReviews ? (
                    <div className="text-center flex flex-col items-center py-8 md:py-12">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-black mx-auto mb-4 md:mb-6"></div>
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg">Loading customer reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 md:py-16 bg-gray-50 rounded-2xl">
                      <div className="text-4xl sm:text-6xl mb-4 md:mb-6">💬</div>
                      <h4 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3 md:mb-4">No Reviews Yet</h4>
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 md:mb-8">Be the first to share your experience with this product!</p>
                      <button 
                        onClick={() => {
                          setActiveTab('reviews');
                          if (!user || !user._id) {
                            setIsLoginModalOpen(true);
                            setAuthMode('login');
                          }
                        }}
                        className="mt-4 md:mt-6  gap-2 py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto"
                      >
                        Write the First Review
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 md:space-y-8">
                      {displayedReviews.map((review) => {
                        const { hasLiked, hasDisliked } = getUserInteractionStatus(review);
                        
                        return (
                          <div key={review.id} className="border border-gray-200 rounded-2xl p-4 sm:p-6 md:p-8 hover:border-gray-300 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-4 md:mb-6">
                              <div className="flex items-start gap-3 md:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <span className="font-bold text-gray-700 text-base sm:text-lg">
                                    {review.author.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 md:mb-2">
                                    <span className="font-bold text-gray-900 text-base sm:text-lg">{maskEmail(review.author)}</span>
                                    <div className="flex gap-1 text-yellow-400">
                                      {renderRating(review.rating)}
                                    </div>
                                  </div>
                                  <p className="text-gray-500 text-sm sm:text-base">{review.date}</p>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed mb-4 md:mb-6">{review.comment}</p>

                            {review.images.length > 0 && (
                              <div className="flex gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
                                {review.images.map((imageUrl, index) => (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Review image ${index + 1}`}
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 shadow-sm"
                                    onClick={() => handleImageClick(imageUrl)}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Admin Reply */}
                            {review.hasReply && review.reply && (
                              <div className="ml-0 sm:ml-4 mt-4 md:mt-6 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-200">
                                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                  <FaUserShield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" aria-hidden="true" />
                                  <span className="font-bold text-blue-900 text-sm sm:text-base">{review.reply.author}</span>
                                  <span className="text-xs sm:text-sm text-blue-600">• {review.reply.date}</span>
                                </div>
                                <p className="text-blue-800 text-sm sm:text-base md:text-lg">{review.reply.content}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 md:gap-6 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                              <button
                                onClick={() => handleLikeReview(review.id)}
                                className={`flex items-center gap-2 md:gap-3 px-3 py-1 sm:px-4 sm:py-2 rounded-full transition-all duration-300 text-sm sm:text-base ${
                                  hasLiked
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                }`}
                                aria-label={hasLiked ? 'Remove like' : 'Like review'}
                              >
                                <FaThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                                <span className="font-medium">{review.likes}</span>
                              </button>
                              <button
                                onClick={() => handleDislikeReview(review.id)}
                                className={`flex items-center gap-2 md:gap-3 px-3 py-1 sm:px-4 sm:py-2 rounded-full transition-all duration-300 text-sm sm:text-base ${
                                  hasDisliked
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                }`}
                                aria-label={hasDisliked ? 'Remove dislike' : 'Dislike review'}
                              >
                                <FaThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                                <span className="font-medium">{review.dislikes}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {filteredReviews.length > 10 && (
                        <div className="text-center pt-6 md:pt-8">
                          <button
                            onClick={toggleShowAllReviews}
                            className="bg-gray-100 text-gray-700 px-6 py-3 sm:px-10 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-200 transition-all duration-300 border border-gray-300 w-full sm:w-auto"
                          >
                            {showAllReviews ? 'Show Less Reviews' : `Load More Reviews (${filteredReviews.length - 10}+)`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {productData.category && (
          <div className="mt-8 md:mt-12">
            <RelatedProduct category={productData.category} />
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-full">
            <div className="flex items-center justify-center h-full">
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl"
                style={{ 
                  width: 'auto',
                  height: 'auto'
                }}
                loading="eager"
                decoding="sync"
              />
            </div>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Close image modal"
            >
              <FaTimes className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default Product;