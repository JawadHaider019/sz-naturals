import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const autoPlayRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const now = Date.now();
        
        // Check cache first
        if (bannerCache.data && now - bannerCache.timestamp < bannerCache.duration) {
          setBanners(bannerCache.data);
          setLoading(false);
          return;
        }

        const response = await fetch(`${backendUrl}/api/banners/active`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          bannerCache.data = data.data;
          bannerCache.timestamp = Date.now();
          setBanners(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [backendUrl]);

  // Auto-play functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 6000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [banners.length]);

  // Navigation functions
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  };

  // Handle image load
  const handleImageLoad = (imageUrl) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
  };

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (banners.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % banners.length);
      }, 6000);
    }
  };

  // Fallback banner
  const fallbackBanners = [{
    _id: 'fallback',
    imageUrl: assets.hero_img,
    headingLine1: 'Premium',
    headingLine2: 'Experience',
    subtext: 'Discover our exclusive collection and services',
    buttonText: 'Explore Now',
    redirectUrl: '/shop'
  }];

  const bannersToShow = banners.length > 0 ? banners : fallbackBanners;

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
    );
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {bannersToShow.map((banner, index) => (
        <div
          key={banner._id || `banner-${index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={banner.imageUrl}
              alt={banner.headingLine1 || "Premium Banner"}
              className="w-full h-full object-cover"
              onLoad={() => handleImageLoad(banner.imageUrl)}
            />
          </div>

          {/* Overlays */}
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10"></div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center z-20">
            <div className="w-full px-4 md:px-8 lg:px-16">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-start">
                  <div className="text-left max-w-2xl">
                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white uppercase mb-4 md:mb-6">
                      {banner.headingLine1}
                      {banner.headingLine2 && (
                        <span className="font-bold block">{banner.headingLine2}</span>
                      )}
                    </h1>
                  
                    {/* Subtext */}
                    {banner.subtext && (
                      <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light leading-relaxed mb-8 md:mb-12 ml-auto max-w-lg">
                        {banner.subtext}
                      </p>
                    )}

                    {/* CTA Button - ULTRA SIMPLE WORKING VERSION */}
                    {banner.buttonText && banner.redirectUrl && (
                      <div className="relative z-50">
                        {banner.redirectUrl.startsWith('http') ? (
                          // External URL
                          <div 
                            className="mt-4 md:mt-6 inline-flex items-center justify-center gap-2 py-3 sm:py-4 px-16 bg-transparent text-white font-semibold rounded-full border border-white hover:bg-white hover:text-black hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer group"
                            onClick={() => {
                              console.log('External URL clicked:', banner.redirectUrl);
                              window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer');
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'black'}
                          >
                            <span>{banner.buttonText}</span>
                            <IoIosArrowForward size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        ) : (
                          // Internal URL
                          <div 
                            className="mt-4 md:mt-6 inline-flex items-center justify-center gap-2 py-3 sm:py-4 px-16 bg-tranparent text-white font-semibold rounded-full border border-white hover:bg-white hover:text-black hover:border-black transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer group"
                            onClick={() => {
                              console.log('Internal URL clicked:', banner.redirectUrl);
                              navigate(banner.redirectUrl);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = 'black';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'white';
                            }}
                          >
                            <span>{banner.buttonText}</span>
                            <IoIosArrowForward size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {bannersToShow.length > 1 && (
        <>
          <div 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={prevSlide}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
          >
            <IoIosArrowBack size={24} />
          </div>
          <div 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 cursor-pointer"
            onClick={nextSlide}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
          >
            <IoIosArrowForward size={24} />
          </div>
        </>
      )}

      {/* Dot Indicators */}
      {bannersToShow.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center gap-3">
            {bannersToShow.map((_, index) => (
              <div
                key={index}
                className="cursor-pointer"
                onClick={() => goToSlide(index)}
                onMouseOver={(e) => {
                  if (index !== currentSlide) {
                    e.currentTarget.querySelector('div').style.backgroundColor = 'rgba(255,255,255,0.6)';
                  }
                }}
                onMouseOut={(e) => {
                  if (index !== currentSlide) {
                    e.currentTarget.querySelector('div').style.backgroundColor = 'rgba(255,255,255,0.4)';
                  }
                }}
              >
                <div 
                  className={`transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-white w-8 h-1' 
                      : 'bg-white/40 w-2 h-2'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add this debug CSS */}
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        
        .cursor-pointer {
          cursor: pointer !important;
        }
        
        .pointer-events-none {
          pointer-events: none;
        }
        
        .z-30, .z-20, .z-10 {
          pointer-events: auto !important;
        }
        
        /* Force hover states */
        [class*="hover:"]:hover {
          transform: scale(1.05) !important;
        }
      `}</style>
    </div>
  );
};

export default Hero;