// components/OptimizedImage.jsx
import { useState } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  width,
  height,
  mobileWidth = 400,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Convert to WebP and generate responsive srcSet
  const generateSrcSet = (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl;
    
    // For now, return original - implement CDN for WebP conversion
    return imageUrl;
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : '1/1',
        backgroundColor: '#f3f4f6'
      }}
    >
      {/* Skeleton Loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={generateSrcSet(src)}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setError(true);
          setIsLoaded(true);
        }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;