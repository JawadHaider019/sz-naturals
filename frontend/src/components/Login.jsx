import axios from "axios";
import { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

// Using React Icons
import { 
  FaTimes,
  FaEnvelope,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaSpinner,
  FaArrowRight,
  FaChevronLeft,
} from "react-icons/fa";

const LoginModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { setToken, setUser, backendUrl } = useContext(ShopContext);
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const modalRef = useRef();

  const isSignUp = mode === 'signup';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const isLogin = mode === 'login';

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0';
    };
  }, [isOpen, onClose]);

  // Focus on first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Normalize email
  const normalizeEmail = (email) => {
    return email.toLowerCase().trim();
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get normalized email
  const getNormalizedEmail = () => {
    return normalizeEmail(formData.email);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${backendUrl}/api/user/resend-otp`, {
        email: getNormalizedEmail()
      });
      
      if (response.data.success) {
        toast.success("New OTP sent to your email");
        setCanResendOtp(false);
        setResendTimer(60);
        
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResendOtp(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if ((isSignUp || isResetPassword) && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (isResetPassword && formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = getNormalizedEmail();

      if (isSignUp) {
        const response = await axios.post(`${backendUrl}/api/user/register`, {
          name: formData.name,
          email: normalizedEmail,
          password: formData.password
        });
        
        if (response.data.success) {
          const token = response.data.token;
          setToken(token);
          localStorage.setItem('token', token);
          
          setUser({
            _id: response.data.user?._id,
            name: response.data.user?.name || formData.name,
            email: normalizedEmail,
            isLoggedIn: true
          });
          
          toast.success("Account created successfully");
          onClose();
        } else {
          toast.error(response.data.message);
        }
      } else if (isLogin) {
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email: normalizedEmail,
          password: formData.password
        });
        
        if (response.data.success) {
          const token = response.data.token;
          setToken(token);
          localStorage.setItem('token', token);
          
          setUser({
            _id: response.data.user?._id,
            name: response.data.user?.name || 'User',
            email: normalizedEmail,
            isLoggedIn: true
          });
          
          toast.success("Welcome back!");
          onClose();
        } else {
          toast.error(response.data.message);
        }
      } else if (isForgotPassword) {
        const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
          email: normalizedEmail
        });
        
        if (response.data.success) {
          toast.success("OTP sent to your email");
          setMode('reset-password');
          setCanResendOtp(false);
          setResendTimer(60);
          
          const timer = setInterval(() => {
            setResendTimer(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                setCanResendOtp(true);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          toast.error(response.data.message);
        }
      } else if (isResetPassword) {
        const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
          email: normalizedEmail,
          otp: formData.otp,
          newPassword: formData.newPassword
        });
        
        if (response.data.success) {
          toast.success("Password reset successfully");
          setMode('login');
          setFormData(prev => ({ ...prev, otp: '', newPassword: '' }));
          setCanResendOtp(true);
          setResendTimer(0);
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between login and signup
  const toggleMode = () => {
    setMode(current => current === 'login' ? 'signup' : 'login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '' });
    setCanResendOtp(true);
    setResendTimer(0);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    setMode('forgot-password');
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setMode('login');
    setFormData(prev => ({ ...prev, otp: '', newPassword: '' }));
    setCanResendOtp(true);
    setResendTimer(0);
  };

  // Get display title
  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Forgot Password';
      case 'reset-password': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (isLoading) return 'Processing...';
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot-password': return 'Send OTP';
      case 'reset-password': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  // Get subtitle
  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Join our skincare community';
      case 'forgot-password': return 'We\'ll send you an OTP to reset your password';
      case 'reset-password': return 'Enter the OTP sent to your email';
      default: return 'Sign in to your account';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl transform transition-all duration-300 scale-100 opacity-100"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <FaTimes className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            {(isForgotPassword || isResetPassword) && (
              <button
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <FaChevronLeft className="w-4 h-4" />
                Back to login
              </button>
            )}
            
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
              <p className="mt-1 text-sm text-gray-600">{getSubtitle()}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="space-y-4">
              {/* Name field for signup */}
              {isSignUp && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="John Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading || isResetPassword}
                  />
                </div>
              </div>

              {/* Password fields for login and signup */}
              {(isLogin || isSignUp) && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                  )}
                </div>
              )}

              {/* Confirm password for signup */}
              {isSignUp && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP field for reset password */}
              {isResetPassword && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    OTP Verification
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="000000"
                      required
                      disabled={isLoading}
                      maxLength={6}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Enter 6-digit code sent to your email</p>
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || isLoading}
                      className={`text-sm ${canResendOtp ? 'text-black hover:text-gray-600' : 'text-gray-400'} disabled:opacity-50`}
                    >
                      {canResendOtp ? "Resend OTP" : `Resend in ${resendTimer}s`}
                    </button>
                  </div>
                </div>
              )}

              {/* New password for reset password */}
              {isResetPassword && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      type={showNewPassword ? "text" : "password"}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      {showNewPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>
              )}
            </div>

            {/* Forgot password link */}
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="mt-4 w-full text-right text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Forgot your password?
              </button>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4  bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105  whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  {getSubmitButtonText()}
                </>
              ) : (
                <>
                  {getSubmitButtonText()}
                  <FaArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Mode toggle */}
            {(isLogin || isSignUp) && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={isLoading}
                    className="ml-2 font-medium text-black hover:text-gray-700 disabled:opacity-50"
                  >
                    {isSignUp ? 'Sign In' : 'Create Account'}
                  </button>
                </p>
              </div>
            )}

            {/* Terms and conditions */}
            {/* <p className="mt-6 text-center text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <button type="button" className="underline hover:text-gray-700">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="underline hover:text-gray-700">
                Privacy Policy
              </button>
            </p> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;