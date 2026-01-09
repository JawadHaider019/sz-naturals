import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Use a higher threshold for mobile to avoid interfering with bottom navigation
      const threshold = window.innerWidth < 768 ? 500 : 300;
      setIsVisible(window.scrollY > threshold);
    };

    // Use passive scroll listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    // Use native smooth scroll for better mobile performance
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`fixed z-50 transition-all duration-300 ease-in-out ${
      // Mobile-first positioning
      'bottom-6 right-4 md:bottom-8 md:right-8'
    } ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
    }`}>
      <button
        onClick={scrollToTop}
        className={`
          bg-black text-white rounded-full shadow-lg 
          transition-all duration-300 hover:scale-110 
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
          active:scale-95
          // Mobile-optimized sizing
          w-12 h-12 md:w-14 md:h-14
          // Larger touch target for mobile
          min-w-[48px] min-h-[48px]
        `}
        aria-label="Scroll to top"
        // Better accessibility
        title="Scroll to top"
      >
        <FontAwesomeIcon 
          icon={faArrowUp} 
          className="text-white"
          // Responsive icon size
          size={window.innerWidth < 768 ? "sm" : "lg"}
        />
      </button>
    </div>
  );
};

export default ScrollToTop;