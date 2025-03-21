import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jwt_decode from 'jwt-decode';

// API config
import { API_URL } from '../config/api';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up axios with auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if token is valid on startup
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      
      try {
        // Check if token is expired
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token is expired
          logoutUser();
          toast.error('Your session has expired. Please log in again.');
          setAuthLoading(false);
          return;
        }
        
        // Verify token with the backend
        const response = await axios.get(`${API_URL}/auth/verify`);
        
        if (response.data.valid) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          logoutUser();
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        logoutUser();
      } finally {
        setAuthLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);

  // Login user
  const loginUser = async (credentials) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      const { token, user } = response.data;
      
      // Store token in local storage
      localStorage.setItem('token', token);
      
      // Update state
      setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMsg = 'Login failed. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // Register user
  const registerUser = async (userData) => {
    try {
      setAuthLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      toast.success('Registration successful! You can now log in.');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMsg = 'Registration failed. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout user
  const logoutUser = () => {
    // Remove token from local storage
    localStorage.removeItem('token');
    
    // Reset state
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Remove auth header from axios
    delete axios.defaults.headers.common['Authorization'];
    
    toast.info('You have been logged out.');
  };

  // Context value
  const value = {
    currentUser,
    token,
    isAuthenticated,
    authLoading,
    loginUser,
    registerUser,
    logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
