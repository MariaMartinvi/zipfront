// AuthDebug.js - Updated to integrate with AuthContext
import React, { useEffect, useState } from 'react';
import { auth } from './firebase_auth';
import { useAuth } from './AuthContext';

const AuthDebug = () => {
  const { user, isAuthLoading } = useAuth();
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    error: null,
    lastChecked: new Date().toLocaleTimeString()
  });
  
  useEffect(() => {
    // Check initial auth state
    updateAuthState();
    
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      updateAuthState(user);
    });
    
    // Clean up
    return () => unsubscribe();
  }, []);

  // Update when context auth state changes
  useEffect(() => {
    updateAuthState(auth.currentUser);
  }, [user, isAuthLoading]);
  
  const updateAuthState = async (user = auth.currentUser) => {
    try {
      let token = null;
      if (user) {
        try {
          token = await user.getIdToken(true);
          token = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
        } catch (e) {
          console.error("Error getting token:", e);
        }
      }
      
      setAuthState({
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        } : null,
        token,
        error: null,
        contextUser: !!user,
        isAuthLoading,
        lastChecked: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        lastChecked: new Date().toLocaleTimeString()
      }));
    }
  };
  
  const checkAuth = () => {
    updateAuthState();
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Auth Debug</h3>
      <div style={{ marginBottom: '5px' }}>
        <strong>Firebase Status:</strong> {authState.user ? '✅ Logged In' : '❌ Logged Out'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Context Status:</strong> {user ? '✅ Available' : '❌ Not Available'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Auth Loading:</strong> {isAuthLoading ? '⏳ Loading' : '✅ Ready'}
      </div>
      {authState.user && (
        <>
          <div style={{ marginBottom: '5px' }}>
            <strong>User ID:</strong> {authState.user.uid}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Email:</strong> {authState.user.email}
          </div>
          {authState.token && (
            <div style={{ marginBottom: '5px' }}>
              <strong>Token:</strong> {authState.token}
            </div>
          )}
        </>
      )}
      <div style={{ marginBottom: '5px' }}>
        <strong>Last Check:</strong> {authState.lastChecked}
      </div>
      {authState.error && (
        <div style={{ marginBottom: '5px', color: '#ff6b6b' }}>
          <strong>Error:</strong> {authState.error}
        </div>
      )}
      <div style={{ marginBottom: '5px' }}>
        <strong>Path:</strong> {window.location.pathname}
      </div>
      <button 
        onClick={checkAuth}
        style={{
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Check Auth
      </button>
    </div>
  );
};

export default AuthDebug;