import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, onAuthStateChanged, auth } from './firebase_auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log("AuthContext: Usuario recuperado:", currentUser ? currentUser.uid : "No hay usuario");
        
        if (currentUser) {
          setUser(currentUser);
          console.log("AuthContext: Usuario autenticado correctamente");
        } else {
          console.log("AuthContext: No se encontró un usuario autenticado");
        }
      } catch (error) {
        console.error('AuthContext: Error en verificación de autenticación:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
  
    // Iniciar verificación de autenticación
    checkAuthState();
    
    // Escuchar cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthContext: Cambio en estado de autenticación:", currentUser ? currentUser.uid : "No hay usuario");
      setUser(currentUser);
      
      if (currentUser) {
        console.log("AuthContext: Usuario autenticado en cambio de estado");
      } else {
        setUserProfile(null);
      }
      
      setIsAuthLoading(false);
    });
    
    // Limpiar suscripción al desmontar
    return () => unsubscribe();
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