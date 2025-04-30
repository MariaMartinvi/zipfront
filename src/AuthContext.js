import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getUserProfile, onAuthStateChanged, auth } from './firebase_auth';

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
          try {
            const profile = await getUserProfile(currentUser.uid);
            setUserProfile(profile);
            console.log("AuthContext: Perfil de usuario cargado correctamente");
          } catch (profileError) {
            console.error("AuthContext: Error al cargar el perfil:", profileError);
          }
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
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (profileError) {
          console.error("Error al cargar el perfil después del cambio de autenticación:", profileError);
        }
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