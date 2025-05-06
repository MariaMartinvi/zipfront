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
import i18next from 'i18next'; // Importar i18next para acceder al idioma actual

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

// Mensajes de error por idioma
const errorMessagesByLanguage = {
  es: {
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
    'default': 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
    // Errores personalizados de la aplicación
    'invalid-user-id': 'ID de usuario no válido',
    'user-not-found': 'Usuario no encontrado',
    'auth-mismatch': 'No está autenticado para actualizar este usuario',
    'count-update-error': 'Error al actualizar contador'
  },
  en: {
    // Authentication errors
    'auth/invalid-credential': 'Invalid credentials. Please verify your email and password.',
    'auth/invalid-email': 'Invalid email format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account exists with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'The password is too weak. It must have at least 6 characters.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email but with a different sign-in method.',
    'auth/invalid-api-key': 'The Firebase API key is invalid or has expired. Contact the administrator.',
    'auth/network-request-failed': 'Connection error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Login canceled. Window closed before authentication was completed.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    // Firestore specific errors
    'permission-denied': 'You do not have permission to access this data.',
    'unavailable': 'The service is currently unavailable.',
    // Generic error
    'default': 'An error has occurred. Please try again.',
    // Custom application errors
    'invalid-user-id': 'Invalid user ID',
    'user-not-found': 'User not found',
    'auth-mismatch': 'Not authenticated to update this user',
    'count-update-error': 'Error updating counter'
  },
  fr: {
    // Erreurs d'authentification
    'auth/invalid-credential': 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.',
    'auth/invalid-email': 'Format d\'email invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte n\'existe avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Le mot de passe est trop faible. Il doit comporter au moins 6 caractères.',
    'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email mais avec une méthode de connexion différente.',
    'auth/invalid-api-key': 'La clé API Firebase est invalide ou a expiré. Contactez l\'administrateur.',
    'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
    'auth/popup-closed-by-user': 'Connexion annulée. Fenêtre fermée avant la fin de l\'authentification.',
    'auth/unauthorized-domain': 'Ce domaine n\'est pas autorisé pour les opérations OAuth.',
    'auth/too-many-requests': 'Trop de tentatives échouées. Veuillez réessayer plus tard.',
    // Erreurs spécifiques à Firestore
    'permission-denied': 'Vous n\'avez pas la permission d\'accéder à ces données.',
    'unavailable': 'Le service est actuellement indisponible.',
    // Erreur générique
    'default': 'Une erreur s\'est produite. Veuillez réessayer.',
    // Erreurs personnalisées de l'application
    'invalid-user-id': 'ID utilisateur non valide',
    'user-not-found': 'Utilisateur non trouvé',
    'auth-mismatch': 'Non authentifié pour mettre à jour cet utilisateur',
    'count-update-error': 'Erreur lors de la mise à jour du compteur'
  },
  de: {
    // Authentifizierungsfehler
    'auth/invalid-credential': 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.',
    'auth/invalid-email': 'Ungültiges E-Mail-Format.',
    'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
    'auth/user-not-found': 'Es existiert kein Konto mit dieser E-Mail.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/email-already-in-use': 'Ein Konto mit dieser E-Mail existiert bereits.',
    'auth/weak-password': 'Das Passwort ist zu schwach. Es muss mindestens 6 Zeichen haben.',
    'auth/operation-not-allowed': 'Diese Operation ist nicht erlaubt.',
    'auth/account-exists-with-different-credential': 'Ein Konto mit dieser E-Mail existiert bereits, aber mit einer anderen Anmeldemethode.',
    'auth/invalid-api-key': 'Der Firebase-API-Schlüssel ist ungültig oder abgelaufen. Kontaktieren Sie den Administrator.',
    'auth/network-request-failed': 'Verbindungsfehler. Überprüfen Sie Ihre Internetverbindung.',
    'auth/popup-closed-by-user': 'Anmeldung abgebrochen. Fenster wurde vor Abschluss der Authentifizierung geschlossen.',
    'auth/unauthorized-domain': 'Diese Domain ist nicht für OAuth-Operationen autorisiert.',
    'auth/too-many-requests': 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es später erneut.',
    // Firestore-spezifische Fehler
    'permission-denied': 'Sie haben keine Berechtigung, auf diese Daten zuzugreifen.',
    'unavailable': 'Der Dienst ist derzeit nicht verfügbar.',
    // Allgemeiner Fehler
    'default': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    // Benutzerdefinierte Anwendungsfehler
    'invalid-user-id': 'Ungültige Benutzer-ID',
    'user-not-found': 'Benutzer nicht gefunden',
    'auth-mismatch': 'Nicht authentifiziert, um diesen Benutzer zu aktualisieren',
    'count-update-error': 'Fehler beim Aktualisieren des Zählers'
  },
  it: {
    // Errori di autenticazione
    'auth/invalid-credential': 'Credenziali non valide. Verifica email e password.',
    'auth/invalid-email': 'Formato email non valido.',
    'auth/user-disabled': 'Questo account è stato disabilitato.',
    'auth/user-not-found': 'Non esiste un account con questa email.',
    'auth/wrong-password': 'Password errata.',
    'auth/email-already-in-use': 'Esiste già un account con questa email.',
    'auth/weak-password': 'La password è troppo debole. Deve avere almeno 6 caratteri.',
    'auth/operation-not-allowed': 'Questa operazione non è consentita.',
    'auth/account-exists-with-different-credential': 'Esiste già un account con questa email ma con un metodo di accesso diverso.',
    'auth/invalid-api-key': 'La chiave API Firebase non è valida o è scaduta. Contatta l\'amministratore.',
    'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
    'auth/popup-closed-by-user': 'Accesso annullato. Finestra chiusa prima del completamento dell\'autenticazione.',
    'auth/unauthorized-domain': 'Questo dominio non è autorizzato per le operazioni OAuth.',
    'auth/too-many-requests': 'Troppi tentativi falliti. Riprova più tardi.',
    // Errori specifici di Firestore
    'permission-denied': 'Non hai il permesso di accedere a questi dati.',
    'unavailable': 'Il servizio non è disponibile al momento.',
    // Errore generico
    'default': 'Si è verificato un errore. Riprova.',
    // Errori personalizzati dell'applicazione
    'invalid-user-id': 'ID utente non valido',
    'user-not-found': 'Utente non trovato',
    'auth-mismatch': 'Non autenticato per aggiornare questo utente',
    'count-update-error': 'Errore durante l\'aggiornamento del contatore'
  }
};

// Traducir mensajes de error de Firebase a mensajes amigables según el idioma actual
export const getErrorMessage = (errorCode) => {
  // Obtener el idioma actual del sistema i18next
  const currentLanguage = i18next.language || 'es';
  
  // Seleccionar los mensajes de error para el idioma actual, con español como fallback
  const errorMessages = errorMessagesByLanguage[currentLanguage] || errorMessagesByLanguage.es;
  
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
      throw new Error(getErrorMessage('user-not-found'));
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
      throw new Error(getErrorMessage('auth-mismatch'));
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
      throw new Error(getErrorMessage('invalid-user-id'));
    }
    
    // Verificar que el usuario existe
    const userRef = doc(db, 'users', userId);
    console.log(`[incrementChatUsage] Obteniendo referencia al documento: users/${userId}`);
    
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`[incrementChatUsage] Error: No se encontró el usuario con ID ${userId}`);
      throw new Error(getErrorMessage('user-not-found'));
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
      throw new Error(getErrorMessage('count-update-error') + `: ${updateError.message}`);
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
    
    // Obtener el idioma actual
    const currentLanguage = i18next.language || 'es';
    
    // Personalización de la experiencia de inicio de sesión con Google
    provider.setCustomParameters({
      // Personalizar la pantalla de selección de cuenta
      prompt: 'select_account',
      // Mostrar marca en la pantalla de inicio de sesión
      login_hint: `Login to chatsalsa.com with Google`,
      // Especificar idioma para la UI según el idioma actual
      hl: currentLanguage,
      // Intentar establecer el título de la ventana
      title: 'ChatsalSa - Login'
    });
    
    // Utilizar signInWithRedirect en lugar de signInWithPopup para más control sobre la UI
    // const userCredential = await signInWithPopup(auth, provider);
    
    // Configurar para que use el idioma del dispositivo
    auth.useDeviceLanguage();
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