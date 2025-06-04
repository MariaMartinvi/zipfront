// Script para establecer un usuario como administrador
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc
} from 'firebase/firestore';

// Configuración de Firebase (usa las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para establecer un usuario como administrador
export const setUserAsAdmin = async (userEmail, userId = null) => {
  try {
    console.log(`Estableciendo usuario ${userEmail} como administrador...`);
    
    let userDocId = userId;
    
    // Si no se proporciona userId, necesitamos encontrarlo por email
    if (!userDocId) {
      console.log('No se proporcionó userId, buscando por email...');
      // Nota: Para encontrar por email necesitarías hacer una consulta
      // Por ahora, asumiremos que se proporcionará el userId manualmente
      throw new Error('Por favor proporciona el userId del usuario a actualizar');
    }
    
    const userRef = doc(db, 'users', userDocId);
    
    // Verificar si el usuario existe
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('Usuario no encontrado, creando nuevo documento...');
      // Crear nuevo documento de usuario como administrador
      await setDoc(userRef, {
        email: userEmail,
        is_admin: true,
        plan: 'free', // Plan por defecto
        currentPeriodUsage: 0,
        totalUploads: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Usuario ${userEmail} creado como administrador`);
    } else {
      // Actualizar usuario existente
      await updateDoc(userRef, {
        is_admin: true,
        updatedAt: new Date()
      });
      console.log(`✅ Usuario ${userEmail} actualizado como administrador`);
    }
    
    // Verificar la actualización
    const updatedDoc = await getDoc(userRef);
    const userData = updatedDoc.data();
    
    console.log('Datos del usuario actualizado:');
    console.log(`- Email: ${userData.email}`);
    console.log(`- Es Admin: ${userData.is_admin}`);
    console.log(`- Plan: ${userData.plan}`);
    console.log(`- Uso actual: ${userData.currentPeriodUsage || 0}`);
    
    return userData;
    
  } catch (error) {
    console.error('Error estableciendo usuario como administrador:', error);
    throw error;
  }
};

// Función específica para mariamartinvillaro@gmail.com
export const setMariaAsAdmin = async (userId) => {
  return await setUserAsAdmin('mariamartinvillaro@gmail.com', userId);
};

// Si se ejecuta directamente (para testing)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Script setAdminUser.js cargado');
  console.log('Para usar: setMariaAsAdmin("USER_ID_DE_FIREBASE")');
  
  // Exponer funciones globalmente para testing
  window.setUserAsAdmin = setUserAsAdmin;
  window.setMariaAsAdmin = setMariaAsAdmin;
} 