import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { IoIosArrowForward } from "react-icons/io";
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { assets } from "../assets/assets";  

// Simple cache implementation
const createCache = (duration = 5 * 60 * 1000) => ({
  data: null,
  timestamp: 0,
  duration
});

const bannerCache = createCache(5 * 60 * 1000);

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mountedRef = useRef(true);
  const [loadedImages, setLoadedImages] = useState(new Set());

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize with cache if available
  useEffect(() => {
    const now = Date.now();
    
    // Initialize banners from cache
    if (bannerCache.data && now - bannerCache.timestamp < bannerCache.duration) {
      setBanners(bannerCache.data);
      setLoading(false);
    }
  }, []);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${backendUrl}/api/banners/active`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        bannerCache.data = data.data;
        bannerCache.timestamp = Date.now();
        if (mountedRef.current) {
          setBanners(data.data);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      // Silently handle all errors - don't set error state
      if (mountedRef.current) {
        // Ensure we have empty array on error to show fallback UI
        setBanners([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [backendUrl]);

  // Fetch banners on mount if not cached
  useEffect(() => {
    const now = Date.now();
    if (!bannerCache.data || now - bannerCache.timestamp >= bannerCache.duration) {
      fetchBanners();
    }
  }, [fetchBanners]);

  // Handle image load
  const handleImageLoad = useCallback((imageUrl) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  // Custom Dots Component
  const CustomDots = () => {
    if (banners.length <= 1) return null;

    return (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => sliderRef.current?.slickGoTo(index)}
              className="focus:outline-none transition-all duration-300"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div 
                className={`transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-8 h-1' 
                    : 'bg-white/40 w-2 h-2 hover:bg-white/60'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Slider settings
  const settings = useMemo(() => ({
    dots: false,
    infinite: banners.length > 1,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 6000,
    pauseOnHover: true, // Changed to true for better UX
    arrows: false,
    fade: true,
    lazyLoad: 'progressive',
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    adaptiveHeight: false,
    touchThreshold: 10,
    swipe: banners.length > 1,
    accessibility: true,
    waitForAnimate: true,
    beforeChange: (_, next) => setCurrentSlide(next),
  }), [banners.length]);

  // Optimized Banner Image Component
  const BannerImage = useCallback(({ banner, index }) => (
    <img
      src={banner.imageUrl}
      alt={banner.headingLine1 || "Premium Banner"}
      className={`w-full h-full object-cover transition-opacity duration-500 ${
        loadedImages.has(banner.imageUrl) ? 'opacity-100' : 'opacity-0'
      }`}
      loading={index === 0 ? "eager" : "lazy"}
      decoding="async"
      width={1920}
      height={1080}
      onLoad={() => handleImageLoad(banner.imageUrl)}
      onError={() => handleImageLoad(banner.imageUrl)}
    />
  ), [loadedImages, handleImageLoad]);

const handleButtonClick = useCallback((e, url) => {
  console.log('Button clicked!', { url, eventType: e.type });
  
  e.preventDefault();
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
  
  console.log('Navigation starting...');
  
  setTimeout(() => {
    if (url.startsWith('http')) {
      console.log('Opening external URL:', url);
      window.open(url, '_blank');
    } else {
      console.log('Navigating to internal route:', url);
      navigate(url);
    }
  }, 10);
}, [navigate]);

  // Banner Item Component
  const BannerItem = useCallback(({ banner, index }) => {
    // Determine if URL is external
    const isExternalUrl = banner.redirectUrl?.startsWith('http');
    
    return (
      <section className="relative w-full h-full">
        {/* Background Image Container - Removed rounded corners */}
        <div className="w-full h-[100vh] md:h-screen overflow-hidden">
          <BannerImage banner={banner} index={index} />
          
          {/* Loading placeholder */}
          {!loadedImages.has(banner.imageUrl) && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
          )}
        </div>

        {/* Overlays - Removed rounded corners */}
        <div className="absolute inset-0 bg-black/30 z-2"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10 z-3"></div>

        {/* Content - Aligned to right side */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="w-full px-4 md:px-8 lg:px-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-start">
                <div className="text-left max-w-2xl">
                  {/* Headline */}
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white uppercase mb-4 md:mb-6">
                    {banner.headingLine1}
                    {banner.headingLine2 && (
                      <> <span className="font-bold block">{banner.headingLine2}</span></>
                    )}
                  </h1>
                
                  {/* Subtext */}
                  {banner.subtext && (
                    <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light leading-relaxed mb-8 md:mb-12 ml-auto max-w-lg">
                      {banner.subtext}
                    </p>
                  )}

                  {/* CTA Button - WORKING SOLUTION */}
                  {banner.buttonText && banner.redirectUrl && (
                    <div className="relative z-30">
                      {isExternalUrl ? (
                        // External URL - use anchor tag
                        <a
                          href={banner.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleButtonClick(e, banner.redirectUrl)}
                          className="inline-flex items-center gap-3 px-8 md:px-10 py-3 md:py-4 text-white border border-white/50 transition-all duration-300 hover:bg-white/10 hover:border-white/80 group ml-auto cursor-pointer"
                          aria-label={banner.buttonText}
                        >
                          <span className="text-sm md:text-base font-medium tracking-wider uppercase">
                            {banner.buttonText}
                          </span>
                          <IoIosArrowForward size={18} className="transition-transform group-hover:translate-x-2" />
                        </a>
                      ) : (
                        // Internal URL - use button with programmatic navigation
                        <button
                          onClick={(e) => handleButtonClick(e, banner.redirectUrl)}
                          className="inline-flex items-center gap-3 px-8 md:px-10 py-3 md:py-4 text-white border border-white/50 transition-all duration-300 hover:bg-white/10 hover:border-white/80 group ml-auto cursor-pointer"
                          aria-label={banner.buttonText}
                        >
                          <span className="text-sm md:text-base font-medium tracking-wider uppercase">
                            {banner.buttonText}
                          </span>
                          <IoIosArrowForward size={18} className="transition-transform group-hover:translate-x-2" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }, [BannerImage, loadedImages, handleButtonClick]);

  // Fallback banner content when no banners are available
  const fallbackBanners = useMemo(() => [{
    _id: 'fallback',
    imageUrl: assets.hero_img,
    headingLine1: 'Premium',
    headingLine2: 'Experience',
    subtext: 'Discover our exclusive collection and services',
    buttonText: 'Explore Now',
    redirectUrl: '/collection'
  }], []);

  // Render slider
  const renderSlider = () => {
    const bannersToShow = banners.length > 0 ? banners : fallbackBanners;

    return (
      <div className="relative">
        <Slider ref={sliderRef} {...settings}>
          {bannersToShow.map((banner, index) => (
            <div key={banner._id || `banner-${index}`} className="px-0 mx-0">
              <BannerItem banner={banner} index={index} />
            </div>
          ))}
        </Slider>
        {bannersToShow.length > 1 && <CustomDots />}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative w-full h-[100vh] md:h-screen">
        <div className="absolute inset-0">
          <div className="w-full h-[100vh] md:h-screen bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse overflow-hidden">
            <div className="absolute inset-0 bg-black/40 z-2"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10 z-3"></div>
            
            <div className="absolute inset-0 z-10 flex items-center">
              <div className="w-full px-4 md:px-8 lg:px-16">
                <div className="max-w-7xl mx-auto">
                  <div className="flex justify-end">
                    <div className="text-right max-w-2xl">
                      <div className="h-16 md:h-20 bg-white/10 animate-pulse mb-6 w-64 md:w-96 ml-auto"></div>
                      <div className="h-10 md:h-12 bg-white/10 animate-pulse w-48 md:w-60 ml-auto mt-10"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main return
  return (
    <div className="relative w-full">
      <style>{`
        /* Remove all rounded corners from slick slider */
        .slick-slide > div {
          border-radius: 0;
        }
        .slick-list {
          border-radius: 0;
        }
        .slick-slider {
          margin: 0;
          padding: 0;
        }
        /* CRITICAL FIX for button clicks in slick slider */
        .slick-slide * {
          pointer-events: auto !important;
        }
        .slick-slide {
          pointer-events: auto !important;
        }
        .slick-slide button, 
        .slick-slide a {
          pointer-events: auto !important;
          z-index: 9999 !important;
          position: relative !important;
        }
      `}</style>
      
      {renderSlider()}
    </div>
  );
};

export default Hero;