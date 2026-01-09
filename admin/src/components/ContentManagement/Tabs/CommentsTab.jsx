import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply, faTrash, faEnvelope, faEnvelopeOpen, faEye, faStar, faStarHalfAlt, faTimes, faChevronLeft, faChevronRight, faCheck, faExclamationTriangle, faImage, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';


const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/comments`;

// Toast Component (responsive)
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? faCheck : faExclamationTriangle;

  return (
    <div className={`fixed top-4 right-4 left-4 sm:left-auto ${bgColor} text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-in max-w-xs sm:max-w-md`}>
      <FontAwesomeIcon icon={icon} className="text-lg" />
      <span className="font-medium flex-1 text-sm sm:text-base">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200 ml-2">
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

const CommentsTab = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState([]);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Get current user ID - replace this with your actual user authentication
  const getCurrentUserId = () => {
    // Replace this with your actual user ID from context, localStorage, or auth system
    // For demo purposes, using a static ID. In real app, get from your auth system
    return "65a1b2c3d4e5f67890123456"; // Example user ID
  };

  // Helper function to create a simple placeholder image
  const createPlaceholderImage = (text = 'No Image', width = 200, height = 200) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    return canvas.toDataURL();
  };

  // Get image URLs from comment
  const getImageUrls = (comment) => {
    if (comment.reviewImages && comment.reviewImages.length > 0) {
      return comment.reviewImages.map(img => img.url);
    }
    
    if (comment.productId?.images && comment.productId.images.length > 0) {
      return comment.productId.images;
    }
    
    return [createPlaceholderImage('No Image')];
  };

  // Check if current user has liked/disliked a comment
  const getUserInteractionStatus = (comment) => {
    const userId = getCurrentUserId();
    const hasLiked = comment.likedBy?.some(user => user._id === userId) || false;
    const hasDisliked = comment.dislikedBy?.some(user => user._id === userId) || false;
    
    return { hasLiked, hasDisliked };
  };

  // API functions - UPDATED for YouTube-like system
  const api = {
    getComments: async () => {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },

    markAsRead: async (id) => {
      const response = await fetch(`${API_BASE_URL}/${id}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },

    markAsUnread: async (id) => {
      const response = await fetch(`${API_BASE_URL}/${id}/unread`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as unread');
      return response.json();
    },

    addReply: async (id, content) => {
      const response = await fetch(`${API_BASE_URL}/${id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to add reply');
      return response.json();
    },

    likeComment: async (id, userId) => {
      const response = await fetch(`${API_BASE_URL}/${id}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like comment');
      }
      return response.json();
    },

    dislikeComment: async (id, userId) => {
      const response = await fetch(`${API_BASE_URL}/${id}/dislike`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to dislike comment');
      }
      return response.json();
    },

    // NEW: Remove like/dislike (toggle off)
    removeLike: async (id, userId) => {
      const response = await fetch(`${API_BASE_URL}/${id}/remove-like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove like');
      }
      return response.json();
    },

    removeDislike: async (id, userId) => {
      const response = await fetch(`${API_BASE_URL}/${id}/remove-dislike`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove dislike');
      }
      return response.json();
    },

    deleteComment: async (id) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
  };

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
  }, []);

 const fetchComments = async () => {
  try {
    setLoading(true);

    // Fetch all comments from API
    const commentsData = await api.getComments();

    // Debug: check what data came back
    console.log("🟢 Raw comments from API:", commentsData);

    // ✅ Normalize data for UI safety (ensure every comment has clean fields)
    const formattedComments = commentsData.map((comment) => ({
      _id: comment._id,
      rating: comment.rating,
      content: comment.content,
      date: comment.date,
      author: comment.author,
      email: comment.email,
      productName: comment.productName || "N/A",
      productPrice: comment.productPrice || "N/A",
      targetType: comment.targetType || "unknown",
      reviewImages: comment.reviewImages || [],
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
      likedBy: comment.likedBy || [],
      dislikedBy: comment.dislikedBy || [],
      hasReply: comment.hasReply || false,
      reply: comment.reply || null,
      isRead: comment.isRead || false,
      productId: comment.productId,
      dealId: comment.dealId,
    }));

    // Debug: check for deal/product distinction
    formattedComments.forEach((c) => {
      console.log(
        `💬 Comment for ${c.targetType === "deal" ? "Deal" : "Product"} →`,
        {
          name: c.productName,
          price: c.productPrice,
          id: c.targetType === "deal" ? c.dealId : c.productId,
        }
      );
    });

    // ✅ Update state
    setComments(formattedComments);
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
    showToast("Failed to load comments", "error");
  } finally {
    setLoading(false);
  }
};


  // Filter comments based on status
  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !comment.isRead;
    if (filter === 'replied') return comment.hasReply;
    return true;
  });

  const markAsRead = async (id) => {
    try {
      await api.markAsRead(id);
      setComments(comments.map(comment => 
        comment._id === id ? {...comment, isRead: true} : comment
      ));
      showToast('Comment marked as read', 'success');
    } catch (error) {
      console.error('Error marking as read:', error);
      showToast('Failed to mark as read', 'error');
    }
  };

  const markAsUnread = async (id) => {
    try {
      await api.markAsUnread(id);
      setComments(comments.map(comment => 
        comment._id === id ? {...comment, isRead: false} : comment
      ));
      showToast('Comment marked as unread', 'success');
    } catch (error) {
      console.error('Error marking as unread:', error);
      showToast('Failed to mark as unread', 'error');
    }
  };

// Like comment function - FIXED for proper count decrement
const likeComment = async (id) => {
  try {
    const userId = getCurrentUserId();
    const comment = comments.find(c => c._id === id);
    const { hasLiked, hasDisliked } = getUserInteractionStatus(comment);
    
    // If already liked, remove the like (toggle off)
    if (hasLiked) {
      const result = await api.removeLike(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          likes: Math.max(0, (comment.likes || 0) - 1), // Decrease by 1, minimum 0
          // Remove user from likedBy
          likedBy: (comment.likedBy || []).filter(user => user._id !== userId)
        } : comment
      ));
      showToast('Like removed', 'success');
    } 
    // If disliked, switch to like (remove dislike and add like)
    else if (hasDisliked) {
      const result = await api.likeComment(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          likes: (comment.likes || 0) + 1, // Increase likes by 1
          dislikes: Math.max(0, (comment.dislikes || 0) - 1), // Decrease dislikes by 1, minimum 0
          // Switch from dislike to like
          likedBy: [...(comment.likedBy || []), { _id: userId }],
          dislikedBy: (comment.dislikedBy || []).filter(user => user._id !== userId)
        } : comment
      ));
      showToast('Comment liked', 'success');
    }
    // If neither, add like
    else {
      const result = await api.likeComment(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          likes: (comment.likes || 0) + 1, // Increase likes by 1
          // Add user to likedBy
          likedBy: [...(comment.likedBy || []), { _id: userId }]
        } : comment
      ));
      showToast('Comment liked', 'success');
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    showToast(error.message || 'Failed to like comment', 'error');
  }
};

// Dislike comment function - FIXED for proper count decrement
const dislikeComment = async (id) => {
  try {
    const userId = getCurrentUserId();
    const comment = comments.find(c => c._id === id);
    const { hasLiked, hasDisliked } = getUserInteractionStatus(comment);
    
    // If already disliked, remove the dislike (toggle off)
    if (hasDisliked) {
      const result = await api.removeDislike(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          dislikes: Math.max(0, (comment.dislikes || 0) - 1), // Decrease by 1, minimum 0
          // Remove user from dislikedBy
          dislikedBy: (comment.dislikedBy || []).filter(user => user._id !== userId)
        } : comment
      ));
      showToast('Dislike removed', 'success');
    } 
    // If liked, switch to dislike (remove like and add dislike)
    else if (hasLiked) {
      const result = await api.dislikeComment(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          likes: Math.max(0, (comment.likes || 0) - 1), // Decrease likes by 1, minimum 0
          dislikes: (comment.dislikes || 0) + 1, // Increase dislikes by 1
          // Switch from like to dislike
          dislikedBy: [...(comment.dislikedBy || []), { _id: userId }],
          likedBy: (comment.likedBy || []).filter(user => user._id !== userId)
        } : comment
      ));
      showToast('Comment disliked', 'success');
    }
    // If neither, add dislike
    else {
      const result = await api.dislikeComment(id, userId);
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...comment, 
          dislikes: (comment.dislikes || 0) + 1, // Increase dislikes by 1
          // Add user to dislikedBy
          dislikedBy: [...(comment.dislikedBy || []), { _id: userId }]
        } : comment
      ));
      showToast('Comment disliked', 'success');
    }
  } catch (error) {
    console.error('Error disliking comment:', error);
    showToast(error.message || 'Failed to dislike comment', 'error');
  }
};

  // Open delete confirmation modal
  const openDeleteModal = (comment) => {
    setCommentToDelete(comment);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCommentToDelete(null);
  };

  // Delete comment after confirmation
  const confirmDelete = async () => {
    if (commentToDelete) {
      try {
        await api.deleteComment(commentToDelete._id);
        setComments(comments.filter(comment => comment._id !== commentToDelete._id));
        showToast('Comment deleted successfully', 'success');
        closeDeleteModal();
      } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('Failed to delete comment', 'error');
      }
    }
  };

  const replyToComment = async (id) => {
    if (replyContent.trim() === '') return;
    
    try {
      const updatedComment = await api.addReply(id, replyContent);
      
      // Update the comments state with the returned comment
      setComments(comments.map(comment => 
        comment._id === id ? {
          ...updatedComment, // Use the entire updated comment from backend
          hasReply: true,
          isRead: true // Ensure it's marked as read
        } : comment
      ));
      
      setReplyingTo(null);
      setReplyContent('');
      showToast('Reply sent successfully', 'success');
    } catch (error) {
      console.error('Error replying to comment:', error);
      showToast('Failed to send reply', 'error');
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Close toast
  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  // Function to render star ratings with support for decimals
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon
          key={`full-${i}`}
          icon={faStar}
          className="text-yellow-400 text-xs sm:text-sm"
        />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon
          key="half"
          icon={faStarHalfAlt}
          className="text-yellow-400 text-xs sm:text-sm"
        />
      );
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon
          key={`empty-${i}`}
          icon={faStar}
          className="text-gray-300 text-xs sm:text-sm"
        />
      );
    }
    
    return stars;
  };

  // Open modal with images
  const openImageModal = (comment, index = 0) => {
    const imageUrls = getImageUrls(comment);
    setCurrentImages(imageUrls);
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  // Navigate to next image
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === currentImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Navigate to previous image
  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? currentImages.length - 1 : prevIndex - 1
    );
  };

  // Handle image error - fallback to placeholder
  const handleImageError = (e, fallbackText = 'Image') => {
    e.target.src = createPlaceholderImage(fallbackText);
    e.target.onerror = null;
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (isImageModalOpen) {
        if (e.key === 'Escape') {
          closeImageModal();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        }
      }
      if (isDeleteModalOpen && e.key === 'Escape') {
        closeDeleteModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, isDeleteModalOpen, currentImages.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs - Updated to match desired style */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
        <button
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            filter === 'all' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('all')}
        >
          All Comments ({comments.length})
        </button>
        <button
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            filter === 'unread' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('unread')}
        >
          Unread ({comments.filter(comment => !comment.isRead).length})
        </button>
        <button
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            filter === 'replied' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setFilter('replied')}
        >
          Replied ({comments.filter(comment => comment.hasReply).length})
        </button>
      </div>

      {/* Comments List - Mobile Cards / Desktop Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment & Reply
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-3xl sm:text-4xl" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">No comments found</p>
                  </td>
                </tr>
              ) : (
                filteredComments.map(comment => {
                  const imageUrls = getImageUrls(comment);
                  const productName = comment.productName || comment.productId?.name || 'Unknown Product';
                  const productPrice = comment.productPrice || comment.productId?.price || 'N/A';
                  const { hasLiked, hasDisliked } = getUserInteractionStatus(comment);
                  
                  return (
                    <React.Fragment key={comment._id}>
                      <tr className={!comment.isRead ? 'bg-blue-50 border-l-4 border-l-black' : ''}>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex flex-col space-y-1">
                              <div className="flex space-x-1">
                                {imageUrls.slice(0, 2).map((imageUrl, index) => (
                                  <img 
                                    key={index}
                                    src={imageUrl} 
                                    alt={`${productName} ${index + 1}`}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openImageModal(comment, index)}
                                    onError={(e) => handleImageError(e, 'Image')}
                                  />
                                ))}
                              </div>
                              {imageUrls.length > 2 && (
                                <div className="flex space-x-1">
                                  {imageUrls.slice(2, 4).map((imageUrl, index) => (
                                    <img 
                                      key={index + 2}
                                      src={imageUrl} 
                                      alt={`${productName} ${index + 3}`}
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => openImageModal(comment, index + 2)}
                                      onError={(e) => handleImageError(e, 'Image')}
                                    />
                                  ))}
                                  {imageUrls.length > 4 && (
                                    <div 
                                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 border cursor-pointer hover:bg-gray-200 transition-colors"
                                      onClick={() => openImageModal(comment, 4)}
                                    >
                                      <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xs" />
                                      <span className="ml-1">+{imageUrls.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                {productName}
                              </div>
                              <div className="text-xs text-gray-500 capitalize mb-1">
                                {comment.targetType} • Rs {productPrice}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  comment.isRead 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  <FontAwesomeIcon 
                                    icon={comment.isRead ? faEnvelopeOpen : faEnvelope} 
                                    className="mr-1 text-xs" 
                                  />
                                  {comment.isRead ? 'Read' : 'Unread'}
                                </span>
                                {comment.hasReply && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <FontAwesomeIcon icon={faReply} className="mr-1 text-xs" />
                                    Replied
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{comment.author}</div>
                          <div className="text-sm text-gray-500">{comment.email}</div>
                          <div className="flex items-center space-x-3 mt-2">
                            <button 
                              onClick={() => likeComment(comment._id)}
                              className={`flex items-center space-x-1 text-xs transition-colors ${
                                hasLiked 
                                  ? 'text-green-600' 
                                  : 'text-gray-600 hover:text-green-600'
                              }`}
                            >
                              <FontAwesomeIcon icon={faThumbsUp} />
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button 
                              onClick={() => dislikeComment(comment._id)}
                              className={`flex items-center space-x-1 text-xs transition-colors ${
                                hasDisliked 
                                  ? 'text-red-600' 
                                  : 'text-gray-600 hover:text-red-600'
                              }`}
                            >
                              <FontAwesomeIcon icon={faThumbsDown} />
                              <span>{comment.dislikes || 0}</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-500">Customer Comment:</div>
                                {comment.rating > 0 && (
                                  <div className="flex items-center space-x-2 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                    <div className="flex items-center space-x-1">
                                      {renderStarRating(comment.rating)}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                      {comment.rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                                {comment.content}
                              </div>
                            </div>
                            
                            {comment.hasReply && comment.reply && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Your Reply:</div>
                                <div className="text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
                                  <div className="text-green-800">{comment.reply.content}</div>
                                  <div className="text-xs text-green-600 mt-1 flex justify-between">
                                    <span>Replied on {new Date(comment.reply.date).toLocaleDateString()}</span>
                                    <span className="font-medium">By {comment.reply.author}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(comment.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(comment.date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            {!comment.isRead ? (
                              <button 
                                className="flex items-center justify-center w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                onClick={() => markAsRead(comment._id)}
                                title="Mark as Read"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1 sm:mr-2 text-xs" />
                                <span className="hidden sm:inline">Mark Read</span>
                                <span className="sm:hidden">Read</span>
                              </button>
                            ) : (
                              <button 
                                className="flex items-center justify-center w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => markAsUnread(comment._id)}
                                title="Mark as Unread"
                              >
                                <FontAwesomeIcon icon={faEnvelope} className="mr-1 sm:mr-2 text-xs" />
                                <span className="hidden sm:inline">Mark Unread</span>
                                <span className="sm:hidden">Unread</span>
                              </button>
                            )}
                            
                            {!comment.hasReply && (
                              <button 
                                className="flex items-center justify-center w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-black bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                title="Reply to Comment"
                              >
                                <FontAwesomeIcon icon={faReply} className="mr-1 sm:mr-2 text-xs" />
                                <span className="hidden sm:inline">Reply</span>
                                <span className="sm:hidden">Reply</span>
                              </button>
                            )}
                            
                            <button 
                              className="flex items-center justify-center w-full px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              onClick={() => openDeleteModal(comment)}
                              title="Delete Comment"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-1 sm:mr-2 text-xs" />
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Reply Editor */}
                      {replyingTo === comment._id && (
                        <tr className="bg-blue-25">
                          <td colSpan="5" className="px-4 sm:px-6 py-4 border-t border-blue-200">
                            <div className="max-w-4xl mx-auto">
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Reply to <span className="text-black">{comment.author}</span>'s comment about 
                                <span className="text-black"> {productName}</span>:
                              </label>
                              <div className="flex flex-col space-y-3">
                                <textarea
                                  placeholder="Type your professional reply here..."
                                  rows="4"
                                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none shadow-sm text-sm sm:text-base"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  autoFocus
                                />
                                <div className="flex gap-2 sm:gap-3 justify-end">
                                  <button
                                    className="px-4 sm:px-6 py-2 bg-gray-300 text-black  hover:bg-gray-400 font-medium transition-colors text-sm"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="px-4 sm:px-6 py-2 bg-black text-white font-medium text-sm"
                                    onClick={() => replyToComment(comment._id)}
                                    disabled={!replyContent.trim()}
                                  >
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredComments.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="text-gray-400 mb-2">
                <FontAwesomeIcon icon={faEnvelope} className="text-3xl" />
              </div>
              <p className="text-gray-500 text-base">No comments found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredComments.map(comment => {
                const imageUrls = getImageUrls(comment);
                const productName = comment.productName || comment.productId?.name || 'Unknown Product';
                const productPrice = comment.productPrice || comment.productId?.price || 'N/A';
                const { hasLiked, hasDisliked } = getUserInteractionStatus(comment);
                
                return (
                  <div key={comment._id} className={`p-4 ${!comment.isRead ? 'bg-blue-50 border-l-4 border-l-black' : ''}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          comment.isRead 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <FontAwesomeIcon 
                            icon={comment.isRead ? faEnvelopeOpen : faEnvelope} 
                            className="mr-1" 
                          />
                          {comment.isRead ? 'Read' : 'Unread'}
                        </span>
                        {comment.hasReply && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-black-100 text-black-800">
                            <FontAwesomeIcon icon={faReply} className="mr-1" />
                            Replied
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <div>{new Date(comment.date).toLocaleDateString()}</div>
                        <div>{new Date(comment.date).toLocaleTimeString()}</div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex space-x-1">
                          {imageUrls.slice(0, 2).map((imageUrl, index) => (
                            <img 
                              key={index}
                              src={imageUrl} 
                              alt={`${productName} ${index + 1}`}
                              className="w-10 h-10 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageModal(comment, index)}
                              onError={(e) => handleImageError(e, 'Image')}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {productName}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {comment.targetType} • Rs {productPrice}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">{comment.author}</div>
                      <div className="text-sm text-gray-500">{comment.email}</div>
                    </div>

                    {/* Rating */}
                    {comment.rating > 0 && (
                      <div className="flex items-center justify-between mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center space-x-1">
                          {renderStarRating(comment.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {comment.rating}
                        </span>
                      </div>
                    )}

                    {/* Comment Content */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Customer Comment:</div>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                        {comment.content}
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {comment.hasReply && comment.reply && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Your Reply:</div>
                        <div className="text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
                          <div className="text-green-800">{comment.reply.content}</div>
                          <div className="text-xs text-green-600 mt-1">
                            Replied on {new Date(comment.reply.date).toLocaleDateString()} by {comment.reply.author}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Like/Dislike */}
                    <div className="flex items-center space-x-4 mb-3">
                      <button 
                        onClick={() => likeComment(comment._id)}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          hasLiked 
                            ? 'text-green-600' 
                            : 'text-gray-600 hover:text-green-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span>{comment.likes || 0}</span>
                      </button>
                      <button 
                        onClick={() => dislikeComment(comment._id)}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          hasDisliked 
                            ? 'text-red-600' 
                            : 'text-gray-600 hover:text-red-600'
                        }`}
                      >
                        <FontAwesomeIcon icon={faThumbsDown} />
                        <span>{comment.dislikes || 0}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {!comment.isRead ? (
                        <button 
                          className="flex-1 flex items-center justify-center px-3 py-2 text-xs text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          onClick={() => markAsRead(comment._id)}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          Mark Read
                        </button>
                      ) : (
                        <button 
                          className="flex-1 flex items-center justify-center px-3 py-2 text-xs text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          onClick={() => markAsUnread(comment._id)}
                        >
                          <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                          Mark Unread
                        </button>
                      )}
                      
                      {!comment.hasReply && (
                        <button 
                          className="flex-1 flex items-center justify-center px-3 py-2 text-xs text-black bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        >
                          <FontAwesomeIcon icon={faReply} className="mr-1" />
                          Reply
                        </button>
                      )}
                      
                      <button 
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        onClick={() => openDeleteModal(comment)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Delete
                      </button>
                    </div>

                    {/* Reply Editor for Mobile */}
                    {replyingTo === comment._id && (
                      <div className="mt-4 p-3 bg-blue-25 rounded-lg border border-blue-200">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Reply to {comment.author}:
                        </label>
                        <textarea
                          placeholder="Type your reply here..."
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none text-sm"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <button
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 bg-black text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                            onClick={() => replyToComment(comment._id)}
                            disabled={!replyContent.trim()}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal - Responsive */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
            </button>

            {/* Navigation Buttons */}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2 sm:p-3"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-lg sm:text-xl" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2 sm:p-3"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-lg sm:text-xl" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={currentImages[currentImageIndex]}
                alt={`Product image ${currentImageIndex + 1}`}
                className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain rounded-lg"
                onError={(e) => handleImageError(e, 'Large Image')}
              />
            </div>

            {/* Image Counter */}
            {currentImages.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-xs sm:text-sm">
                {currentImageIndex + 1} / {currentImages.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {currentImages.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-2 right-2 flex justify-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
                {currentImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-8 h-8 sm:w-12 sm:h-12 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${
                      index === currentImageIndex ? 'border-white' : 'border-transparent'
                    } hover:border-gray-300 transition-all`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => handleImageError(e, 'Thumb')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Responsive */}
      {isDeleteModalOpen && commentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-sm sm:max-w-md w-full mx-3 sm:mx-4 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-lg sm:text-xl" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Comment</h3>
            </div>
            
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to delete the comment from <strong>{commentToDelete.author}</strong> about <strong>{commentToDelete.productName || commentToDelete.productId?.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
              <button
                onClick={closeDeleteModal}
                className="px-3 sm:px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 sm:px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2 justify-center text-sm sm:text-base order-1 sm:order-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Delete Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
    </div>
  );
};

export default CommentsTab;