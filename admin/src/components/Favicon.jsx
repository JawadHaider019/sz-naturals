import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';

const Favicon = () => {
  const [favicon, setFavicon] = useState('');

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        console.log('🔄 Fetching favicon...');
        const response = await axios.get(`${backendUrl}/api/business-details`);
        
        if (response.data.success && response.data.data?.logos?.favicon?.url) {
          const faviconUrl = response.data.data.logos.favicon.url;
          setFavicon(faviconUrl);
          updateDocumentFavicon(faviconUrl);
          console.log('✅ Favicon loaded');
        }
      } catch (error) {
        console.error('❌ Error fetching favicon:', error);
      }
    };

    fetchFavicon();
  }, []);

  const updateDocumentFavicon = (faviconUrl) => {
    if (faviconUrl) {
      // Remove existing favicons
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = faviconUrl;
      
      document.head.appendChild(link);
      console.log('📄 Favicon updated in document head');
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default Favicon;