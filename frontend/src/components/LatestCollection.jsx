import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from './Title';
import ProductItem from "./ProductItem";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const LatestCollection = () => {
  const { products, productsLoading } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [shouldUseSlider, setShouldUseSlider] = useState(false);

  // Use useMemo to filter and process products - MAX 4 PRODUCTS
  const processedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    try {
      // Filter out draft products and only show published products
      const publishedProducts = products.filter(product => {
        const isPublished = product.status === 'published' || !product.status;
        return isPublished;
      });

      // Remove duplicate products by ID and get latest 4 from published products
      const uniqueProducts = publishedProducts.filter((product, index, self) =>
        index === self.findIndex(p => p._id === product._id)
      );
      
      // Get latest 4 products (or all if less than 4)
      const latestUniqueProducts = uniqueProducts.slice(0, 4);

      return latestUniqueProducts;

    } catch (err) {
      return [];
    }
  }, [products]);

  useEffect(() => {
    setLatestProducts(processedProducts);
  }, [processedProducts]);

  // Check if we should show slider based on screen size and item count
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const itemCount = latestProducts.length;
      
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
      // Laptop/Desktop (≥ 1024px): Show slider if more than 4 items
      else if (width >= 1024 && itemCount > 4) {
        setShouldUseSlider(true);
      }
      else {
        setShouldUseSlider(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [latestProducts.length]);

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

  // Function to get the second image from product data
  const getSecondImage = (product) => {
    // Try multiple possible image data structures
    if (product.image && Array.isArray(product.image) && product.image.length > 1) {
      return product.image[1]; // Second image from array
    } else if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      return product.images[1]; // Second image from 'images' array
    } else if (product.secondaryImage) {
      return product.secondaryImage; // Direct secondaryImage field
    } else if (product.second_image) {
      return product.second_image; // Alternative field name
    }
    
    // If no second image is available, return null or the first image
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

  // Calculate grid columns based on number of items
  const getGridColumns = () => {
    const count = latestProducts.length;
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
    if (count === 4) return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-6xl mx-auto";
  };

  // Enhanced Slick Slider settings
  const sliderSettings = {
    dots: true, 
    infinite: latestProducts.length > 1,
    speed: 500,
    slidesToShow: Math.min(4, latestProducts.length),
    slidesToScroll: 1,
    autoplay: latestProducts.length > 1,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    arrows: false,
    beforeChange: (current, next) => setCurrentSlide(next),
    responsive: [
      {
        breakpoint: 1280, // Desktop
        settings: {
          slidesToShow: Math.min(4, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 1,
          autoplay: latestProducts.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 1024, // Laptop
        settings: {
          slidesToShow: Math.min(3, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 1,
          autoplay: latestProducts.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 768, // Tablet
        settings: {
          slidesToShow: Math.min(2, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 1,
          autoplay: latestProducts.length > 1,
          dots: true
        }
      },
      {
        breakpoint: 640, // Mobile
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: latestProducts.length > 1,
          autoplay: latestProducts.length > 1,
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

  // Loading skeletons for the LatestCollection component
  if (productsLoading) {
    return (
      <div className="my-16 md:my-24">
        {/* Centered heading skeleton */}
        <div className="text-center mb-8 md:mb-12">
          <div className="mb-4">
            <div className="h-10 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
          </div>
          <div className="h-5 w-72 bg-gray-200 rounded mx-auto mt-4 animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 rounded mx-auto mt-2 animate-pulse"></div>
        </div>
        
        {/* Products grid skeleton - show 4 skeleton items */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto gap-4 md:gap-6 px-4 sm:px-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductItem key={`skeleton-${i}`} isLoading={true} />
          ))}
        </div>
      </div>
    );
  }

  // Don't render anything if no products after loading
  // This will hide the section completely when no products
  if (latestProducts.length === 0) {
    return null;
  }

  return (
    <div className="my-16 md:my-24">
      <div className="text-center mb-8 md:mb-12">
        <div className="mb-4">
          <Title text1={'Recently '} text2={'Added'} />
        </div>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">
          Explore our latest additions to the herbal collection - designed for visible hair transformation.
        </p>
      </div>
      {shouldUseSlider ? (
        // Show slider based on screen size logic
        <div className="relative px-1 sm:px-2">
          <Slider ref={sliderRef} {...sliderSettings}>
            {latestProducts.map((item) => {
              const primaryImage = getPrimaryImage(item);
              const secondImage = getSecondImage(item);
              
              return (
                <div key={item._id} className="px-0.5">
                  <div className="mx-0">
                    <ProductItem
                      id={item._id}
                      image={primaryImage}
                      secondImage={secondImage !== primaryImage ? secondImage : null}
                      name={item.name}
                      price={item.price}
                      discount={item.discountprice}
                      rating={item.rating || 0}
                      status={item.status}
                    />
                  </div>
                </div>
              );
            })}
          </Slider>
          
          {/* Add custom arrows outside the slider - hidden on mobile */}
          {latestProducts.length > 1 && (
            <>
              <PrevArrow onClick={() => sliderRef.current?.slickPrev()} />
              <NextArrow onClick={() => sliderRef.current?.slickNext()} />
            </>
          )}
        </div>
      ) : (
        // Show regular grid when slider is not needed
        <div className={`grid ${getGridColumns()} gap-4 md:gap-6 px-4 sm:px-6`}>
          {latestProducts.map((item) => {
            const primaryImage = getPrimaryImage(item);
            const secondImage = getSecondImage(item);
            
            return (
              <ProductItem
                key={item._id}
                id={item._id}
                image={primaryImage}
                secondImage={secondImage !== primaryImage ? secondImage : null}
                name={item.name}
                price={item.price}
                discount={item.discountprice}
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

export default LatestCollection;