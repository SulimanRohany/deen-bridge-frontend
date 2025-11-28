'use client'

import React, { createContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { extractErrorMessage } from '@/lib/utils';
import { authAPI, userAPI } from '@/lib/api';
import { getPendingAction, clearPendingAction } from '@/lib/pendingActions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [authTokens, setAuthTokens] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initializationComplete = useRef(false);

  const router = useRouter();

  // Function to fetch and enrich user data with profile information
  const enrichUserData = async (baseUserData) => {
    try {
      // Check if we have auth tokens before making the request
      const tokens = localStorage.getItem('authTokens');
      if (!tokens) {
        return baseUserData;
      }

      const userResponse = await userAPI.getUserById(baseUserData.id);
      const fullUserData = userResponse.data;
      
      // Merge profile image into user data
      if (fullUserData.profile?.profile_image) {
        return {
          ...baseUserData,
          profile_image: fullUserData.profile.profile_image
        };
      }
      return baseUserData;
    } catch (error) {
      // Silently handle 403/404 errors - profile enrichment is optional
      if (error.response?.status === 403 || error.response?.status === 404) {
      } else {
      }
      return baseUserData; // Return base data if profile fetch fails
    }
  };

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (initializationComplete.current) return;
      
      try {
        setIsMounted(true);
        const tokens = localStorage.getItem('authTokens');
        if (tokens) {
          const parsedData = JSON.parse(tokens);
          const user = jwtDecode(parsedData.access);
          const currentTime = Date.now() / 1000;
          if (user.exp > currentTime) {
            setAuthTokens(parsedData);
            // Enrich user data with profile image
            const enrichedUserData = await enrichUserData(user.user);
            setUserData(enrichedUserData);
          } else {
            // Token is expired, attempt refresh
            setAuthTokens(parsedData);
            const refreshSuccess = await updateToken(parsedData.refresh);
            if (!refreshSuccess) {
              // If refresh failed, clear everything
              localStorage.removeItem('authTokens');
              setAuthTokens(null);
              setUserData(null);
            }
          }
        }
      } catch (error) {
        localStorage.removeItem('authTokens');
        setAuthTokens(null);
        setUserData(null);
      } finally {
        setLoading(false);
        initializationComplete.current = true;
      }
    };
    initializeAuth();
  }, []);

  const loginUser = async (data) => {
    try {
      setMessage(null);
      const response = await authAPI.login({
        email: data.email.toLowerCase(), // Normalize email
        password: data.password
      });
      if (response.status === 200) {
        const tokens = {
          access: response.data.access,
          refresh: response.data.refresh
        };
        setAuthTokens(tokens);
        const decoded = jwtDecode(tokens.access);
        
        // Enrich user data with profile image
        const enrichedUserData = await enrichUserData(decoded.user);
        setUserData(enrichedUserData);
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        
        // Clear any error messages on successful login
        setMessage(null);
        
        // Check for pending actions and execute them
        const pendingAction = getPendingAction();
        if (pendingAction) {
          clearPendingAction();
          
          // Navigate to the appropriate page based on action type
          if (pendingAction.type === 'download_book' && pendingAction.data?.resourceId) {
            router.push(`/library/${pendingAction.data.resourceId}?autoDownload=true`);
            return; // Don't do default redirect
          } else if (pendingAction.type === 'quran_read' || pendingAction.type === 'quran_listen') {
            const { surah, verse } = pendingAction.data || {};
            router.push(`/quran?surah=${surah || 1}&verse=${verse || 1}`);
            return;
          } else if (pendingAction.type === 'library_view' && pendingAction.data?.resourceId) {
            router.push(`/library/${pendingAction.data.resourceId}`);
            return;
          }
        }
        
        // Default redirect based on user role (if no pending action)
        if (decoded.user.role === 'super_admin') {
          router.push('/dashboard/super-admin');
        } else if (decoded.user.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('authTokens');
    setUserData(null);
    setAuthTokens(null);
    router.push('/');
  };

  const registerUser = async (data) => {
    try {
      setMessage(null);
      const response = await authAPI.register({
        ...data,
        email: data.email.toLowerCase() // Normalize email
      });
      if (response.status === 201) {
        // Clear any error messages on successful registration
        setMessage(null);
        
        // Note: Don't clear pending action on registration
        // It will be handled after they log in
        router.push('/login');
      }
    } catch (error) {
      setMessage(extractErrorMessage(error));
    }
  };

  const updateToken = async (refreshToken = null) => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing) {
      return false;
    }

    const tokenToUse = refreshToken || authTokens?.refresh;
    
    if (!tokenToUse) {
      logoutUser();
      return false;
    }
    
    try {
      setIsRefreshing(true);
      const response = await authAPI.refresh(tokenToUse);
      if (response.status === 200) {
        const tokens = {
          access: response.data.access,
          refresh: response.data.refresh
        };
        setAuthTokens(tokens);
        const decoded = jwtDecode(tokens.access);
        
        // Enrich user data with profile image
        const enrichedUserData = await enrichUserData(decoded.user);
        setUserData(enrichedUserData);
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        setIsRefreshing(false);
        return true; // Success
      } else {
        setIsRefreshing(false);
        logoutUser();
        return false;
      }
    } catch (error) {
      setIsRefreshing(false);
      
      // Only show message and logout if we're not in initialization
      if (initializationComplete.current) {
        setMessage('Session expired. Please log in again.');
        logoutUser();
      }
      return false;
    }
  };

  useEffect(() => {
    if (!authTokens) return;
    const fourMinutes = 4 * 60 * 1000;
    const interval = setInterval(() => {
      updateToken();
    }, fourMinutes);
    return () => clearInterval(interval);
  }, [authTokens]);

  // Function to update user data (e.g., after profile changes)
  const updateUserData = (newUserData) => {
    setUserData(prevUserData => ({
      ...prevUserData,
      ...newUserData
    }));
  };

  const context = {
    loginUser,
    logoutUser,
    message,
    userData,
    registerUser,
    loading,
    authTokens,
    updateUserData
  };

  if (!isMounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={context}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export default AuthContext;