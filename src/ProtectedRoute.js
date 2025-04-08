// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute({ children }) {
  const { user, isAuthLoading } = useAuth();
  
  console.log('ProtectedRoute - Auth state:', { 
    isUser: !!user, 
    isAuthLoading,
    userId: user?.uid
  });

  // Show loading indicator while checking auth
  if (isAuthLoading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Verificando sesión...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Render children if authenticated
  console.log('ProtectedRoute - User authenticated, rendering children');
  return children;
}

export default ProtectedRoute;