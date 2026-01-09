import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faPlus,
  faList,
  faShoppingCart,
  faBars,
  faTimes,
  faLayerGroup,
  faStore
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { backendUrl } from "../App";
import { assets } from "../assets/assets"; // Import your assets

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminLogo, setAdminLogo] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch admin logo from backend
  useEffect(() => {
    const fetchAdminLogo = async () => {
      try {
        console.log('🔄 Fetching admin logo for navbar...');
        const response = await axios.get(`${backendUrl}/api/business-details`);
        
        if (response.data.success && response.data.data?.logos?.admin?.url) {
          setAdminLogo(response.data.data.logos.admin.url);
          console.log('✅ Admin logo loaded for navbar:', response.data.data.logos.admin.url);
        } else {
          console.log('ℹ️ No admin logo found, will use asset logo');
          setAdminLogo(""); // This will trigger the asset logo fallback
        }
      } catch (error) {
        console.error('❌ Error fetching admin logo:', error);
        setAdminLogo(""); // This will trigger the asset logo fallback
      } finally {
        setLoading(false);
      }
    };

    fetchAdminLogo();
  }, []);

  // Logo display component
  const LogoDisplay = ({ isMobile = false }) => {
    if (loading) {
      return (
        <div className={`animate-pulse bg-gray-300 rounded flex items-center justify-center ${isMobile ? 'w-20 h-8' : 'w-32 h-10'}`}>
          <FontAwesomeIcon icon={faStore} className="text-gray-400 text-sm" />
        </div>
      );
    }

    // If we have a backend admin logo, use it
    if (adminLogo) {
      return (
        <img 
          src={adminLogo} 
          alt="Admin Logo" 
          className={isMobile ? "w-20 h-20 object-contain" : "w-20 h-20 object-contain"}
          onError={(e) => {
            console.error('❌ Failed to load admin logo from backend, using asset logo');
            // If backend logo fails to load, show asset logo instead
            e.target.style.display = 'none';
            // The parent component will show the asset logo as fallback
          }}
        />
      );
    }

    // Fallback to your original asset logo when no backend logo is available
    return (
      <img
        src={assets.logo}
        alt="Logo"
        className={isMobile ? "w-20 h-auto object-contain" : "w-20 h-auto object-contain"}
      />
    );
  };

  return (
    <>
      {/* Mobile Header with Logo + Settings + Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50  shadow-sm">
        <div className="flex justify-between items-center">
          {/* Logo links to dashboard */}
          <Link to="/" className="p-1">
            <LogoDisplay isMobile={true} />
          </Link>

          <div className="flex items-center gap-4">
            {/* Settings (Mobile) */}
            <Link to="/settings" className="p-2">
              <FontAwesomeIcon
                icon={faCog}
                className="text-gray-600 text-xl hover:text-black transition"
              />
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon
                icon={isMenuOpen ? faTimes : faBars}
                className="text-gray-700 text-xl"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-lg animate-slideDown">
          <div className="flex flex-col p-4 space-y-2">
            <NavLink
              to="/content-management"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-black border-l-4 border-black"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faLayerGroup} />
              <span className="font-medium">Content Management</span>
            </NavLink>

            <NavLink
              to="/add"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-black border-l-4 border-black"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="font-medium">Add Items</span>
            </NavLink>

            <NavLink
              to="/list"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-black border-l-4 border-black"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faList} />
              <span className="font-medium">List Items</span>
            </NavLink>

            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-black border-l-4 border-black"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              <span className="font-medium">Orders</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden md:block w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-2">
            {/* Logo links to dashboard */}
            <div className="flex-shrink-0">
              <Link to="/" className="p-2 block">
                <LogoDisplay isMobile={false} />
              </Link>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1">
              <NavLink
                to="/content-management"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`
                }
              >
                <FontAwesomeIcon icon={faLayerGroup} />
                <span className="font-medium">Content Management</span>
              </NavLink>

              <NavLink
                to="/add"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`
                }
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="font-medium">Add Items</span>
              </NavLink>

              <NavLink
                to="/list"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`
                }
              >
                <FontAwesomeIcon icon={faList} />
                <span className="font-medium">List Items</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                    isActive
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-black"
                  }`
                }
              >
                <FontAwesomeIcon icon={faShoppingCart} />
                <span className="font-medium">Orders</span>
              </NavLink>
            </nav>

            <Link to="/settings" className="flex-shrink-0 p-2">
              <FontAwesomeIcon
                icon={faCog}
                className="text-gray-500 text-xl hover:text-black transition"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Add padding for mobile header */}
      <div className="md:hidden h-14"></div>
    </>
  );
};

export default Navbar;