import { useState, useCallback, useMemo } from "react";
import { assets } from "../assets/assets";

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  // Memoized background style
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${assets.Newsletter})`
  }), []);

  // Email validation function
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubscribe = useCallback(async (event) => {
    event.preventDefault();
    
    if (!email) {
      setMessage({ text: "Please enter your email address", type: "error" });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const endpoint = isUnsubscribing ? 'unsubscribe' : 'subscribe';
      
      const response = await fetch(`${API_BASE_URL}/api/newsletter/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = isUnsubscribing 
          ? "✅ You have been unsubscribed from our newsletter."
          : "🎉 Successfully subscribed! Check your email for a welcome message.";
        
        setMessage({ 
          text: data.message || successMessage, 
          type: "success" 
        });
        setEmail("");
        
        // Reset mode after successful action
        if (isUnsubscribing) {
          setIsUnsubscribing(false);
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 5000);
      } else {
        setMessage({ 
          text: data.message || "Something went wrong. Please try again.", 
          type: "error" 
        });
      }
    } catch (error) {
      setMessage({ 
        text: "Failed to process your request. Please check your connection and try again.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  }, [email, isUnsubscribing, validateEmail]);

  const toggleMode = useCallback(() => {
    setIsUnsubscribing(prev => !prev);
    setMessage({ text: "", type: "" });
    setEmail("");
  }, []);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  // Memoized message display
  const messageDisplay = useMemo(() => {
    if (!message.text) return null;

    return (
      <div
        className={`mt-4 rounded-lg p-3 ${
          message.type === "success"
            ? "bg-black text-white border border-green-400"
            : "bg-red-600 text-white border border-red-400"
        }`}
        style={{
          animation: 'fade-in 0.3s ease-out'
        }}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center justify-center">
          {message.type === "success" && (
            <svg 
              className="w-5 h-5 mr-2 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {message.text}
        </div>
      </div>
    );
  }, [message.text, message.type]);

  // Memoized loading spinner
  const loadingSpinner = useMemo(() => (
    <div className="flex items-center">
      <svg 
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white flex-shrink-0" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {isUnsubscribing ? "Unsubscribing..." : "Subscribing..."}
    </div>
  ), [isUnsubscribing]);

  // Memoized button content
  const buttonContent = useMemo(() => (
    loading ? loadingSpinner : (isUnsubscribing ? "Unsubscribe" : "Subscribe Now")
  ), [loading, isUnsubscribing, loadingSpinner]);

  // Memoized placeholder text
  const placeholderText = useMemo(() => (
    isUnsubscribing ? "Enter your email to unsubscribe..." : "Enter your email address..."
  ), [isUnsubscribing]);

  // Memoized description text
  const descriptionText = useMemo(() => (
    isUnsubscribing 
      ? "We're sorry to see you go. Enter your email to unsubscribe from our newsletter."
      : "Get exclusive deals, Organic Living tips, and early access to new natural products."
  ), [isUnsubscribing]);

  return (
    <div
      className="relative w-full bg-cover bg-center px-6 py-16 rounded-3xl"
      style={backgroundStyle}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-3xl"></div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-2xl text-center text-white">
        <h2 className="text-3xl font-semibold sm:text-4xl">
          {isUnsubscribing ? "Unsubscribe" : "Subscribe Now!"}
        </h2>
        <p className="mt-3 text-lg text-gray-300">
          {descriptionText}
        </p>

        {/* Message Display */}
        {messageDisplay}

        {/* Subscription/Unsubscription Form */}
        <form 
          onSubmit={handleSubscribe} 
          className="mx-auto mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1 sm:shadow-lg"
          noValidate
        >
          <input 
            type="email" 
            placeholder={placeholderText}
            className="w-full flex-1 rounded-full px-6 py-4 text-gray-700 outline-none border-0 focus:ring-2 focus:ring-black transition-all duration-200" 
            required
            value={email}
            onChange={handleEmailChange}
            disabled={loading}
            aria-label="Email address"
          />
          <button 
            type="submit" 
            disabled={loading}
            className={`rounded-full px-8 py-4 font-semibold text-white transition-all disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 duration-200 shadow-lg ${
              isUnsubscribing 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-black hover:bg-gray-900"
            }`}
            aria-label={isUnsubscribing ? "Unsubscribe from newsletter" : "Subscribe to newsletter"}
          >
            {buttonContent}
          </button>
        </form>
        
        {/* Mode Toggle */}
        <div className="mt-6 text-sm text-gray-300">
          <p className="text-xs text-gray-400">
            {isUnsubscribing 
              ? "Changed your mind? " 
              : "Need to unsubscribe? "
            }
            <button 
              onClick={toggleMode}
              className="underline hover:text-white transition-colors font-medium"
              aria-label={isUnsubscribing ? "Switch to subscribe mode" : "Switch to unsubscribe mode"}
            >
              {isUnsubscribing ? "Subscribe instead" : "Unsubscribe here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterBox;