import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage IMMEDIATELY
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    // Set axios header immediately if token exists
    if (savedToken) {
      axios.defaults.headers.common['token'] = savedToken;
    }
    return savedToken;
  });
  
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  // REMOVE THE 401 INTERCEPTOR - This is causing auto logout
  // useEffect(() => {
  //   const interceptor = axios.interceptors.response.use(
  //     (response) => response,
  //     (error) => {
  //       if (error.response?.status === 401) {
  //         logout();
  //         toast.error('Session expired. Please login again.');
  //       }
  //       return Promise.reject(error);
  //     }
  //   );
  //   return () => {
  //     axios.interceptors.response.eject(interceptor);
  //   };
  // }, []);

  const login = (newToken, userData) => {
    try {
      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios header
      axios.defaults.headers.common['token'] = newToken;
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
      console.log('Login successful - token saved');
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove axios header
      delete axios.defaults.headers.common['token'];
      
      // Update state
      setToken(null);
      setUser(null);
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Initialize auth on component mount
  useEffect(() => {
    // Double-check localStorage on mount
    const savedToken = localStorage.getItem('token');
    if (savedToken && !token) {
      setToken(savedToken);
      axios.defaults.headers.common['token'] = savedToken;
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser && !user) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    
    // Stop loading after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    token,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};