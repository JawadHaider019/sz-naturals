import { useContext, useState, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Cache configuration
const CACHE_KEY = 'bestSellerCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

const BestSeller = () => {
  const { products, productsLoading } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);
  const [hasCachedData, setHasCachedData] = useState(false);
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [shouldUseSlider, setShouldUseSlider] = useState(false);
  const isProcessing = useRef(false);
  const initialCacheLoaded = useRef(false);

  // 1. Load cached data IMMEDIATELY on component mount
  useEffect(() => {
    if (initialCacheLoaded.current) return;
    
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const isCacheValid = Date.now() - timestamp < CACHE_DURATION;
          
          if (isCacheValid && data && data.length > 0) {
            setBestSeller(data);
            setHasCachedData(true);
            initialCacheLoaded.current = true;
            return true;
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
      return false;
    };

    loadCachedData();
  }, []);

  // 2. Process bestseller products - FIXED VERSION
  useEffect(() => {
    if (!products || !Array.isArray(products) || isProcessing.current) {
      return;
    }

    isProcessing.current = true;

    try {
      // Filter out draft products and only show published products
      const publishedProducts = products.filter(product => {
        const isPublished = product.status === 'published' || !product.status;
        return isPublished;
      });

      // STRICT filtering - only products explicitly marked as bestsellers
      const bestProducts = publishedProducts.filter((item) => {
        // Check each possible bestseller field explicitly
        const isExplicitBestSeller = 
          (item.bestseller === true || item.bestseller === "true") ||
          (item.bestSeller === true || item.bestSeller === "true") ||
          (item.best_seller === true || item.best_seller === "true") ||
          (item.isBestseller === true || item.isBestseller === "true") ||
          (item.isBestSeller === true || item.isBestSeller === "true");

        return isExplicitBestSeller;
      });

      // If no explicit best sellers found, show empty state
      if (bestProducts.length === 0) {
        // Only update if we currently have bestsellers
        if (bestSeller.length > 0) {
          setBestSeller([]);
          // Clear cache when no bestsellers
          localStorage.removeItem(CACHE_KEY);
        }
        return;
      }

      // Limit to 3 bestseller products
      const finalBestSellers = bestProducts.slice(0, 3);

      // Check if products have actually changed
      const currentProductsStr = JSON.stringify(bestSeller);
      const newProductsStr = JSON.stringify(finalBestSellers);
      
      if (currentProductsStr !== newProductsStr && finalBestSellers.length > 0) {
        // Update state
        setBestSeller(finalBestSellers);
        
        // Update cache
        try {
          const cacheData = {
            data: finalBestSellers,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
          // Silently fail - cache update is not critical
        }
      }
    } catch (err) {
      console.error('Error processing best sellers:', err);
    } finally {
      isProcessing.current = false;
    }
  }, [products, bestSeller]); // Dependencies: products and bestSeller

  // Function to get the second image from product data
  const getSecondImage = (product) => {
    // Try multiple possible image data structures
    if (product.image && Array.isArray(product.image) && product.image.length > 1) {
      return product.image[1];
    } else if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      return product.images[1];
    } else if (product.secondaryImage) {
      return product.secondaryImage;
    } else if (product.second_image) {
      return product.second_image;
    }
    
    return product.image && product.image.length > 0 ? product.image[0] : null;
  };

  // Function to get the primary image from product data
  const getPrimaryImage = (product) => {
    if (product.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image[0];
    } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    } else if (product.primaryImage) {
      return product.primaryImage;
    } else if (product.main_image) {
      return product.main_image;
    }
    
    return "/images/fallback-image.jpg";
  };

  // Check if we should show slider based on screen size and item count
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const itemCount = bestSeller.length;
      
      if (itemCount <= 1) {
        setShouldUseSlider(false);
        return;
      }
      
      // Mobile (< 640px): Show slider if more than 1 item
      if (width < 640 && itemCount > 1) {
        setShouldUseSlider(true);
      }
      // Tablet (640px - 1023px): Show slider if more than 2 items
      else if (width >= 640 && width < 1024 && itemCount > 2) {
        setShouldUseSlider(true);
      }
      // Laptop/Desktop (≥ 1024px): Show slider if more than 3 items
      else if (width >= 1024 && itemCount > 3) {
        setShouldUseSlider(true);
      }
      else {
        setShouldUseSlider(false);
      }
    };

    if (bestSeller.length > 0) {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
    }
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [bestSeller.length]);

  // Custom Next Arrow Component - Hide on mobile
  const NextArrow = ({ onClick }) => {
    return (
      <button
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/90 hover:bg-black text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border border-white/20 hidden sm:flex"
        onClick={onClick}
        aria-label="Next products"
      >
        <FaChevronRight size={14} className="md:w-4 md:h-4" />
      </button>
    );
  };

  // Custom Previous Arrow Component - Hide on mobile
  const PrevArrow = ({ onClick }) => {
    return (
      <button
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/90 hover:bg-black text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border border-white/20 hidden sm:flex"
        onClick={onClick}
        aria-label="Previous products"
      >
        <FaChevronLeft size={14} className="md:w-4 md:h-4" />
      </button>
    );
  };

  // Calculate grid columns based on number of items
  const getGridColumns = () => {
    const count = bestSeller.length;
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
  };

  // Enhanced Slick Slider settings
  const sliderSettings = {
    dots: true, 
    infinite: bestSeller.length > 1,
    speed: 500,
    slidesToShow: Math.min(4, bestSeller.length),
    slidesToScroll: 1,
    autoplay: bestSeller.length > 1,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    arrows: false,
    beforeChange: (current, next) => setCurrentSlide(next),
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(3, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 1,
          autoplay: bestSeller.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 1,
          autoplay: bestSeller.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 1,
          autoplay: bestSeller.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: bestSeller.length > 1,
          autoplay: bestSeller.length > 1,
          dots: true,
          arrows: false,
          swipe: true,
          touchMove: true,
          adaptiveHeight: true
        }
      }
    ],
    appendDots: dots => (
      <div className="mt-8 md:mt-10">
        <ul style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          padding: 0,
          margin: 0,
          listStyle: 'none'
        }}> 
          {dots}
        </ul>
      </div>
    ),
    customPaging: i => (
      <button 
        style={{
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}
        aria-label={`Go to slide ${i + 1}`}
      >
        <div 
          style={{
            width: i === currentSlide ? '24px' : '8px',
            height: i === currentSlide ? '4px' : '8px',
            backgroundColor: i === currentSlide ? '#000' : '#d1d5db',
            borderRadius: i === currentSlide ? '2px' : '50%',
            transition: 'all 0.3s ease'
          }}
        />
      </button>
    )
  };

  // Add inline styles to override slick dots
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .slick-dots {
        position: relative !important;
        bottom: 0 !important;
        margin-top: 2rem !important;
      }
      .slick-dots li button:before {
        display: none !important;
      }
      .slick-dots li {
        margin: 0 !important;
        width: auto !important;
        height: auto !important;
      }
      .slick-dots li button {
        padding: 0 !important;
        width: 30px !important;
        height: 30px !important;
      }
      .slick-dots li button:hover,
      .slick-dots li button:focus {
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Show skeletons ONLY when:
  // 1. Backend is loading (productsLoading = true)
  // 2. No products yet (bestSeller.length === 0)
  // 3. No cached data available (!hasCachedData)
  if (productsLoading && bestSeller.length === 0 && !hasCachedData) {
    // Show skeleton only on first visit (no cache)
    return (
      <div className="rounded-3xl bg-white px-1 py-16 md:py-24">
        {/* Centered heading skeleton */}
        <div className="text-center mb-8 md:mb-12">
          <div className="mb-4">
            <div className="h-10 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
          </div>
          <div className="h-5 w-72 bg-gray-200 rounded mx-auto mt-4 animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 rounded mx-auto mt-2 animate-pulse"></div>
        </div>
        
        {/* Products grid skeleton - show 3 skeleton items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto gap-4 md:gap-6 px-4 sm:px-6">
          {[1, 2, 3].map((i) => (
            <ProductItem key={`skeleton-${i}`} isLoading={true} />
          ))}
        </div>
      </div>
    );
  }

  // Don't render anything if no best sellers (even after backend load)
  if (bestSeller.length === 0 && !productsLoading) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white px-1 py-16 md:py-24">
      {/* Centered heading and description */}
      <div className="text-center mb-8 md:mb-12">
        <div className="mb-4">
          <Title text1={'CUSTOMERS'} text2={'FAVORITES'} />
        </div>
        {/* CacheIndicator removed - no loading messages */}
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">
         The herbal products our community loves most - proven effective for hair growth, shine, and scalp health.
        </p>
      </div>
      
      {shouldUseSlider ? (
        // Show slider based on screen size logic
        <div className="relative px-1 sm:px-2">
          <Slider ref={sliderRef} {...sliderSettings}>
            {bestSeller.map((item) => {
              const primaryImage = getPrimaryImage(item);
              const secondImage = getSecondImage(item);
              
              return (
                <div key={item._id || item.id} className="px-0.5">
                  <div className="mx-0">
                    <ProductItem
                      id={item._id || item.id}
                      image={primaryImage}
                      secondImage={secondImage !== primaryImage ? secondImage : null}
                      name={item.name || "Unnamed Product"}
                      price={item.price || 0}
                      discount={item.discountprice || item.discountPrice || 0}
                      rating={item.rating || 0}
                      status={item.status}
                    />
                  </div>
                </div>
              );
            })}
          </Slider>
          
          {/* Add custom arrows outside the slider - hidden on mobile */}
          {bestSeller.length > 1 && (
            <>
              <PrevArrow onClick={() => sliderRef.current?.slickPrev()} />
              <NextArrow onClick={() => sliderRef.current?.slickNext()} />
            </>
          )}
        </div>
      ) : (
        // Show regular grid when slider is not needed
        <div className={`grid ${getGridColumns()} gap-4 md:gap-6 px-4 sm:px-6`}>
          {bestSeller.map((item) => {
            const primaryImage = getPrimaryImage(item);
            const secondImage = getSecondImage(item);
            
            return (
              <ProductItem
                key={item._id || item.id}
                id={item._id || item.id}
                image={primaryImage}
                secondImage={secondImage !== primaryImage ? secondImage : null}
                name={item.name || "Unnamed Product"}
                price={item.price || 0}
                discount={item.discountprice || item.discountPrice || 0}
                rating={item.rating || 0}
                status={item.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BestSeller;