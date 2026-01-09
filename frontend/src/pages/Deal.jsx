import { useContext, useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
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
  FaClock, 
  FaFire,
  FaFlask,
  FaInfoCircle,
  FaCheckCircle,
  FaTruck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";

// Lazy load components
const RelatedProduct = lazy(() => import('../components/RelatedProduct'));
const RelatedDeals = lazy(() => import('../components/RelatedDeals'));
const LoginModal = lazy(() => import('../components/Login'));

const Deal = () => {
  const { dealId } = useParams();
  const { 
    backendUrl, 
    currency, 
    addDealToCart,
    user, 
    token,
    getCartAmount,
    isFreeDeliveryAvailable,
    getAmountForFreeDelivery
  } = useContext(ShopContext);
  
  const [dealData, setDealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const addToCartCalledRef = useRef(false);
  const imageCacheRef = useRef(new Map());

  // Memoized email masking function
  const maskEmail = useCallback((input) => {
    if (!input || typeof input !== 'string') return 'Unknown User';
    
    if (input.includes('***')) return input;
    
    if (input.includes('@')) {
      const [localPart, domain] = input.split('@');
      const firstChar = localPart[0];
      return `${firstChar}***@${domain}`;
    }
    
    if (input.length <= 2) {
      return input + '***';
    }
    const visiblePart = input.substring(0, 2);
    return `${visiblePart}***`;
  }, []);

  // Memoized fetch reviews function
  const fetchDealReviews = useCallback(async (dealId) => {
    if (!dealId || !backendUrl) return;

    setLoadingReviews(true);
    try {
      const response = await fetch(`${backendUrl}/api/comments?dealId=${dealId}`);
      
      if (response.ok) {
        const comments = await response.json();
        
        const dealReviews = comments.map(comment => ({
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
        
        setReviews(dealReviews);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoadingReviews(false);
    }
  }, [backendUrl]);

  // Fetch deal data and reviews
  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${backendUrl}/api/deal/single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.deal) {
          setDealData(data.deal);
          if (data.deal.dealImages && data.deal.dealImages.length > 0) {
            setImage(data.deal.dealImages[0]);
          }
          
          fetchDealReviews(dealId);
        } else {
          throw new Error(data.message || 'Deal not found');
        }
      } catch (error) {
        setError(error.message || 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      fetchDeal();
    } else {
      setError('No deal ID provided');
      setLoading(false);
    }
  }, [dealId, backendUrl, fetchDealReviews]);

  // Optimized quantity handlers
  const handleQuantityChange = useCallback((e) => {
    let value = Number(e.target.value);
    if (isNaN(value) || value < 1) {
      value = 1;
    }
    value = Math.min(value, 10);
    setQuantity(value);
  }, []);

  const incrementQuantity = useCallback(() => {
    if (quantity < 10) {
      setQuantity(prev => prev + 1);
    }
  }, [quantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  }, [quantity]);

  // Optimized image handlers
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
    setReviewImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Revoke object URL to prevent memory leaks
      if (prev[index]?.url.startsWith('blob:')) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newImages;
    });
  }, []);

  // Optimized review submission
  const handleSubmitReview = useCallback(async () => {
    if (!user || !user._id) {
      toast.error('Please login to submit a review');
      setIsLoginModalOpen(true);
      setAuthMode('login');
      return;
    }

    if (rating === 0 || comment.trim() === '') {
      toast.error('Please provide a rating and comment');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('targetType', 'deal');
      formData.append('dealId', dealId);
      formData.append('userId', user._id);
      formData.append('content', comment);
      formData.append('rating', rating);

      reviewImages.forEach((imageData, index) => {
        formData.append('reviewImages', imageData.file);
      });

      const currentToken = token || localStorage.getItem('token');

      const response = await fetch(`${backendUrl}/api/comments`, {
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
        reviewImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        setReviewImages([]);
        
        toast.success('Review submitted successfully!');
        fetchDealReviews(dealId);
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      toast.error('Error submitting review');
    } finally {
      setUploading(false);
    }
  }, [user, rating, comment, reviewImages, dealId, token, backendUrl, fetchDealReviews]);

  // Memoized user interaction status
  const getUserInteractionStatus = useCallback((review) => {
    if (!user || !user._id) return { hasLiked: false, hasDisliked: false };
    
    const hasLiked = review.likedBy?.includes(user._id) || false;
    const hasDisliked = review.dislikedBy?.includes(user._id) || false;
    
    return { hasLiked, hasDisliked };
  }, [user]);

  // Optimized like/dislike handlers
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

      let response;
      
      if (hasLiked) {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/remove-like`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      } else if (hasDisliked) {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/like`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      } else {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/like`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      }

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
  }, [user, token, backendUrl, reviews, getUserInteractionStatus]);

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

      let response;
      
      if (hasDisliked) {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/remove-dislike`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      } else if (hasLiked) {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/dislike`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      } else {
        response = await fetch(`${backendUrl}/api/comments/${reviewId}/dislike`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user._id })
        });
      }

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
  }, [user, token, backendUrl, reviews, getUserInteractionStatus]);

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Optimized review display handlers
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

  // Optimized add to cart with debouncing and delivery messaging
  const handleAddToCart = useCallback(async () => {
    if (isAddingToCart || addToCartCalledRef.current || !dealData) {
      return;
    }

    setIsAddingToCart(true);
    addToCartCalledRef.current = true;

    try {
      // Get current cart amount BEFORE adding the deal
      const currentCartAmount = getCartAmount?.() || 0;
      
      // Calculate the amount this deal will add
      const dealAmount = dealData.dealFinalPrice * quantity;
      
      // Calculate total amount after adding this deal
      const totalAmountAfterAdd = currentCartAmount + dealAmount;
      
      if (addDealToCart) {
        addDealToCart(dealId, quantity);
        
        // Use our calculated amount instead of calling getCartAmount again
        const isFreeDelivery = isFreeDeliveryAvailable?.(totalAmountAfterAdd) || false;
        const amountNeeded = getAmountForFreeDelivery?.(totalAmountAfterAdd) || 0;
        
        // Show professional delivery message
        if (isFreeDelivery) {
          // Free delivery achieved
          toast.success(
            <div className="flex items-center gap-2">
              <FaClock className="w-5 h-5 text-green-600" />
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
              <div className="font-semibold">Deal added to cart</div>
            </div>,
            {
              autoClose: 3000,
              className: 'bg-green-50 border border-green-200',
              progressClassName: 'bg-green-500'
            }
          );
        }
        
        setQuantity(1);
      } else {
        toast.error('Unable to add deal to cart');
      }
    } catch (error) {
      toast.error('Failed to add deal to cart');
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
        addToCartCalledRef.current = false;
      }, 1000);
    }
  }, [isAddingToCart, addDealToCart, dealId, quantity, dealData, getCartAmount, getAmountForFreeDelivery, isFreeDeliveryAvailable, currency]);

  const renderClickableStars = useCallback((currentRating, setRatingFunc) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className="cursor-pointer text-yellow-400 text-xl transition-transform hover:scale-110"
          onClick={() => setRatingFunc(i)}
        >
          {i <= currentRating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  }, []);

  // Memoized deal type badge
  const getDealTypeBadge = useCallback((dealType) => {
    let dealTypeSlug = '';
    let dealTypeName = '';
    
    if (!dealType) {
      return { label: 'DEAL', color: 'bg-gray-500 text-white' };
    }
    
    if (typeof dealType === 'string') {
      dealTypeSlug = dealType.toLowerCase();
      dealTypeName = dealType;
    } else if (typeof dealType === 'object' && dealType !== null) {
      if (dealType.slug) {
        dealTypeSlug = dealType.slug.toLowerCase();
        dealTypeName = dealType.name || dealType.slug;
      } else if (dealType.name) {
        dealTypeSlug = dealType.name.toLowerCase().replace(/\s+/g, '_');
        dealTypeName = dealType.name;
      } else if (dealType._id) {
        return { label: 'DEAL', color: 'bg-gray-500 text-white' };
      }
    }

    const typeMap = {
      'flash_sale': { label: 'FLASH SALE', color: 'bg-red-500 text-white' },
      'flash': { label: 'FLASH SALE', color: 'bg-red-500 text-white' },
      'seasonal': { label: 'SEASONAL', color: 'bg-green-500 text-white' },
      'clearance': { label: 'CLEARANCE', color: 'bg-orange-500 text-white' },
      'bundle': { label: 'BUNDLE', color: 'bg-purple-500 text-white' },
      'featured': { label: 'FEATURED', color: 'bg-blue-500 text-white' },
      'buyonegetone': { label: 'BOGO', color: 'bg-pink-500 text-white' },
      'bogo': { label: 'BOGO', color: 'bg-pink-500 text-white' },
      'daily_deal': { label: 'DAILY DEAL', color: 'bg-indigo-500 text-white' },
      'daily': { label: 'DAILY DEAL', color: 'bg-indigo-500 text-white' },
      'weekly_special': { label: 'WEEKLY SPECIAL', color: 'bg-teal-500 text-white' },
      'weekly': { label: 'WEEKLY SPECIAL', color: 'bg-teal-500 text-white' },
      'special': { label: 'SPECIAL OFFER', color: 'bg-teal-500 text-white' }
    };
    
    const badge = typeMap[dealTypeSlug] || { 
      label: dealTypeName ? dealTypeName.toUpperCase() : 'DEAL', 
      color: 'bg-gray-500 text-white' 
    };
    
    return badge;
  }, []);

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      reviewImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [reviewImages]);

  // Flip Countdown Components
  const FlipUnit = ({ value }) => (
    <div className="relative w-6 h-8 sm:w-8 sm:h-10 perspective-200">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-black text-white rounded-md flex items-center justify-center text-sm sm:text-base font-bold shadow-md"
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const FlipCountdown = ({ days, hours, minutes, seconds, showDays, showSeconds }) => {
    const format = (num) => num.toString().padStart(2, "0").split("");

    const d = format(days || 0);
    const h = format(hours || 0);
    const m = format(minutes || 0);
    const s = format(seconds || 0);

    return (
      <div className="flex items-center justify-center gap-1 text-black px-2 py-1">
        {showDays && (
          <>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <FlipUnit value={d[0]} />
                <FlipUnit value={d[1]} />
              </div>
              <span className="text-xs text-black">days</span>
            </div>
            <span className="font-bold text-base pb-4">:</span>
          </>
        )}

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <FlipUnit value={h[0]} />
            <FlipUnit value={h[1]} />
          </div>
          <span className="text-xs text-black">hours</span>
        </div>
        <span className="font-bold text-base pb-4">:</span>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <FlipUnit value={m[0]} />
            <FlipUnit value={m[1]} />
          </div>
          <span className="text-xs text-black">mins</span>
        </div>

        {showSeconds && (
          <>
            <span className="font-bold text-base pb-4">:</span>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <FlipUnit value={s[0]} />
                <FlipUnit value={s[1]} />
              </div>
              <span className="text-xs text-black">sec</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced Countdown Timer Component
  const CompactCountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [expired, setExpired] = useState(false);

    useEffect(() => {
      const calculateTimeLeft = () => {
        const difference = new Date(endDate) - new Date();
        
        if (difference <= 0) {
          setExpired(true);
          return {};
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setExpired(false);
        return { days, hours, minutes, seconds };
      };

      setTimeLeft(calculateTimeLeft());
      
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [endDate]);

    if (expired) {
      return (
        <div className="mt-2 p-2">
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <FaClock className="text-red-500" />
            <span>Deal Expired</span>
          </div>
        </div>
      );
    }

    const showDays = timeLeft.days > 1; 
    const showSeconds = true; 

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <FaFire className="text-red-500" size={16} />
          <span className="text-red-600 font-bold text-sm">Flash Sale Ends In:</span>
        </div>
        
        <FlipCountdown
          days={timeLeft.days}
          hours={timeLeft.hours}
          minutes={timeLeft.minutes}
          seconds={timeLeft.seconds}
          showDays={showDays}
          showSeconds={showSeconds}
        />

        <div className="mt-2 text-xs text-red-500 text-center">
          {showDays ? 'Hurry! Limited time offer' : 'Final hours! Don\'t miss out'}
        </div>
      </div>
    );
  };

  const isFlashSale = useCallback(() => {
    if (!dealData?.dealType) return false;
    
    const dealType = dealData.dealType;
    if (typeof dealType === 'string') {
      return dealType.toLowerCase().includes('flash');
    } else if (typeof dealType === 'object') {
      return dealType.slug?.includes('flash') || dealType.name?.toLowerCase().includes('flash');
    }
    return false;
  }, [dealData]);

  // Memoized error state
  const ErrorState = useMemo(() => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Not Found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading deal details...</p>
      </div>
    </div>
  ), []);

  if (error) return ErrorState;
  if (loading || !dealData) return LoadingState;

  const dealType = getDealTypeBadge(dealData.dealType);
  const flashSale = isFlashSale();

  // Optimized Image component with lazy loading
  const LazyImage = ({ src, alt, className, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    return (
      <img
        src={hasError ? 'https://via.placeholder.com/500?text=Deal+Image' : src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          setHasError(true);
          setIsLoaded(true);
        }}
        loading="lazy"
        decoding="async"
        {...props}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Deal Header */}
        <div className="mb-6 md:mb-12 text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 break-words">{dealData.dealName}</h1>
          
          <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto">
            Exclusive bundle offer - Limited time only!
          </p>
        </div>

        {/* Deal Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 md:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Image Gallery */}
            <div className="space-y-4 md:space-y-6">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden">
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
                  <div className={`inline-block text-center px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-full shadow-lg ${dealType.color}`}>
                    {dealType.label}
                  </div>
                </div>
                
                {flashSale && dealData.dealEndDate && (
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="bg-black bg-opacity-75 text-white p-3 rounded-xl">
                      <CompactCountdownTimer endDate={dealData.dealEndDate} />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
                  <LazyImage
                    src={image || dealData.dealImages?.[0] || 'https://via.placeholder.com/500?text=Deal+Image'}
                    alt={dealData.dealName}
                    className="w-full h-auto max-w-full object-contain rounded-2xl"
                    style={{ 
                      maxHeight: '500px',
                      width: 'auto',
                      height: 'auto'
                    }}
                  />
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {dealData.dealImages?.map((item, index) => (
                  <LazyImage
                    key={index}
                    src={item}
                    alt={`${dealData.dealName} thumbnail ${index + 1}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg cursor-pointer border-2 transition-all duration-300 flex-shrink-0 ${
                      image === item ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setImage(item)}
                  />
                ))}
              </div>
            </div>

            {/* Deal Info */}
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
                  {currency} {dealData.dealFinalPrice?.toFixed(2) || '0.00'}
                </span>
                {dealData.dealTotal && dealData.dealTotal > dealData.dealFinalPrice && (
                  <>
                    <span className="text-lg sm:text-xl text-gray-500 line-through">
                      {currency} {dealData.dealTotal.toFixed(2)}
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-full text-xs sm:text-sm">
                      Save {currency} {(dealData.dealTotal - dealData.dealFinalPrice).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="prose prose-sm max-w-none text-gray-700 mb-4 md:mb-6">
                  <p className="text-sm sm:text-base">{dealData.dealDescription}</p>
                </div>
              </div>

              {/* Deal Products List */}
              {dealData.dealProducts && dealData.dealProducts.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Bundle Contents</h3>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                    {dealData.dealProducts.map((product, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{product.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Quantity: {product.quantity}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Unit</p>
                            <p className="font-medium text-gray-700 text-sm sm:text-base">{currency} {product.price}</p>
                          </div>
                          <div className="w-px h-6 bg-gray-300"></div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold text-green-600 text-sm sm:text-base">{currency} {product.price * product.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2 md:mb-3">Quantity:</p>
                  <div className="flex items-center gap-3 md:gap-4">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                    <span className="w-12 sm:w-16 text-center text-lg sm:text-xl font-bold">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= 10}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={`mt-4 md:mt-6 flex items-center justify-center gap-2 py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto ${
                    isAddingToCart
                      ? 'bg-gray-400 cursor-not-allowed text-white hover:bg-gray-400 hover:text-white hover:border-transparent hover:scale-100'
                      : 'bg-black text-white hover:bg-gray-800 hover:shadow-xl transform hover:-translate-y-1'
                  }`}
                  aria-label="Add to cart"
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">Adding to Cart...</span>
                    </div>
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
                  activeTab === 'products'
                    ? 'text-black border-b-2 border-black bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('products')}
              >
                Products Included
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
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">{dealData.dealDescription}</p>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6 md:space-y-8">
                {dealData.dealProducts && dealData.dealProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {dealData.dealProducts.map((product, index) => (
                      <div key={index} className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{product.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs sm:text-sm text-gray-600">Quantity: {product.quantity}</span>
                            <span className="text-xs sm:text-sm font-medium text-gray-900">Price: {currency} {product.price}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-2">Total: {currency} {product.price * product.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 bg-gray-50 rounded-2xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <FaInfoCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No Products Listed</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Product information is not available for this deal.</p>
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
                      <p className="text-gray-600 text-sm sm:text-base mb-4 md:mb-6">Please login to share your experience with this deal</p>
                      <button 
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setAuthMode('login');
                        }}
                        className="mt-4 md:mt-6 py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto"
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
                          placeholder="Share your honest thoughts about this deal..."
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
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6 md:mb-8">Be the first to share your experience with this deal!</p>
                      <button 
                        onClick={() => {
                          setActiveTab('reviews');
                          if (!user || !user._id) {
                            setIsLoginModalOpen(true);
                            setAuthMode('login');
                          }
                        }}
                        className="mt-4 md:mt-6 py-3 sm:py-4 px-8 sm:px-20 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap w-full md:w-auto"
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

        {/* Related Products & Deals with Lazy Loading */}
        {dealData.category && (
          <div className="mt-8 md:mt-12 space-y-8">
            <Suspense fallback={<div className="text-center py-8">Loading related products...</div>}>
              <RelatedProduct category={dealData.category} />
            </Suspense>
            <Suspense fallback={<div className="text-center py-8">Loading related deals...</div>}>
              <RelatedDeals 
                category={dealData.category} 
                currentDealId={dealId} 
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-full">
            <div className="flex items-center justify-center h-full">
              <LazyImage
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl"
                style={{ 
                  width: 'auto',
                  height: 'auto'
                }}
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
      <Suspense fallback={null}>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          initialMode={authMode}
        />
      </Suspense>
    </div>
  );
};

export default Deal;