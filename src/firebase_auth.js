// Updated firebase_auth.js with persistence
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged as firebaseAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
 authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
 storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.REACT_APP_FIREBASE_APP_ID
};





console.log("Firebase config:", firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL - this will keep the user logged in even after page refresh
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

const db = getFirestore(app);

// Traducir mensajes de error de Firebase a mensajes amigables en español
export const getErrorMessage = (errorCode) => {
  const errorMessages = {
    // Errores de autenticación
    'auth/invalid-credential': 'Credenciales inválidas. Por favor verifica tu email y contraseña.',
    'auth/invalid-email': 'El formato del email no es válido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con este email.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este email.',
    'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
    'auth/operation-not-allowed': 'Esta operación no está permitida.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email pero con un método de inicio de sesión diferente.',
    'auth/invalid-api-key': 'La clave API de Firebase no es válida o ha expirado. Contacta al administrador.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado. Ventana cerrada antes de completar la autenticación.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para operaciones de OAuth.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.',
    
    // Errores específicos de Firestore
    'permission-denied': 'No tienes permiso para acceder a estos datos.',
    'unavailable': 'El servicio no está disponible en este momento.',
    
    // Error genérico
    'default': 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'
  };
  
  // Si encontramos el código de error específico, devolvemos su mensaje traducido
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }
  
  // Si no hay código específico o no lo tenemos catalogado, devolvemos un mensaje genérico
  return errorMessages['default'];
};

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    // Garantizar que la persistencia está configurada en LOCAL antes del registro
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistencia configurada para LOCAL durante el registro");
    
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario registrado exitosamente con ID:", user.uid);
    
    // Update the user's profile with the display name
    await updateProfile(user, { displayName });
    
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      createdAt: new Date(),
      plan: 'free',
      currentPeriodUsage: 0,
      totalUploads: 0
    });
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    // Transformar el error antes de propagarlo
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Sign in an existing user
export const loginUser = async (email, password) => {
  try {
    // Garantizar que la persistencia está configurada en LOCAL antes de iniciar sesión
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistencia configurada para LOCAL durante el login");
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login exitoso con ID:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    // Transformar el error antes de propagarlo
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Sign out the current user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset a user's password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    // Transformar el error antes de propagarlo
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Get the current authenticated user
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = firebaseAuthStateChanged(auth, (user) => {
      unsubscribe();
      console.log("getCurrentUser returned:", user ? user.uid : "No user");
      resolve(user);
    });
  });
};

// Check if a user is authenticated (with a timeout)
export const isAuthenticated = () => {
  return new Promise((resolve) => {
    // Set a timeout to resolve after 2 seconds if no auth state change occurs
    const timeout = setTimeout(() => {
      console.log("Auth check timed out, assuming not authenticated");
      resolve(false);
    }, 2000);
    
    const unsubscribe = firebaseAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      const isLoggedIn = !!user;
      console.log("isAuthenticated:", isLoggedIn);
      resolve(isLoggedIn);
    });
  });
};

// Get a user's profile data from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Rest of your code remains the same...
export const updateUserPlan = async (userId, newPlan) => {
  try {
    console.group('Update User Plan Debug');
    console.log('User ID:', userId);
    console.log('New Plan:', newPlan);
    console.log('Current Auth User:', auth.currentUser?.uid);

    // Additional authentication check
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      console.error('Authentication mismatch');
      throw new Error('Not authenticated to update this user');
    }

    const userDocRef = doc(db, 'users', userId);

    await updateDoc(userDocRef, {
      plan: newPlan,
      planUpdatedAt: serverTimestamp(),
      currentPeriodUsage: 0
    });

    const updatedDoc = await getDoc(userDocRef);
    console.log('Updated Document:', updatedDoc.data());
    console.groupEnd();

    return true;
  } catch (error) {
    console.groupEnd();
    console.error('Plan Update Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Check if a user can upload more chats
export const canUploadChat = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    // Free plan users can upload 2 chats
    if (userProfile.plan === 'free') {
      return userProfile.currentPeriodUsage < 2;
    }
    
    // For paid plans, check their quota
    if (userProfile.plan === 'basic') {
      return userProfile.currentPeriodUsage < 20;
    } else if (userProfile.plan === 'standard') {
      return userProfile.currentPeriodUsage < 50;
    } else if (userProfile.plan === 'premium') {
      return userProfile.currentPeriodUsage < 120;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking upload capability:', error);
    throw error;
  }
};

// Increment a user's chat upload count
export const incrementChatUsage = async (userId) => {
  try {
    console.log(`[incrementChatUsage] Incrementando contadores para usuario: ${userId}`);
    
    if (!userId) {
      console.error(`[incrementChatUsage] Error: ID de usuario inválido o vacío`);
      throw new Error('ID de usuario no válido');
    }
    
    // Verificar que el usuario existe
    const userRef = doc(db, 'users', userId);
    console.log(`[incrementChatUsage] Obteniendo referencia al documento: users/${userId}`);
    
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`[incrementChatUsage] Error: No se encontró el usuario con ID ${userId}`);
      throw new Error(`Usuario no encontrado (ID: ${userId})`);
    }
    
    // Obtener valores actuales
    const userData = userDoc.data();
    const currentUsage = userData.currentPeriodUsage || 0;
    const totalUploads = userData.totalUploads || 0;
    
    console.log(`[incrementChatUsage] Valores actuales - currentPeriodUsage: ${currentUsage}, totalUploads: ${totalUploads}`);
    
    // Preparar datos para la actualización
    const updateData = {
      currentPeriodUsage: increment(1),
      totalUploads: increment(1),
      lastUploadAt: new Date()
    };
    
    console.log(`[incrementChatUsage] Enviando actualización a Firestore: ${JSON.stringify(updateData)}`);
    
    // Realizar la actualización con manejo de errores explícito
    try {
      await updateDoc(userRef, updateData);
      console.log(`[incrementChatUsage] Operación de actualización enviada correctamente`);
    } catch (updateError) {
      console.error(`[incrementChatUsage] Error al actualizar documento:`, updateError);
      throw new Error(`Error al actualizar contador: ${updateError.message}`);
    }
    
    // Verificar que la actualización fue exitosa
    try {
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        console.log(`[incrementChatUsage] Nuevos valores verificados - currentPeriodUsage: ${updatedData.currentPeriodUsage}, totalUploads: ${updatedData.totalUploads}`);
        
        // Verificar que los valores realmente aumentaron
        if (updatedData.currentPeriodUsage <= currentUsage || updatedData.totalUploads <= totalUploads) {
          console.warn(`[incrementChatUsage] Advertencia: Los contadores no parecen haber aumentado correctamente`);
        }
      } else {
        console.warn(`[incrementChatUsage] Advertencia: No se pudo verificar la actualización`);
      }
    } catch (verifyError) {
      console.warn(`[incrementChatUsage] No se pudo verificar la actualización:`, verifyError);
      // No lanzar error aquí, ya que la operación principal ya se completó
    }
    
    return true;
  } catch (error) {
    console.error('[incrementChatUsage] Error general:', error);
    throw error;
  }
};

// Login with Google
export const loginWithGoogle = async () => {
  try {
    // Garantizar que la persistencia está configurada en LOCAL antes de iniciar sesión con Google
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistencia configurada para LOCAL durante el login con Google");
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    console.log("Login con Google exitoso con ID:", user.uid);
    
    // Check if this is a first-time login
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create a user document in Firestore for first-time Google sign-ins
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        plan: 'free',
        currentPeriodUsage: 0,
        totalUploads: 0,
        authProvider: 'google'
      });
      console.log("New Google user profile created");
    }
    
    return user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    // Transformar el error antes de propagarlo
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Exportar onAuthStateChanged para poder usarlo en otros componentes
export const onAuthStateChanged = (auth, callback) => {
  return firebaseAuthStateChanged(auth, callback);
};

export { auth, db };