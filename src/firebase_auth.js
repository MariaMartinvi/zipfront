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
  browserSessionPersistence,
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

// Configuración de la URL del backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to build API URLs consistently
const buildApiUrl = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Si la URL base ya termina con /api, usar tal como está
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${endpoint}`;
  } else {
    // Si no termina con /api, agregarlo
    return `${baseUrl}/api${endpoint}`;
  }
};

const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
 authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
 storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Verificar authDomain en producción
if (process.env.NODE_ENV === 'production') {
  console.log('Producción detectada - authDomain:', firebaseConfig.authDomain);
  if (firebaseConfig.authDomain !== 'wasapeo-c2b6e.firebaseapp.com') {
    console.warn('⚠️ ADVERTENCIA: authDomain debería ser wasapeo-c2b6e.firebaseapp.com en producción');
  }
}

console.log("Firebase config:", firebaseConfig);
console.log("API Key presente:", !!firebaseConfig.apiKey);
console.log("Auth Domain:", firebaseConfig.authDomain);
console.log("Project ID:", firebaseConfig.projectId);
console.log("Dominio actual:", window.location.hostname);
console.log("URL completa:", window.location.href);
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("ERROR: Variables de entorno de Firebase faltantes!");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL - this will keep the user logged in between browser sessions
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
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio o inténtalo de nuevo.',
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
    'auth/popup-blocked': 'The browser blocked the popup window. Please allow popups for this site or try again.',
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
    // Garantizar que la persistencia está configurada antes del registro
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistencia configurada para LOCAL durante el registro");
    
    let user;
    let isNewUser = true;
    
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log("Usuario registrado exitosamente con ID:", user.uid);
      
      // Actualizar perfil del usuario
      await updateProfile(user, { displayName });
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/email-already-in-use') {
        console.log("Usuario ya existe en Firebase, intentando iniciar sesión...");
        const loginCredential = await signInWithEmailAndPassword(auth, email, password);
        user = loginCredential.user;
        isNewUser = false;
        console.log("Login exitoso para usuario existente:", user.uid);
      } else {
        throw firebaseError;
      }
    }
    
    // CRÍTICO: Obtener token de Firebase y tokens JWT ANTES de continuar
    const idToken = await user.getIdToken();

    // Llamar al backend para obtener tokens JWT - DEBE completarse antes de continuar
    const actionText = isNewUser ? "crear perfil" : "obtener tokens";
    const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email, displayName })
    });

    if (!response.ok) {
        throw new Error(`Error al ${actionText}`);
    }

    const data = await response.json();

    // CRÍTICO: Guardar tokens JWT ANTES de retornar
    if (data.access_token && data.refresh_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        console.log("Tokens JWT guardados exitosamente");
    } else {
        throw new Error("No se recibieron tokens del backend");
    }
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Sign in an existing user
export const loginUser = async (email, password) => {
  try {
    // Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // CRÍTICO: Obtener token de Firebase y tokens JWT ANTES de continuar
    const idToken = await user.getIdToken();

    // Obtener tokens JWT del backend - DEBE completarse antes de continuar
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Error al iniciar sesión con el backend');
    }

    const data = await response.json();
    
    // CRÍTICO: Guardar tokens JWT ANTES de retornar
    if (data.access_token && data.refresh_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log("Login backend completado exitosamente");
    } else {
      throw new Error("No se recibieron tokens del backend");
    }
    
    return user;
  } catch (error) {
    console.error('Error en login:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'auth/network-request-failed') {
      console.error('Detalles del error de red:');
      console.error('- Verifica tu conexión a internet');
      console.error('- Verifica que las variables de Firebase estén configuradas');
      console.error('- Verifica que no haya bloqueadores de ad/firewall');
    }
    
    throw error;
  }
};

// Sign out the current user
export const logoutUser = async () => {
  try {
    // Limpiar la sesión de Firebase
    await signOut(auth);
    
    // Limpiar tokens de autenticación
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    // Limpiar datos de la sesión
    const keysToRemove = [
      'whatsapp_analyzer_operation_id',
      'whatsapp_analyzer_loading',
      'whatsapp_analyzer_fetching_mistral',
      'whatsapp_analyzer_show_analysis',
      'whatsapp_analyzer_chatgpt_response',
      'whatsapp_analyzer_analysis_complete',
      'whatsapp_analyzer_mistral_error',
      'whatsapp_analyzer_force_fetch',
      'whatsapp_analyzer_page_refreshed',
      'whatsapp_analyzer_chat_data',
      'whatsapp_analyzer_has_chat_data',
      'whatsapp_analyzer_is_processing_shared'
    ];

    // Limpiar cada clave del almacenamiento
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Limpiar datos del juego si existen
    if (window.lastAnalysisTopData) {
      delete window.lastAnalysisTopData;
    }

    console.log("User signed out successfully and all data cleared");
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

// Get a user's profile data from our API
export const getUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem('access_token');
    console.log('Token disponible:', token ? 'Sí' : 'No');
    
    if (!token) {
      console.log('No hay token JWT disponible, omitiendo llamada a la API');
      return null;
    }

    // Usar cliente API con auto-refresh
    const { default: apiClient } = await import('./utils/apiClient');
    
    // Configurar timeout para evitar largos tiempos de espera
    const timeoutMs = 10000; // 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await apiClient.get('/auth/me', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.data;
    } catch (apiError) {
      clearTimeout(timeoutId);
      
      // Si es un error de red (servidor no disponible)
      if (apiError.code === 'ERR_NETWORK' || apiError.message === 'Network Error') {
        console.warn('Backend no disponible, continuando sin perfil de usuario desde API');
        
        // Mostrar notificación al usuario
        if (typeof window !== 'undefined' && window.localStorage) {
          const lastNotification = localStorage.getItem('backend_offline_notification');
          const now = Date.now();
          // Solo mostrar la notificación una vez cada 5 minutos
          if (!lastNotification || (now - parseInt(lastNotification)) > 300000) {
            localStorage.setItem('backend_offline_notification', now.toString());
            
            // Crear y mostrar notificación
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #f39c12;
              color: white;
              padding: 15px 20px;
              border-radius: 8px;
              z-index: 10000;
              max-width: 300px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            notification.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 5px;">⚠️ Modo sin conexión</div>
              <div style="font-size: 14px;">El servidor no está disponible. La aplicación funciona con datos locales.</div>
            `;
            
            document.body.appendChild(notification);
            
            // Eliminar notificación después de 5 segundos
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 5000);
          }
        }
        
        // Verificar si tenemos un usuario autenticado en Firebase
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          // Retornar un perfil básico basado en los datos de Firebase
          return {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            plan: 'free', // Plan por defecto
            currentPeriodUsage: 0,
            totalUploads: 0,
            is_admin: false
          };
        }
      }
      
      // Para otros tipos de errores, re-lanzar
      throw apiError;
    }
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    
    // Si es específicamente un error de red, no lanzar el error
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('Error de red detectado, retornando null para permitir continuar');
      return null;
    }
    
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

// Check if a user can upload more chats - ALWAYS queries fresh data from Firebase
export const canUploadChat = async (userId) => {
  try {
    console.log(`[canUploadChat] Verificando elegibilidad para usuario: ${userId}`);
    
    if (!userId) {
      console.error(`[canUploadChat] Error: ID de usuario inválido o vacío`);
      throw new Error('ID de usuario requerido');
    }
    
    // CONSULTA FRESCA - hacer una consulta directa a Firestore cada vez (no cache)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`[canUploadChat] Error: Usuario ${userId} no encontrado en Firestore`);
      throw new Error('Usuario no encontrado');
    }
    
    const userProfile = userDoc.data();
    const plan = userProfile.plan || 'free';
    const currentUsage = userProfile.currentPeriodUsage || 0;
    
    console.log(`[canUploadChat] Plan: ${plan}, Uso actual: ${currentUsage}`);
    console.log(`[canUploadChat] Datos completos del usuario:`, userProfile);
    
    let canUpload = false;
    let quota = 0;
    
    // Free plan users can upload 2 chats
    if (plan === 'free') {
      quota = 2;
      canUpload = currentUsage < 2;
      console.log(`[canUploadChat] Plan FREE - Comparando: ${currentUsage} < 2 = ${canUpload}`);
    }
    // For paid plans, check their quota
    else if (plan === 'basic') {
      quota = 20;
      canUpload = currentUsage < 20;
      console.log(`[canUploadChat] Plan BASIC - Comparando: ${currentUsage} < 20 = ${canUpload}`);
    } else if (plan === 'standard') {
      quota = 50;
      canUpload = currentUsage < 50;
      console.log(`[canUploadChat] Plan STANDARD - Comparando: ${currentUsage} < 50 = ${canUpload}`);
    } else if (plan === 'premium') {
      quota = 120;
      canUpload = currentUsage < 120;
      console.log(`[canUploadChat] Plan PREMIUM - Comparando: ${currentUsage} < 120 = ${canUpload}`);
    }
    
    console.log(`[canUploadChat] RESULTADO FINAL - Puede subir: ${canUpload} (${currentUsage}/${quota})`);
    
    return canUpload;
  } catch (error) {
    console.error('[canUploadChat] Error verificando capacidad de subida:', error);
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

// Login with Google using popup with fallback to redirect
export const loginWithGoogle = async () => {
  try {
    // Configurar persistencia
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistencia configurada para LOCAL durante el login con Google");
    
    const provider = new GoogleAuthProvider();
    
    // Obtener el idioma actual
    const currentLanguage = i18next.language || 'es';
    
    // Personalización de la experiencia de inicio de sesión con Google
    provider.setCustomParameters({
      prompt: 'select_account',
      login_hint: `Login to chatsalsa.com with Google`,
      hl: currentLanguage
    });
    
    // Configurar para que use el idioma del dispositivo
    auth.useDeviceLanguage();
    
    let result;
    let user;
    
    try {
      // Intentar primero con popup - agregar configuración adicional para mejor compatibilidad
      console.log("Intentando login con Google usando popup...");
      
      // Configuración adicional para el popup
      provider.addScope('profile');
      provider.addScope('email');
      
      result = await signInWithPopup(auth, provider);
      user = result.user;
      console.log("Login con Google exitoso con popup, ID:", user.uid);
    } catch (popupError) {
      console.log("Error con popup:", popupError.code, popupError.message);
      
      if (popupError.code === 'auth/popup-blocked') {
        // En lugar de redirect, mostrar instrucciones al usuario
        throw new Error('El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio y vuelve a intentarlo.');
      } else if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('Inicio de sesión cancelado. Inténtalo de nuevo.');
      } else if (popupError.code === 'auth/cancelled-popup-request') {
        throw new Error('Solicitud cancelada. Inténtalo de nuevo.');
      } else if (popupError.code === 'auth/unauthorized-domain') {
        console.error('Dominio no autorizado. Dominio actual:', window.location.hostname);
        throw new Error('Este dominio no está autorizado. Contacta al administrador.');
      } else {
        // Para otros errores, intentar una vez más con configuración simplificada
        console.log("Reintentando con configuración simplificada...");
        try {
          const simpleProvider = new GoogleAuthProvider();
          result = await signInWithPopup(auth, simpleProvider);
          user = result.user;
          console.log("Login con Google exitoso (reintento), ID:", user.uid);
        } catch (retryError) {
          console.error("Error en reintento:", retryError);
          throw popupError; // Lanzar el error original
        }
      }
    }
    
    // CRÍTICO: Obtener token de Firebase y tokens JWT ANTES de continuar
    const idToken = await user.getIdToken();
    
    // Llamar al backend para obtener tokens JWT - DEBE completarse antes de continuar
    const response = await fetch(buildApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ 
        email: user.email, 
        displayName: user.displayName,
        is_admin: false
      })
    });

    if (!response.ok) {
      throw new Error(`Error al autenticar con backend: ${response.status}`);
    }

    const data = await response.json();

    // CRÍTICO: Guardar tokens JWT ANTES de retornar
    if (data.access_token && data.refresh_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log("Tokens JWT guardados exitosamente para usuario de Google");
    } else {
      throw new Error("No se recibieron tokens del backend para usuario de Google");
    }
    
    return user;
    
  } catch (error) {
    console.error('Error iniciando login con Google:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Agregar información específica sobre errores de dominio
    if (error.code === 'auth/unauthorized-domain') {
      console.error('Dominio no autorizado. Verifica en Firebase Console > Authentication > Settings > Authorized domains');
      console.error('Dominio actual:', window.location.hostname);
    }
    
    // Agregar información específica sobre popup bloqueado
    if (error.code === 'auth/popup-blocked') {
      console.error('Popup bloqueado por el navegador. Considera usar redirect como alternativa.');
    }
    
    error.message = getErrorMessage(error.code) || error.message;
    throw error;
  }
};

// Función para manejar el resultado del redirect de Google (si se usa)
export const handleGoogleRedirectResult = async () => {
  try {
    const { getRedirectResult } = await import('firebase/auth');
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log("Resultado de redirect de Google encontrado:", result.user.uid);
      
      // CRÍTICO: Obtener token de Firebase y tokens JWT
      const idToken = await result.user.getIdToken();
      
      // Llamar al backend para obtener tokens JWT
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          email: result.user.email, 
          displayName: result.user.displayName,
          is_admin: false
        })
      });

      if (!response.ok) {
        throw new Error(`Error al autenticar con backend: ${response.status}`);
      }

      const data = await response.json();

      // CRÍTICO: Guardar tokens JWT
      if (data.access_token && data.refresh_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        console.log("Tokens JWT guardados exitosamente para usuario de Google (redirect)");
      } else {
        throw new Error("No se recibieron tokens del backend para usuario de Google (redirect)");
      }
      
      return result.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error manejando resultado de redirect de Google:', error);
    throw error;
  }
};

// Nota: handleGoogleRedirectResult ya no es necesario con signInWithPopup
// El login con Google ahora se maneja completamente en loginWithGoogle()

// Exportar onAuthStateChanged para poder usarlo en otros componentes
export const onAuthStateChanged = (auth, callback) => {
  return firebaseAuthStateChanged(auth, callback);
};

export { auth, db };