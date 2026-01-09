import { useState, useEffect, useMemo, useCallback, memo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalf, FaRegStar, FaClock, FaFire, FaArrowRight } from "react-icons/fa";
import { ShopContext } from "../context/ShopContext";

// Pre-calculated deal type configurations
const DEAL_TYPE_CONFIG = {
  "flash-sale": { label: "FLASH SALE", color: "bg-red-600 text-white", icon: FaFire },
  seasonal: { label: "SEASONAL", color: "bg-green-600 text-white" },
  clearance: { label: "CLEARANCE", color: "bg-orange-600 text-white" },
  bundle: { label: "BUNDLE", color: "bg-purple-600 text-white" },
  featured: { label: "FEATURED", color: "bg-blue-600 text-white" },
  buyonegetone: { label: "BOGO", color: "bg-pink-600 text-white" },
  daily_deal: { label: "DAILY DEAL", color: "bg-indigo-600 text-white" },
  weekly_special: { label: "WEEKLY SPECIAL", color: "bg-teal-600 text-white" },
};


// ---------------- Rating Stars (Updated to match ProductItem) -----------
const RatingStars = memo(({ rating = 0 }) => {
  const stars = useMemo(() => {
    const starsArray = [];
    const numericRating = Number(rating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= numericRating) {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaStar size={14} />
          </span>
        );
      } else if (i - 0.5 <= numericRating) {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf size={14} />
          </span>
        );
      } else {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar size={14} />
          </span>
        );
      }
    }
    return starsArray;
  }, [rating]);

  return <div className="flex items-center gap-1">{stars}</div>;
});

// ---------------- Deal Item Skeleton ----------------
const DealItemSkeleton = memo(() => {
  return (
    <div 
      className="relative rounded-2xl overflow-hidden h-96 bg-gray-100 animate-pulse"
      aria-label="Loading deal..."
      role="status"
      aria-busy="true"
    >
      {/* Skeleton Image Area */}
      <div className="absolute inset-0 bg-gray-200" />
      
      {/* Skeleton Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        {/* Badges Skeleton */}
        <div className="flex justify-between items-start mb-4">
          <div className="h-7 w-20 bg-gray-300 rounded-full"></div>
          <div className="h-7 w-16 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="space-y-3">
          {/* Title Skeleton */}
          <div className="h-7 w-3/4 bg-gray-300 rounded"></div>
          
          {/* Description Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-300 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-300 rounded"></div>
          </div>
          
          {/* Rating Skeleton */}
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-300 rounded" />
              ))}
            </div>
            <div className="w-10 h-4 bg-gray-300 rounded ml-1"></div>
          </div>
          
          {/* Price Section Skeleton */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
              <div className="h-6 w-20 bg-gray-300 rounded"></div>
            </div>
            
            {/* Arrow Button Skeleton */}
            <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Additional Info Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-gray-300 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
});

DealItemSkeleton.displayName = 'DealItemSkeleton';

// ---------------- Deal Item ----------------
const DealItem = memo(
  ({
    id,
    image,
    name,
    price = 0,
    discount = 0,
    rating = 0,
    dealType,
    productsCount = 0,
    endDate,
    onDealClick,
    currency,
    isLoading = false, // Add isLoading prop
  }) => {
    const { getDealRatingInfo, deals } = useContext(ShopContext);
    
    // Show loading skeleton if isLoading is true
    if (isLoading) {
      return <DealItemSkeleton />;
    }

    // Get rating from ShopContext - this ensures we have the latest rating data
    const dealRatingInfo = useMemo(() => {
      return getDealRatingInfo(id);
    }, [getDealRatingInfo, id, deals]);

    // Use context rating if available, otherwise fallback to prop
    const finalRating = dealRatingInfo.rating || rating;
    const reviewCount = dealRatingInfo.reviewCount || 0;

    // Memoized calculations for better performance
    const {
      dealTypeSlug,
      dealTypeBadge,
      displayPrice,
      hasDiscount,
      discountPercentage,
      savingsAmount,
      isFlashSale,
      normalizedRating,
    } = useMemo(() => {
      let typeSlug = "deal";
      let typeName = "Deal";

      if (dealType) {
        if (typeof dealType === "object") {
          typeSlug = dealType.slug || "deal";
          typeName = dealType.name || "Deal";
        } else {
          typeSlug = dealType;
          typeName = dealType;
        }
      }

      const badgeConfig =
        DEAL_TYPE_CONFIG[typeSlug] || { label: typeName.toUpperCase(), color: "bg-gray-600 text-white" };

      const finalPrice = discount > 0 && discount < price ? discount : price;
      const hasDisc = discount > 0 && discount < price;
      const discountPct = hasDisc ? Math.round(((price - discount) / price) * 100) : 0;
      const savings = hasDisc ? price - discount : 0;

      // Enhanced rating normalization
      const numRating = Number(finalRating);
      const normRating = (() => {
        if (isNaN(numRating) || numRating < 0) return 0;
        if (numRating > 5) return 5;
        return numRating;
      })();

      return {
        dealTypeSlug: typeSlug,
        dealTypeBadge: badgeConfig,
        displayPrice: finalPrice,
        hasDiscount: hasDisc,
        discountPercentage: discountPct,
        savingsAmount: savings,
        isFlashSale: typeSlug === "flash-sale",
        normalizedRating: normRating,
      };
    }, [dealType, price, discount, finalRating]);

    const handleClick = useCallback(() => onDealClick?.(id), [onDealClick, id]);

    const handleImageError = useCallback((e) => {
      e.target.src = "/images/fallback-image.jpg";
    }, []);

    // Memoized badges to prevent re-renders
    const badges = useMemo(() => (
      <div className="flex justify-between items-start mb-4">
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${dealTypeBadge.color}`}>
          {dealTypeBadge.label}
        </div>
        {hasDiscount && (
          <div className="rounded-full bg-white text-black px-3 py-1 text-xs font-medium">
            {discountPercentage}% OFF
          </div>
        )}
      </div>
    ), [dealTypeBadge, hasDiscount, discountPercentage]);

    // Memoized rating display
    const ratingDisplay = useMemo(() => {
      if (normalizedRating <= 0) return null;
      
      return (
        <div className="flex items-center gap-1">
          <RatingStars rating={normalizedRating} />
          <span className="text-xs text-gray-300 ml-1">({normalizedRating.toFixed(1)})</span>
        </div>
      );
    }, [normalizedRating]);

    // Memoized price section
    const priceSection = useMemo(() => (
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">
            {currency} {displayPrice.toFixed(2)}
          </p>
          {hasDiscount && (
            <p className="text-sm text-gray-300 line-through">
              {currency} {price.toFixed(2)}
            </p>
          )}
        </div>
        
        {/* Right Arrow Button */}
        <div 
          className="w-9 h-9 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors duration-200"
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <FaArrowRight size={16} className="text-black" />
        </div>
      </div>
    ), [currency, displayPrice, hasDiscount, price, handleClick]);

    // Memoized additional info
    const additionalInfo = useMemo(() => (
      <div className="flex items-center justify-between">
        {/* Savings Info */}
        {hasDiscount && (
          <div className="text-sm text-green-300 font-medium">
            Save {currency} {savingsAmount.toFixed(2)}
          </div>
        )}

        {/* Items Count */}
        {productsCount > 0 && (
          <div className="text-xs text-gray-300 font-medium">
            {productsCount} item{productsCount !== 1 ? 's' : ''} included
          </div>
        )}
      </div>
    ), [hasDiscount, currency, savingsAmount, productsCount]);

    return (
      <div
        onClick={handleClick}
        className="cursor-pointer relative rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-96"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
            e.preventDefault();
          }
        }}
        aria-label={`View ${name} deal details`}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={image}
            alt={name}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            width="400"
            height="384"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
          {badges}

          {/* Content */}
          <div className="space-y-3">
            {/* Title */}
            <h3 className="font-bold text-xl leading-tight">
              {name}
            </h3>

            {/* Description */}
            <p className="text-gray-200 text-sm leading-relaxed line-clamp-2">
              {dealTypeBadge.label.toLowerCase()} comes in a variety of options, making it a great choice to complement your home decor at the next level.
            </p>

            {ratingDisplay}
            {priceSection}
            {additionalInfo}
          </div>
        </div>
      </div>
    );
  }
);

// Add display name for better debugging
DealItem.displayName = 'DealItem';
RatingStars.displayName = 'RatingStars';

export default DealItem;
export { DealItemSkeleton }; // Export skeleton for use in parent components