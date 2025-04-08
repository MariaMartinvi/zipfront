
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getUserProfile } from './firebase_auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
  
    checkAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, userProfile, setUserProfile, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}