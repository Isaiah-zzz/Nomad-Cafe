import React, { createContext, useContext, useState, useEffect } from 'react';
import clientApi from '../utils/clientApi';

const ClientAuthContext = createContext(null);

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};

export const ClientAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = clientApi.getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await clientApi.login(username, password);
      clientApi.setToken(response.access_token);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await clientApi.register(username, email, password);
      clientApi.setToken(response.access_token);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    clientApi.removeToken();
    setIsAuthenticated(false);
  };

  return (
    <ClientAuthContext.Provider value={{ isAuthenticated, login, register, logout, loading }}>
      {children}
    </ClientAuthContext.Provider>
  );
};

