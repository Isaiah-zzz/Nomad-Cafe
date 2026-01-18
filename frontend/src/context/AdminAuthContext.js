import React, { createContext, useContext, useState, useEffect } from 'react';
import adminApi from '../utils/adminApi';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = adminApi.getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await adminApi.login(username, password);
      adminApi.setToken(response.access_token);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    adminApi.removeToken();
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

