import React, { useEffect, useState } from 'react';
import axios from "axios";
import { assets } from '../assets/assets';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Favicon = () => {
  const [favicon, setFavicon] = useState('');

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/business-details`);
        
        if (response.data.success && response.data.data?.logos?.favicon?.url) {
          const faviconUrl = response.data.data.logos.favicon.url;
          setFavicon(faviconUrl);
          updateDocumentFavicon(faviconUrl);
        } else {
          // Fallback to assets logo
          useAssetsLogoFallback();
        }
      } catch (error) {
        // Fallback to assets logo on error
        useAssetsLogoFallback();
      }
    };

    if (backendUrl) {
      fetchFavicon();
    }
  }, []);

  const useAssetsLogoFallback = () => {
    if (assets.logo) {
      updateDocumentFavicon(assets.logo);
    }
    // If no assets logo, do nothing - keep the static favicon
  };

  const updateDocumentFavicon = (faviconUrl) => {
    if (faviconUrl) {
      try {
        // ✅ CRITICAL FIX: Only remove dynamic favicons, keep static ones
        const existingLinks = document.querySelectorAll(`
          link[rel="icon"][href*="${backendUrl}"],
          link[rel="apple-touch-icon"][href*="${backendUrl}"],
          link[rel="icon"][href*="${assets.logo}"]
        `);
        
        existingLinks.forEach(link => link.remove());
        
        // Create new favicon links
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = faviconUrl;
        
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = faviconUrl;
        
        document.head.appendChild(link);
        document.head.appendChild(appleTouchIcon);

      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    }
  };

  return null;
};

export default Favicon;