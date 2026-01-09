// components/Loader.jsx
import { assets } from '../assets/assets';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white ">
      <div className="relative flex items-center justify-center">
        {/* Circular loading border */}
        <div className="w-20 h-20 border-4 border-gray-300 border-t-black rounded-full animate-spin bg-white"></div>
        {/* Logo in center */}
        {/* <img 
          src={assets.logo} 
          alt="Loading" 
          className="w-8 h-8 absolute"
        /> */}

      </div>
    </div>
  );
};

export default Loader;