import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

const ClientPrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useClientAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: '#333',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ marginBottom: '12px' }}>Loading...</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #ddd',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/client/login" />;
};

export default ClientPrivateRoute;

