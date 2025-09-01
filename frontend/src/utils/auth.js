import { useState } from 'react';

// Token management
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Get user data
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Set user data
export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// Login function
export const login = (token, user) => {
  setToken(token);
  setUser(user);
};

// Logout function
export const logout = () => {
  removeToken();
  setUser(null);
};

// Token validation
export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Parse JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Invalid token format:', error);
    return false;
  }
};

// Get token expiration time
export const getTokenExpiration = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Auto logout when token expires
export const setupTokenExpiration = () => {
  const token = getToken();
  if (!token) return;
  
  const expiration = getTokenExpiration();
  if (!expiration) return;
  
  const timeUntilExpiration = expiration.getTime() - Date.now();
  
  if (timeUntilExpiration > 0) {
    setTimeout(() => {
      logout();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }, timeUntilExpiration);
  }
};

// Get auth headers for API calls
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Initialize auth state on app start
export const initializeAuth = () => {
  const token = getToken();
  if (token && isTokenValid()) {
    setupTokenExpiration();
    return true;
  } else {
    logout();
    return false;
  }
};

// Auth state management for React components
export const useAuthState = () => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [user, setUserState] = useState(getUser());
  
  const updateAuth = (token, userData) => {
    if (token && userData) {
      login(token, userData);
      setIsAuth(true);
      setUserState(userData);
      setupTokenExpiration();
    } else {
      logout();
      setIsAuth(false);
      setUserState(null);
    }
  };
  
  return {
    isAuthenticated: isAuth,
    user,
    updateAuth,
    logout: () => updateAuth(null, null)
  };
};

// Protected route helper
export const requireAuth = () => {
  if (!isAuthenticated() || !isTokenValid()) {
    logout();
    return false;
  }
  return true;
};

// Role-based access control
export const hasRole = (requiredRole) => {
  const user = getUser();
  if (!user || !user.role) return false;
  
  const roles = {
    'user': 1,
    'admin': 2,
    'super_admin': 3
  };
  
  return roles[user.role] >= roles[requiredRole];
};

// Permission checking
export const hasPermission = (permission) => {
  const user = getUser();
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(permission);
};