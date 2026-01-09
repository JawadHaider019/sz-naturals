import { useContext, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalf, FaRegStar, FaArrowRight } from 'react-icons/fa';

const ProductItem = ({ 
  id, 
  image, 
  name, 
  price, 
  discount, 
  rating, 
  status = 'published',
  secondImage, // Add secondImage prop for hover effect
  isLoading = false // Add isLoading prop to show loading state
}) => {
  const { currency } = useContext(ShopContext);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({ first: false, second: false });
  const secondImageRef = useRef(null);

  // Don't render if product is not published
  if (status !== 'published' && !isLoading) {
    return null;
  }

  // Show loading skeleton if isLoading is true
  if (isLoading) {
    return <ProductItemLoadingSkeleton />;
  }

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate, id]);

  // Memoized rating calculation
  const renderRating = useCallback((ratingValue = 0) => {
    const stars = [];
    const numericRating = Number(ratingValue) || 0;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStar size={14} />
          </span>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf size={14} />
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar size={14} />
          </span>
        );
      }
    }
    return stars;
  }, []);

  // Memoized price calculations
  const { actualPrice, discountPercentage, showDiscount, savingsAmount } = useMemo(() => {
    const actualPrice = discount ? discount : price;
    const discountPercentage = discount ? Math.round(((price - discount) / price) * 100) : 0;
    const showDiscount = discount && discountPercentage > 0;
    const savingsAmount = showDiscount ? price - discount : 0;
    
    return { actualPrice, discountPercentage, showDiscount, savingsAmount };
  }, [price, discount]);

  // Memoized normalized rating
  const normalizedRating = useMemo(() => {
    const numRating = Number(rating) || 0;
    if (numRating < 0) return 0;
    if (numRating > 5) return 5;
    return numRating;
  }, [rating]);

  const handleImageError = useCallback((e) => {
    e.target.src = "/images/fallback-image.jpg";
  }, []);

  // Handle image loading
  const handleFirstImageLoad = useCallback(() => {
    setImagesLoaded(prev => ({ ...prev, first: true }));
  }, []);

  const handleSecondImageLoad = useCallback(() => {
    setImagesLoaded(prev => ({ ...prev, second: true }));
  }, []);

  // Preload second image on component mount
  useEffect(() => {
    if (secondImage && secondImage !== image) {
      const img = new Image();
      img.src = secondImage;
      img.onload = handleSecondImageLoad;
      img.onerror = () => {
        console.log("Failed to preload second image");
      };
    }
  }, [secondImage, image, handleSecondImageLoad]);

  // Check if second image is available and different from main image
  const hasSecondImage = secondImage && secondImage !== image;
  const bothImagesLoaded = imagesLoaded.first && (hasSecondImage ? imagesLoaded.second : true);

  return (
    <div 
      onClick={handleClick} 
      className="cursor-pointer relative rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full max-w-[320px] mx-auto h-[420px]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
          e.preventDefault();
        }
      }}
      aria-label={`View ${name} product details`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Background Images with smooth crossfade */}
      <div className="absolute inset-0">
        {/* First Image - Always visible, fades out on hover */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            isHovered && hasSecondImage ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img
            ref={secondImageRef}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={image}
            alt={name}
            onError={handleImageError}
            onLoad={handleFirstImageLoad}
            loading="lazy"
            decoding="async"
          />
        </div>
        
        {/* Second Image - Fades in on hover */}
        {hasSecondImage && (
          <div 
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={secondImage}
              alt={`${name} alternative view`}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Loading overlay for images */}
      {!bothImagesLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      )}

      {/* Discount Badge */}
      {showDiscount && (
        <div className="absolute top-3 right-3 rounded-full bg-white text-black px-3 py-1 text-xs font-medium z-10">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
        {/* Content */}
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-bold text-lg leading-tight">
            {name}
          </h3>

          {/* Rating */}
          {normalizedRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                {renderRating(normalizedRating)}
              </div>
              <span className="text-xs text-gray-300 ml-1">({normalizedRating.toFixed(1)})</span>
            </div>
          )}

          {/* Price Section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">
                {currency} {actualPrice.toFixed(2)}
              </p>
              {showDiscount && (
                <p className="text-sm text-gray-300 line-through">
                  {currency} {price.toFixed(2)}
                </p>
              )}
            </div>
            
            {/* Right Arrow Button */}
            <div 
              className="w-9 h-9 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0"
              aria-hidden="true"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <FaArrowRight size={16} className="text-black" />
            </div>
          </div>

          {/* Savings Info */}
          {showDiscount && (
            <div className="text-sm text-green-300 font-medium">
              Save {currency} {savingsAmount.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const ProductItemLoadingSkeleton = () => {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden w-full max-w-[320px] mx-auto h-[420px] bg-gray-100 animate-pulse"
      aria-label="Loading product..."
      role="status"
      aria-busy="true"
    >
      {/* Skeleton Image Area */}
      <div className="absolute inset-0 bg-gray-200" />
      
      {/* Skeleton Content */}
      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="space-y-3">
          {/* Title Skeleton */}
          <div className="h-6 bg-gray-300 rounded w-3/4" />
          
          {/* Rating Skeleton */}
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 rounded" />
              ))}
            </div>
            <div className="w-10 h-4 bg-gray-300 rounded ml-1" />
          </div>
          
          {/* Price Section Skeleton */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 bg-gray-300 rounded" />
              <div className="h-5 w-16 bg-gray-300 rounded" />
            </div>
            
            {/* Arrow Button Skeleton */}
            <div className="w-9 h-9 bg-gray-300 rounded-full" />
          </div>
          
          {/* Savings Info Skeleton */}
          <div className="h-5 w-24 bg-gray-300 rounded" />
        </div>
      </div>
      
      {/* Skeleton Discount Badge */}
      <div className="absolute top-3 right-3 rounded-full bg-gray-300 px-3 py-1 w-16 h-6" />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
};

export default ProductItem;