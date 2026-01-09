import { useContext, useState, useEffect, useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { toast } from "react-toastify";
import axios from "axios";
import { 
  FaUser, 
  FaShoppingCart, 
  FaBars, 
  FaTimes,
  FaChevronDown,
  FaBox,
  FaSignOutAlt
} from 'react-icons/fa';
import { assets } from '../assets/assets'
import LoginModal from './Login';

// Cache for logo to prevent refetching
let logoCache = {
  url: '',
  timestamp: 0,
  cacheTime: 5 * 60 * 1000 // 5 minutes
};

const Navbar = () => {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [websiteLogo, setWebsiteLogo] = useState("")
  const [loading, setLoading] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  
  const { getCartCount, token, setToken, setCartItems, user } = useContext(ShopContext)
  const location = useLocation();

  // Memoized navigation items
  const navItems = useMemo(() => [
    { path: '/', label: 'HOME' },
    { path: '/about', label: 'ABOUT' },
    { path: '/shop', label: 'SHOP' },
    { path: '/blog', label: 'BLOG' },
    { path: '/contact', label: 'CONTACT' }
  ], []);

  // Throttled scroll handler
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 10;
          setScrolled(isScrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch website logo from backend with caching
  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // Check cache first
      const now = Date.now();
      if (logoCache.url && now - logoCache.timestamp < logoCache.cacheTime) {
        setWebsiteLogo(logoCache.url);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const response = await axios.get(`${backendUrl}/api/business-details`, {
          timeout: 3000,
          headers: {
            'Cache-Control': 'max-age=300'
          }
        });
        
        if (response.data.success && response.data.data?.logos?.website?.url) {
          const logoUrl = response.data.data.logos.website.url;
          logoCache = {
            url: logoUrl,
            timestamp: now,
            cacheTime: 5 * 60 * 1000
          };
          setWebsiteLogo(logoUrl);
        } else {
          setWebsiteLogo("");
        }
      } catch (error) {
        console.error('Error fetching website logo:', error);
        setWebsiteLogo("");
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteLogo();
  }, []);

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setCartItems({})
    toast.success("Logged out successfully")
    setShowProfileDropdown(false)
    setVisible(false)
  }

  // Close mobile menu when navigating
  const handleMobileNavClick = () => {
    setVisible(false);
  };

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (visible) setVisible(false);
        if (showProfileDropdown) setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [visible, showProfileDropdown]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileDropdown && !e.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown]);

  // Optimized Logo display component
  const LogoDisplay = () => {
    if (!loading && websiteLogo) {
      return (
        <img 
          src={websiteLogo} 
          alt="Website Logo" 
          className='w-16 sm:w-20 h-auto object-contain transition-all duration-300'
          onError={(e) => {
            e.target.src = assets.logo;
          }}
        />
      );
    }

    return (
      <img 
        src={assets.logo} 
        className='w-16 sm:w-20 h-auto object-contain transition-all duration-300' 
        alt="Logo" 
      />
    );
  };

  // Open login modal with specific mode
  const openLoginModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsLoginModalOpen(true);
    setShowProfileDropdown(false);
    setVisible(false);
  };

  // Define consistent color variables
  const textColorClass = scrolled ? 'text-white' : 'text-black';
  const hoverColorClass = scrolled ? 'hover:text-white' : 'hover:text-black';
  const activeColorClass = scrolled ? 'text-white' : 'text-black';
  const bgColorClass = scrolled ? 'bg-white' : 'bg-black';
  const iconColorClass = scrolled ? 'text-white' : 'text-black';
  const hoverBgClass = scrolled ? 'hover:bg-white/20' : 'hover:bg-black/10';

  return (
    <>
      <div className={`sticky top-0 z-50 transition-all duration-300`}>
        <div>
          {/* Rounded navbar container - Transparent when not scrolled */}
          <div className={`transition-all duration-300 ${
            scrolled 
              ? 'bg-black/50 backdrop-blur-md shadow-lg' 
              : 'bg-white/50 backdrop-blur-sm shadow-sm'
          }`}>
            <div className="flex items-center justify-between py-1 px-4 sm:px-6">
              {/* Logo */}
              <Link to='/' className="flex-shrink-0 z-10">
                <LogoDisplay />
              </Link>

              {/* Desktop Navigation - Show on large screens */}
              <nav className="hidden xl:flex items-center space-x-6 2xl:space-x-8">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.path}
                    to={item.path} 
                    className={({ isActive }) => 
                      `relative text-sm font-medium tracking-wide transition-colors duration-200 px-1 py-2 ${
                        isActive 
                          ? `${activeColorClass} font-semibold` 
                          : `${textColorClass}/70 ${hoverColorClass}`
                      }`
                    }
                  >
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 rounded-full ${
                      location.pathname === item.path 
                        ? `${bgColorClass} w-full` 
                        : 'w-0'
                    }`} />
                  </NavLink>
                ))}
              </nav>

              {/* Tablet Navigation - Show on medium screens, hide on mobile and desktop */}
              <nav className="hidden md:flex xl:hidden items-center space-x-4">
                {navItems.slice(0, 3).map((item) => (
                  <NavLink 
                    key={item.path}
                    to={item.path} 
                    className={({ isActive }) => 
                      `relative text-xs font-medium tracking-wide transition-colors duration-200 px-1 py-2 ${
                        isActive 
                          ? `${activeColorClass} font-semibold` 
                          : `${textColorClass}/70 ${hoverColorClass}`
                      }`
                    }
                  >
                    {item.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 rounded-full ${
                      location.pathname === item.path 
                        ? `${bgColorClass} w-full` 
                        : 'w-0'
                    }`} />
                  </NavLink>
                ))}
                {/* More items dropdown for tablet */}
                <div className="relative group">
                  <button className={`text-xs font-medium tracking-wide transition-colors duration-200 px-1 py-2 flex items-center gap-1 ${
                    `${textColorClass}/70 ${hoverColorClass}`
                  }`}>
                    MORE
                    <FaChevronDown size={10} className={iconColorClass} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 z-20 hidden group-hover:block">
                    <div className="w-32 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/20 py-2">
                      {navItems.slice(3).map((item) => (
                        <NavLink 
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => 
                            `block px-4 py-2 text-xs transition-colors ${
                              isActive 
                                ? 'bg-gray-100 text-black' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`
                          }
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              </nav>
              
              {/* Right side icons */}
              <div className='flex items-center gap-3 sm:gap-4 md:gap-6'>
                {/* Orders Link - Mobile & Desktop */}
                <Link 
                  to='/orders' 
                  className="relative"
                >
                  <div className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer ${hoverBgClass}`}>
                    <FaBox className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${iconColorClass}`} />
                  </div>
                </Link>

                {/* Desktop Profile dropdown */}
                <div className='hidden sm:block relative profile-dropdown'>
                  <div className={`p-2 sm:p-3 rounded-full transition-all duration-200 cursor-pointer ${hoverBgClass}`}>
                    <FaUser 
                      onClick={() => token ? setShowProfileDropdown(!showProfileDropdown) : openLoginModal('login')} 
                      className={`w-4 h-4 sm:w-5 sm:h-5 cursor-pointer transition-colors ${iconColorClass}`}
                    />
                  </div>
                  
                  {showProfileDropdown && token && (
                    <div className='absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/20 py-2'>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                      </div>
                      
                      <Link 
                        to='/orders'
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <FaBox className="w-3 h-3 sm:w-4 sm:h-4" />
                        My Orders
                      </Link>
                      
                      <div 
                        onClick={logout}
                        className="px-4 py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-2 border-t border-gray-100"
                      >
                        <FaSignOutAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                        Sign Out
                      </div>
                    </div>
                  )}   
                </div>

                {/* Mobile Profile Icon */}
                <div className='sm:hidden'>
                  <FaUser 
                    onClick={() => token ? setShowProfileDropdown(!showProfileDropdown) : openLoginModal('login')} 
                    className={`w-4 h-4 cursor-pointer transition-colors ${iconColorClass}`}
                  />
                </div>

                {/* Cart */}
                <Link 
                  to='/cart' 
                  className={`relative p-2 sm:p-3 rounded-full transition-all duration-200 ${hoverBgClass}`}
                >
                  <FaShoppingCart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${iconColorClass}`} />
                  {getCartCount() > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 rounded-full flex items-center justify-center font-medium text-xs ${
                      scrolled 
                        ? 'bg-white text-black' 
                        : 'bg-black text-white'
                    }`}>
                      {getCartCount() > 99 ? '99+' : getCartCount()}
                    </span>
                  )}
                </Link>

                {/* Mobile menu button */}
                <button 
                  onClick={() => setVisible(true)}
                  className={`md:hidden p-2 rounded-full transition-all duration-200 ${hoverBgClass}`}
                  aria-label="Open menu"
                >
                  <FaBars className={`w-4 h-4 ${iconColorClass}`} />
                </button>

                {/* Tablet menu button */}
                <button 
                  onClick={() => setVisible(true)}
                  className={`hidden md:flex xl:hidden p-2 rounded-full transition-all duration-200 ${hoverBgClass}`}
                  aria-label="Open menu"
                >
                  <FaBars className={`w-5 h-5 ${iconColorClass}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
          
        {/* Mobile & Tablet menu - Modern slide-in */}
        <div className={`md:xl:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
          visible ? "opacity-100 visible" : "opacity-0 invisible"
        }`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              visible ? "opacity-50" : "opacity-0"
            }`}
            onClick={() => setVisible(false)}
          />
          
          {/* Menu Panel - Responsive width */}
          <div className={`absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            visible ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className='flex h-full flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-gray-200 p-4 sm:p-6'>
                <Link to='/' onClick={handleMobileNavClick}>
                  <LogoDisplay />
                </Link>
                <button 
                  onClick={() => setVisible(false)}
                  className='p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600'
                  aria-label="Close menu"
                >
                  <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Navigation items */}
              <nav className="flex-1 overflow-y-auto py-4">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.path}
                    to={item.path} 
                    onClick={handleMobileNavClick}
                    className={({ isActive }) => 
                      `block px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors border-l-4 ${
                        isActive 
                          ? 'text-black bg-gray-50 border-black' 
                          : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-black'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* Mobile footer */}
              {token && (
                <div className='border-t border-gray-200 p-4 sm:p-6'>
                  <div className="space-y-2">
                    <button 
                      onClick={() => { window.location.href = '/orders'; handleMobileNavClick(); }}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm sm:text-base flex items-center gap-2"
                    >
                      <FaBox className="w-4 h-4" />
                      My Orders
                    </button>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base flex items-center gap-2"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Login prompt for non-logged in users */}
              {!token && (
                <div className='border-t border-gray-200 p-4 sm:p-6'>
                  <button 
                    onClick={() => openLoginModal('login')}
                    className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm sm:text-base"
                  >
                    Login / Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}

export default Navbar