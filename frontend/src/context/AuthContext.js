import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth header from stored token
  const setAuthHeader = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Check auth on app load
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setAuthHeader(token);
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(data);
    } catch {
      localStorage.removeItem('access_token');
      setAuthHeader(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setAuthHeader]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      const token = data.token;
      localStorage.setItem('access_token', token);
      setAuthHeader(token);
      setUser(data.user);
      return { success: true };
    } catch (e) {
      const detail = e.response?.data?.detail;
      let message = 'Something went wrong. Please try again.';
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map(d => d.msg || JSON.stringify(d)).join(' ');
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch {
      // ignore
    }
    localStorage.removeItem('access_token');
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export { API };
