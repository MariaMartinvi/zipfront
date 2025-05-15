import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import InstallPWA from './InstallPWA';
import Chatgptresultados from './Chatgptresultados';
// import ChatAnalysisComponent from './ChatAnalysisComponent';
import WhatsappInstructions from './WhatsappInstructions';
import AnalisisPrimerChat from './Analisis_primer_chat';
import AnalisisTop from './Analisis_top';
import { AuthContainer, Login, Register, PasswordReset } from './AuthComponents';
import SubscriptionPlans from './SubscriptionPlans';
import { getCurrentUser, getUserProfile, incrementChatUsage, canUploadChat } from './firebase_auth';
import Header from './Header';
import Footer from './Footer';
import UserPlanBanner from './UserPlanBanner';
import SimplePaymentSuccess from './SimplePaymentSuccess';
import PaymentSuccessBanner from './PaymentSuccessBanner';
import { useAuth } from './AuthContext';
import AuthDebug from './AuthDebug'; // Optional for debugging
import { deleteFiles, uploadFile, getMistralResponse, startChatAnalysis, getAzureResponse } from './fileService';
import Contact from './Paginasextra/Contact';
import FAQ from './Paginasextra/FAQ';
import TermsOfService from './Paginasextra/TermsOfService';
import PrivacyPolicy from './Paginasextra/PrivacyPolicy';
import AppPreview from './AppPreview';
import { useTranslation } from 'react-i18next'; // Importar useTranslation

// Constantes para IndexedDB
const DB_NAME = 'SharedFilesDB';
const STORE_NAME = 'pendingFiles';

// Función para inicializar la base de datos IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Guardar archivo en IndexedDB
const saveSharedFile = async (file) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Guardar el archivo con una clave fija
    return new Promise((resolve, reject) => {
      const request = store.put(file, 'pendingFile');
      request.onsuccess = () => {
        console.log('Archivo guardado en IndexedDB:', file.name);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error guardando archivo en IndexedDB:', error);
  }
};

// Recuperar archivo de IndexedDB
const getSharedFile = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('pendingFile');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error recuperando archivo de IndexedDB:', error);
    return null;
  }
};

// Eliminar archivo de IndexedDB
const removeSharedFile = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete('pendingFile');
      request.onsuccess = () => {
        console.log('Archivo eliminado de IndexedDB');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error eliminando archivo de IndexedDB:', error);
  }
};

// LoginPage component with useNavigate hook
function LoginPage() {
  const navigate = useNavigate();
  return <Login onLoginSuccess={() => navigate('/')} />;
}

// RegisterPage component with useNavigate hook
function RegisterPage() {
  const navigate = useNavigate();
  return <Register onRegisterSuccess={() => navigate('/')} />;
}

// HomePage component - you can define this or use your existing code
function HomePage() {
  // Your homepage component logic
  return (
    <div>
      {/* Your homepage content */}
    </div>
  );
}

// Wrapper component for SubscriptionPlans to access location data
function PlansWithLocationCheck({ user }) {
  const location = useLocation();
  return (
    <SubscriptionPlans 
      userId={user?.uid} 
      paymentSuccess={location.search.includes('payment_success=true')} 
    />
  );
}

// Función para extraer contenido del chat desde un archivo ZIP
const extractChatContent = async (zipContent) => {
  try {
    console.log("Extrayendo contenido del chat del archivo ZIP...");
    
    // Buscar archivos de chat en el ZIP (archivos de texto o con _chat en el nombre)
    let chatContent = null;
    let chatFileName = null;
    
    // Buscar archivos candidatos (_chat.txt o archivos .txt)
    for (const zipEntry in zipContent.files) {
      if (zipEntry.toLowerCase().includes('_chat.txt') || 
          zipEntry.toLowerCase().endsWith('.txt')) {
        chatFileName = zipEntry;
        chatContent = await zipContent.files[zipEntry].async('string');
        break;
      }
    }
    
    if (!chatContent) {
      console.error("No se encontró archivo de chat en el ZIP");
      return { error: "No se encontró ningún archivo de chat" };
    }
    
    console.log(`Archivo de chat encontrado: ${chatFileName}`);
    
    // Anonimizar el contenido del chat antes de devolverlo
    const chatAnonimizado = anonimizarChat(chatContent);
    
    return { 
      chat: chatAnonimizado,
      fileName: chatFileName,
      success: true
    };
  } catch (error) {
    console.error("Error extrayendo contenido del chat:", error);
    return { 
      error: `Error extrayendo contenido: ${error.message}`,
      success: false
    };
  }
};

// Función para anonimizar el contenido del chat
const anonimizarChat = (contenido) => {
  if (!contenido) return contenido;
  
  console.log("Anonimizando contenido del chat...");
  
  try {
    // Diccionarios para mantener consistencia en reemplazos
    const reemplazosEmails = {};
    const reemplazosNumeros = {};
    
    // Función para anonimizar números manteniendo consistencia
    const anonimizarNumero = (numeroStr) => {
      // Limpiar el número para mantener consistencia en reemplazos
      const numeroLimpio = numeroStr.replace(/[\s.-]/g, '');
      
      // Si ya anonimizamos este número antes, usamos el mismo reemplazo
      if (reemplazosNumeros[numeroLimpio]) {
        return reemplazosNumeros[numeroLimpio];
      }
      
      // Anonimización parcial: mantener estructura original reemplazando dígitos
      let resultado = "";
      let contadorDigitos = 0;
      
      // Determinar cuántos dígitos mantener (aproximadamente la mitad)
      const numDigitos = numeroStr.replace(/[^\d]/g, '').length;
      const digitosAMantener = Math.max(2, Math.floor(numDigitos / 2)); // Al menos 2 dígitos
      
      for (const char of numeroStr) {
        if (/\d/.test(char)) {
          if (contadorDigitos < digitosAMantener) {
            resultado += char; // Mantener este dígito
          } else {
            resultado += 'X'; // Reemplazar con X
          }
          contadorDigitos++;
        } else {
          resultado += char; // Mantener separadores y otros caracteres
        }
      }
      
      // Guardar el reemplazo para futuras ocurrencias
      reemplazosNumeros[numeroLimpio] = resultado;
      return resultado;
    };
    
    // Función para anonimizar emails manteniendo consistencia
    const anonimizarEmail = (email) => {
      // Si ya anonimizamos este email antes, usamos el mismo reemplazo
      if (reemplazosEmails[email]) {
        return reemplazosEmails[email];
      }
      
      // Extraer dominio (mantener el dominio)
      const dominioMatch = email.match(/@([\w.-]+)/);
      let anonimizado;
      
      if (dominioMatch) {
        const dominio = dominioMatch[1];
        anonimizado = `email_anon@${dominio}`;
      } else {
        anonimizado = "email_anon@domain.com";
      }
      
      // Guardar el reemplazo para futuras ocurrencias
      reemplazosEmails[email] = anonimizado;
      return anonimizado;
    };
    
    // Detectar y anonimizar números de teléfono y similares
    const detectarYAnonimizarNumeros = (texto) => {
      // Función para comprobar si es una fecha
      const esFecha = (textoMatch) => {
        return /\d+[/:-]\d+/.test(textoMatch);
      };
      
      // Patrones para números con más de 4 dígitos
      const patrones = [
        // Números con prefijos y dígitos: +XX123456789
        /\+\d{1,4}\d{5,}/g,
        
        // Números con prefijos y separadores: +XX XXX XX XX
        /\+\d{1,4}(?:[\s.-]+\d{1,4}){2,}/g,
        
        // Números de al menos 5 dígitos consecutivos
        /\b\d{5,}\b/g,
        
        // Números con espacios como separadores
        /\b\d{2,}(?:\s+\d{1,4}){2,}\b/g,
        
        // Números con guiones como separadores
        /\b\d{2,}(?:-\d{1,4}){2,}\b/g,
        
        // Números con puntos como separadores
        /\b\d{2,}(?:\.\d{1,4}){2,}\b/g
      ];
      
      let textoAnonimizado = texto;
      
      for (const patron of patrones) {
        const matches = textoAnonimizado.match(patron);
        if (matches) {
          for (const match of matches) {
            // Saltar si es una fecha
            if (esFecha(match)) {
              continue;
            }
            
            // Limpiar el número para verificar que tiene más de 4 dígitos
            const numeroLimpio = match.replace(/[^0-9]/g, '');
            if (numeroLimpio.length > 4) {
              // Anonimizar el número manteniendo el formato original
              const anonimizado = anonimizarNumero(match);
              // Reemplazo exacto (evitar reemplazos parciales)
              textoAnonimizado = textoAnonimizado.split(match).join(anonimizado);
            }
          }
        }
      }
      
      return textoAnonimizado;
    };
    
    // Detectar y anonimizar correos electrónicos
    const detectarYAnonimizarEmails = (texto) => {
      // Patrón para emails
      const patronEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronEmail);
      
      if (matches) {
        for (const email of matches) {
          const anonimizado = anonimizarEmail(email);
          textoAnonimizado = textoAnonimizado.split(email).join(anonimizado);
        }
      }
      
      return textoAnonimizado;
    };
    
    // Dividir el texto en líneas para procesarlo línea por línea
    const lineas = contenido.split(/\r?\n/);
    const lineasAnonimizadas = [];
    
    for (let linea of lineas) {
      // Primero anonimizar los emails
      linea = detectarYAnonimizarEmails(linea);
      
      // Luego anonimizar números
      linea = detectarYAnonimizarNumeros(linea);
      
      lineasAnonimizadas.push(linea);
    }
    
    // Unir las líneas en un solo texto
    const contenidoAnonimizado = lineasAnonimizadas.join('\n');
    
    // Registrar las estadísticas de anonimización
    const totalEmails = Object.keys(reemplazosEmails).length;
    const totalNumeros = Object.keys(reemplazosNumeros).length;
    console.log(`Anonimización completada: ${totalEmails} emails y ${totalNumeros} números anonimizados`);
    
    return contenidoAnonimizado;
  } catch (error) {
    console.error("Error al anonimizar el chat:", error);
    return contenido; // En caso de error, devolver el contenido original
  }
};

function App() {
  const { t, i18n } = useTranslation(); // Inicializar hook de traducción
  const [operationId, setOperationId] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);
  const [debugMessages, setDebugMessages] = useState([]);
  const [chatGptResponse, setChatGptResponse] = useState("");
  const [showChatGptResponse, setShowChatGptResponse] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isFetchingMistral, setIsFetchingMistral] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [filesDeleted, setFilesDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Nuevo estado para los datos extraídos del chat
  const [chatData, setChatData] = useState(null);
  // Nuevo estado para alerta de confirmación
  const [showRefreshConfirmation, setShowRefreshConfirmation] = useState(false);
  // Estado para controlar si mostrar el botón de ver análisis
  const [showViewAnalysisButton, setShowViewAnalysisButton] = useState(false);
  // Estado para mensajes de progreso
  const [progressMessage, setProgressMessage] = useState("");
  // Estado para guardar resultados del procesamiento
  const [processingResult, setProcessingResult] = useState(null);
  // Estado para el contenido del chat
  const [chatContent, setChatContent] = useState(null);
  // Estado para controlar la carga desde IndexedDB
  const [isLoadingFromIndexedDB, setIsLoadingFromIndexedDB] = useState(false);
  // Referencias para secciones de análisis - usadas para scroll automático
  const analysisRef = useRef(null);
  // Get user-related state from AuthContext instead of managing locally
  const { user, userProfile, setUserProfile, isAuthLoading, setUser } = useAuth();
  
  // Tracking para evitar procesamiento duplicado
  const processedShareIds = useRef(new Set());
  const isProcessingRef = useRef(false);

  // URL del backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para el logging (visible en modo desarrollo)
  const addDebugMessage = (message) => {
    console.log('[App Debug]', message);
    setDebugMessages(prev => [...prev, { time: new Date().toISOString(), message }]);
  };
  
  // Moved these functions inside the component to access state properly
  const analyzeFile = (file) => {
    console.group("Análisis de archivo desde Google Drive");
    console.log("Nombre:", file.name);
    console.log("Tipo MIME:", file.type);
    console.log("Tamaño:", file.size, "bytes");
    
    // Si el nombre tiene extensión .zip, siempre crea una copia con el tipo correcto
    // sin importar el tipo MIME original (solución más radical)
    let processedFile = file;
    if (file.name.toLowerCase().endsWith('.zip')) {
      // Siempre crear un nuevo archivo con el tipo MIME correcto
      try {
        processedFile = new File([file], file.name, {
          type: 'application/zip',
          lastModified: file.lastModified
        });
        console.log("Archivo forzado con MIME type application/zip", processedFile.type);
      } catch (error) {
        console.error("Error al crear nuevo File:", error);
        // Si falla, intentamos con una solución alternativa usando Blob
        try {
          const blob = file.slice(0, file.size, 'application/zip');
          processedFile = new File([blob], file.name, {
            type: 'application/zip',
            lastModified: file.lastModified
          });
          console.log("Archivo recreado desde Blob con MIME type:", processedFile.type);
        } catch (blobError) {
          console.error("Error al crear archivo desde Blob:", blobError);
          // Mantener el archivo original si todo falla
        }
      }
    }
    
    // Examinar los primeros bytes del archivo para confirmar si es un ZIP
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const byteArray = new Uint8Array(arrayBuffer).slice(0, 30); // Primeros 30 bytes
      
      let hexString = "";
      for (let i = 0; i < byteArray.length; i++) {
        hexString += byteArray[i].toString(16).padStart(2, '0') + ' ';
      }
      
      console.log("Primeros bytes (hex):", hexString);
      
      // Verificar si comienza con la firma ZIP (PK)
      const isZipSignature = byteArray[0] === 0x50 && byteArray[1] === 0x4B;
      console.log("¿Firma ZIP válida?", isZipSignature);
      
      console.groupEnd();
    };
    
    reader.readAsArrayBuffer(file.slice(0, 30));
    
    return processedFile;
  };

  // Check if user can upload a chat based on their subscription plan
  const checkUploadEligibility = async () => {
    console.log("Verificando elegibilidad para cargar - Estado actual del usuario:", user);
    
    if (!user) {
      // Intentar recuperar el usuario una vez más desde Firebase
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUserProfile(currentUser);
          console.log("Usuario recuperado correctamente desde Firebase:", currentUser);
          window.recoveredUser = currentUser; // Guardar para uso posterior

          if (setUser) setUser(currentUser); // Usar condicional para evitar errores

          // Actualizar el estado de usuario manualmente
          // Nota: Esto es un hack temporal. Lo ideal sería que esto ocurra a través de AuthContext
          window._tempUser = currentUser; // Almacenar en una variable temporal
          
          // Intentar recuperar el perfil del usuario
          try {
            const profile = await getUserProfile(currentUser.uid);
            window._tempUserProfile = profile;
          } catch (profileError) {
            console.error("Error recuperando perfil de usuario:", profileError);
          }
          
          // Verificar si el usuario puede cargar
          try {
            const canUpload = await canUploadChat(currentUser.uid);
            if (!canUpload) {
              setShowUpgradeModal(true);
              return false;
            }
            return true;
          } catch (planError) {
            console.error("Error verificando plan:", planError);
            setError("Error verificando tu plan. Por favor, recarga la página.");
            return false;
          }
        } else {
          // No hay usuario autenticado
          setError('Debes iniciar sesión para analizar conversaciones.');
          // Redirigir a la página de login después de un breve retraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return false;
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        setError('Error al verificar tu sesión. Por favor, inicia sesión nuevamente.');
        return false;
      }
    }
    
    // Ya hay un usuario en el contexto, verificar plan
    try {
      const canUpload = await canUploadChat(user.uid);
      
      if (!canUpload) {
        setShowUpgradeModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando plan de usuario:', error);
      setError('Error al verificar tu plan. Por favor, inténtalo de nuevo.');
      return false;
    }
  };

  // Función para procesar el archivo ZIP una vez validado y autorizado
  const processZipFile = async (file) => {
    if (!file) {
      setError(t('error.file_type'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setProgressMessage(t('app.loading_status'));
      
      // Limpiar cualquier operación previa
      setOperationId(null);
      setChatData(null);
      
      // Generar un ID de operación único para esta sesión
      const newOperationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setOperationId(newOperationId);
      
      // Intentar leer el archivo ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      try {
        // Procesar el archivo ZIP
        const zipContent = await zip.loadAsync(file);
        // Extraer contenido del chat
        const extractedContent = await extractChatContent(zipContent);
        
        if (extractedContent && extractedContent.chat) {
          // Guardamos el contenido del chat en el estado para usarlo en todos los análisis
          console.log("Estableciendo chatData:", extractedContent.chat.substring(0, 50) + "...");
          setChatData(extractedContent.chat);
          
          // También guardar en localStorage para persistencia entre refrescos
          try {
            localStorage.setItem('whatsapp_analyzer_chat_data', extractedContent.chat);
            localStorage.setItem('whatsapp_analyzer_has_chat_data', 'true');
          } catch (storageError) {
            console.error("Error al guardar chatData en localStorage:", storageError);
          }
          
          // No es necesario enviar nada al backend ya que procesamos en el frontend
          console.log('Archivo ZIP procesado exitosamente en el cliente.');
          addDebugMessage('Análisis procesado exitosamente en el cliente.');
          setShowAnalysis(true);
          
          // Para compatibilidad hacia atrás, mantener el flujo de operationId
          // Esta línea actualizará todos los demás componentes que aún dependan del ID
          setOperationId(newOperationId);
          
          // Simular un pequeño retraso para dar tiempo a que la UI se actualice
          setTimeout(() => {
            setIsLoading(false);
            scrollToAnalysis();
            
            // Establecer flag para indicar que el análisis está completo (para la limpieza automática)
            localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
            
            // Programar limpieza automática después de 30 minutos
            setTimeout(() => {
              checkAndDeleteFiles(newOperationId);
            }, 1800000); // 30 minutos
          }, 500);
          
          return true;
        } else {
          throw new Error(t('error.no_chat_found'));
        }
      } catch (error) {
        console.error('Error procesando ZIP:', error);
        setError(`${t('app.errors.processing_zip')}: ${error.message}`);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error procesando ZIP:', error);
      setError(`${t('app.errors.processing_zip')}: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Función para manejar scroll automático hacia la sección de análisis
  const scrollToAnalysis = () => {
    // Intentar varias veces en caso de que el componente aún no esté renderizado
    let attempts = 0;
    const maxAttempts = 5;
    
    const tryScroll = () => {
      attempts++;
      if (analysisRef.current) {
        // Si encontramos la referencia, hacer scroll
        analysisRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
        console.log('Scrolling to analysis section - Success');
      } else if (attempts < maxAttempts) {
        // Si no encontramos la referencia y no hemos agotado los intentos, probar de nuevo
        console.log(`Scroll attempt ${attempts}/${maxAttempts} - Reference not found, retrying...`);
        setTimeout(tryScroll, 300);
      } else {
        // Si agotamos los intentos, hacer scroll al inicio de la página como fallback
        console.log('Scroll failed, falling back to window.scrollTo(0,0)');
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };
    
    // Iniciar el intento de scroll
    setTimeout(tryScroll, 100);
  };

  // Manejar la carga manual de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Archivo recibido:", file.name, "Tipo:", file.type, "Tamaño:", file.size);
    
    // Hacer scroll inmediatamente al seleccionar el archivo, sin esperar al procesamiento
    setTimeout(() => scrollToAnalysis(), 100);
    
    // Limpiar los datos anteriores al iniciar un nuevo análisis
    setOperationId(null);
    setChatGptResponse("");
    setShowChatGptResponse(false);
    localStorage.removeItem('whatsapp_analyzer_operation_id');
    localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
    localStorage.removeItem('whatsapp_analyzer_analysis_complete');
    
    // Verificación extremadamente permisiva - aceptar cualquier archivo con extensión .zip
    // o cualquier archivo con tipo MIME que pueda ser un ZIP
    const isZipFile = file.name.toLowerCase().endsWith('.zip') || 
                      file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
                      file.type === 'application/octet-stream' ||
                      file.type === ''; // Google Drive a veces puede enviar tipo vacío
    
    if (!isZipFile) {
      setError(t('app.errors.zip_file'));
      return;
    }
    
    // Analizar y corregir el archivo si es necesario
    const analyzedFile = analyzeFile(file);
    
    // Check if user is logged in and has available uploads
    const isEligible = await checkUploadEligibility();
    if (!isEligible) {
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }
    
    const currentUser = window._tempUser || await getCurrentUser();
    if (currentUser && !user) {
      console.log("Actualizando estado del usuario desde handleSharedFile:", currentUser.uid);
      setUser(currentUser);
      if (typeof setUser === 'function') {
        setUser(currentUser);
      } else {
        console.error("setUser no está disponible");
      }

    }
    setError('');
    setIsLoading(true);
    setZipFile(analyzedFile);
    setProgressMessage("Procesando chat: Extrayendo mensajes y participantes...");
    
    try {
      await processZipFile(analyzedFile);
      
      // Ya no es necesario hacer scroll aquí, ya que lo hacemos al inicio
      // scrollToAnalysis();
      
      // If processing was successful, increment usage counter with retry mechanism
      if (user) {
        try {
          addDebugMessage(`Incrementando contador para usuario: ${user.uid} - Método de carga: Manual Upload`);
          
          // Verificar explícitamente que tenemos un usuario válido
          if (!user.uid) {
            addDebugMessage(`Error: UID de usuario no válido. Valor: ${JSON.stringify(user)}`);
            throw new Error('Usuario no tiene UID válido');
          }
          
          // Intentar incrementar el contador con reintentos
          let incrementSuccess = false;
          let attemptCount = 0;
          const maxAttempts = 3;
          
          while (!incrementSuccess && attemptCount < maxAttempts) {
            attemptCount++;
            try {
              addDebugMessage(`Intento ${attemptCount} de incrementar contador para ${user.uid}`);
              await incrementChatUsage(user.uid);
              incrementSuccess = true;
              addDebugMessage(`Incremento exitoso en intento ${attemptCount}`);
              
              // Actualizar datos locales del perfil
              if (userProfile) {
                const newPeriodUsage = (userProfile.currentPeriodUsage || 0) + 1;
                const newTotalUploads = (userProfile.totalUploads || 0) + 1;
                
                setUserProfile({
                  ...userProfile,
                  currentPeriodUsage: newPeriodUsage,
                  totalUploads: newTotalUploads
                });
                
                addDebugMessage(`Perfil de usuario actualizado localmente. Nuevos valores: currentPeriodUsage=${newPeriodUsage}, totalUploads=${newTotalUploads}`);
              } else {
                addDebugMessage(`Advertencia: userProfile no disponible para actualización local. user=${user.uid}`);
              }
            } catch (incrementError) {
              addDebugMessage(`Error en intento ${attemptCount}: ${incrementError.message}`);
              
              // Esperar antes de reintentar
              if (attemptCount < maxAttempts) {
                const delayMs = attemptCount * 5000; // 5s, 10s, 15s
                addDebugMessage(`Esperando ${delayMs/1000}s antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }
          }
          
          if (!incrementSuccess) {
            addDebugMessage(`Error: No se pudo incrementar el contador después de ${maxAttempts} intentos`);
          }
        } catch (outerError) {
          addDebugMessage(`Error general al incrementar contador: ${outerError.message}`);
        }
      } else {
        addDebugMessage("No hay usuario autenticado para incrementar contador");
      }
    } catch (err) {
      console.error('Error al procesar:', err);
      setError(`Error al procesar el archivo: ${err.message}. Inténtalo más tarde.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar archivos recibidos del service worker
  const handleSharedFile = async (file) => {
    addDebugMessage(`Procesando archivo compartido: ${file.name}, tipo: ${file.type}`);
    
    // Limpiar los datos anteriores al iniciar un nuevo análisis
    setOperationId(null);
    setChatGptResponse("");
    setShowChatGptResponse(false);
    setChatData(null);  // Asegurar que chatData se limpia
    localStorage.removeItem('whatsapp_analyzer_operation_id');
    localStorage.removeItem('whatsapp_analyzer_loading');
    localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
    localStorage.removeItem('whatsapp_analyzer_show_analysis');
    localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
    localStorage.removeItem('whatsapp_analyzer_analysis_complete');
    localStorage.removeItem('whatsapp_analyzer_mistral_error');
    localStorage.removeItem('whatsapp_analyzer_chat_data');
    localStorage.removeItem('whatsapp_analyzer_has_chat_data');
    
    if (!file) {
      setError('No se pudo recibir el archivo');
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }
    
    // Verificación extremadamente permisiva - aceptar cualquier archivo con extensión .zip
    // o cualquier archivo con tipo MIME que pueda ser un ZIP
    const isZipFile = file.name.toLowerCase().endsWith('.zip') || 
                      file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
                      file.type === 'application/octet-stream' ||
                      file.type === ''; // Google Drive a veces puede enviar tipo vacío
    
    if (!isZipFile) {
      addDebugMessage(`Archivo no es ZIP: ${file.type}`);
      setError(`Por favor, comparte un archivo ZIP válido. Tipo recibido: ${file.type}`);
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }
    
    // Analizar y posiblemente corregir el archivo antes de procesarlo
    addDebugMessage('Analizando y corrigiendo tipo MIME del archivo');
    const analyzedFile = analyzeFile(file);
    
    // Check if user is logged in and has available uploads
    addDebugMessage('Verificando elegibilidad del usuario para subir');
    const isEligible = await checkUploadEligibility();
   
    if (!isEligible) {
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }

    // Usar el usuario recuperado para el contador
    const recoveredUser = window.recoveredUser;
    if (recoveredUser && !user) {
      console.log("Usando usuario recuperado para incrementar contador:", recoveredUser.uid);
      try {
        // Incrementar contador directamente con el usuario recuperado
        await incrementChatUsage(recoveredUser.uid);
        console.log("Contador incrementado con usuario recuperado");
      } catch (err) {
        console.error("Error incrementando contador con usuario recuperado:", err);
      }
    }

    setError('');
    setIsLoading(true);
    setZipFile(analyzedFile); // Usar el archivo analizado/corregido
    
    let processingSuccess = false;
    
    try {
      addDebugMessage(`Enviando archivo corregido al backend: ${analyzedFile.name} (${analyzedFile.size} bytes) - Tipo: ${analyzedFile.type}`);
      // Procesar el archivo
      await processZipFile(analyzedFile); // Usar el archivo analizado/corregido
      
      // Hacer scroll hacia la sección de análisis después de procesar con éxito
      scrollToAnalysis();
      
      // Si llegamos aquí, el procesamiento fue exitoso
      processingSuccess = true;
      
      // If processing was successful, increment usage counter with retry mechanism
      if (user) {
        try {
          addDebugMessage(`Incrementando contador para usuario: ${user.uid} - Método de carga: WhatsApp Share`);
          
          // Verificar explícitamente que tenemos un usuario válido
          if (!user.uid) {
            addDebugMessage(`Error: UID de usuario no válido. Valor: ${JSON.stringify(user)}`);
            throw new Error('Usuario no tiene UID válido');
          }
          
          // Intentar incrementar el contador con reintentos
          let incrementSuccess = false;
          let attemptCount = 0;
          const maxAttempts = 3;
          
          while (!incrementSuccess && attemptCount < maxAttempts) {
            attemptCount++;
            try {
              addDebugMessage(`Intento ${attemptCount} de incrementar contador para ${user.uid}`);
              await incrementChatUsage(user.uid);
              incrementSuccess = true;
              addDebugMessage(`Incremento exitoso en intento ${attemptCount}`);
              
              // Actualizar datos locales del perfil
              if (userProfile) {
                const newPeriodUsage = (userProfile.currentPeriodUsage || 0) + 1;
                const newTotalUploads = (userProfile.totalUploads || 0) + 1;
                
                setUserProfile({
                  ...userProfile,
                  currentPeriodUsage: newPeriodUsage,
                  totalUploads: newTotalUploads
                });
                
                addDebugMessage(`Perfil de usuario actualizado localmente. Nuevos valores: currentPeriodUsage=${newPeriodUsage}, totalUploads=${newTotalUploads}`);
              } else {
                addDebugMessage(`Advertencia: userProfile no disponible para actualización local. user=${user.uid}`);
              }
            } catch (incrementError) {
              addDebugMessage(`Error en intento ${attemptCount}: ${incrementError.message}`);
              
              // Esperar antes de reintentar
              if (attemptCount < maxAttempts) {
                const delayMs = attemptCount * 5000; // 5s, 10s, 15s
                addDebugMessage(`Esperando ${delayMs/1000}s antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }
          }
          
          if (!incrementSuccess) {
            addDebugMessage(`Error: No se pudo incrementar el contador después de ${maxAttempts} intentos`);
          }
        } catch (outerError) {
          addDebugMessage(`Error general al incrementar contador: ${outerError.message}`);
        }
      } else {
        addDebugMessage("No hay usuario autenticado para incrementar contador");
      }
    } catch (err) {
      addDebugMessage(`Error procesando archivo: ${err.message}. Inténtalo más tarde.`);
      setError(`Error al procesar el archivo: ${err.message}. Inténtalo más tarde.`);
      
      // Último recurso - intentar procesar el archivo original si el corregido falló
      if (file !== analyzedFile) {
        addDebugMessage('Intentando procesar el archivo original como último recurso');
        try {
          await processZipFile(file);
          // Si llegó aquí, funcionó
          addDebugMessage('Procesamiento del archivo original exitoso');
          setError(''); // Limpiar el error anterior
          processingSuccess = true;
          
          // Incrementar contador también si el archivo original tuvo éxito
          if (user) {
            try {
              addDebugMessage(`Incrementando contador (archivo original) para usuario: ${user.uid}`);
              await incrementChatUsage(user.uid);
              if (userProfile) {
                setUserProfile({
                  ...userProfile,
                  currentPeriodUsage: (userProfile.currentPeriodUsage || 0) + 1,
                  totalUploads: (userProfile.totalUploads || 0) + 1
                });
              }
              addDebugMessage("Contador de uso incrementado correctamente (archivo original)");
            } catch (usageError) {
              addDebugMessage(`Error al incrementar contador (archivo original): ${usageError.message}`);
            }
          } else {
            addDebugMessage("No hay usuario autenticado para incrementar contador (archivo original)");
          }
        } catch (origErr) {
          addDebugMessage(`Error procesando archivo original: ${origErr.message}`);
          // Mantener el error original
        }
      }
    } finally {
      setIsLoading(false);
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      
      if (processingSuccess) {
        addDebugMessage("Procesamiento completado con éxito");
      }
    }
  };
  
  useEffect(() => {
    // Check URL for payment_success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      // Show success message
      setShowPaymentSuccess(true);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Función para el manejo de extracción de ZIP
  const handleZipExtraction = (data) => {
    if (data && data.chat) {
      console.log("Chat extraído con éxito. Preparando para análisis...");
      // Guardar los datos del chat para que estén disponibles para los componentes
      setChatData(data.chat);
      // También guardar en localStorage para persistencia entre refrescos
      try {
        localStorage.setItem('whatsapp_analyzer_chat_data', data.chat);
        localStorage.setItem('whatsapp_analyzer_has_chat_data', 'true');
      } catch (error) {
        console.error("Error al guardar chatData en localStorage:", error);
      }
      
      // Activar la visualización del análisis
      setShowAnalysis(true);
      
      // Proceder con el análisis AI
      fetchMistralResponse();
    } else {
      console.error("Error: No se pudo extraer el chat del archivo");
      setError("No se pudo extraer el chat del archivo. Verifica que sea un archivo ZIP válido de WhatsApp.");
    }
  };

  // Function to poll for Mistral response - Mejorada para ser más robusta
  const fetchMistralResponse = async () => {
    // Verificar que tenemos datos del chat para analizar
    if (!chatData) {
      console.log('fetchMistralResponse: No hay datos de chat disponibles para analizar');
      addDebugMessage('No hay datos de chat disponibles para analizar');
      setError('No hay datos de chat disponibles para analizar');
      return;
    }
    
    // Verificar si la operación ya está completa
    const isComplete = localStorage.getItem('whatsapp_analyzer_analysis_complete') === 'true';
    const storedResponse = localStorage.getItem('whatsapp_analyzer_chatgpt_response');

    // Si ya tenemos una respuesta almacenada y el análisis está marcado como completo
    if (isComplete && storedResponse && !isFetchingMistral) {
      console.log('Restaurando análisis previo completado desde localStorage');
      setChatGptResponse(storedResponse);
      setShowChatGptResponse(true);
      return;
    }
    
    // Evitar múltiples solicitudes simultáneas pero con protección contra bloqueos
    if (isFetchingMistral && !localStorage.getItem('whatsapp_analyzer_force_fetch')) {
      // Verificar si ha pasado demasiado tiempo desde el último intento
      const lastFetchTime = parseInt(localStorage.getItem('whatsapp_analyzer_last_fetch_time') || '0');
      const currentTime = Date.now();
      const timeSinceLastFetch = currentTime - lastFetchTime;
      
      // Si han pasado más de 30 segundos, podemos asumir que se bloqueó
      if (lastFetchTime === 0 || timeSinceLastFetch > 30000) {
        console.log(`⚠️ Reiniciando estado de fetchMistral por posible bloqueo (${timeSinceLastFetch/1000}s sin respuesta)`);
        // Resetear el estado para poder reintentar
        localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
      } else {
        console.log(`Ya hay una solicitud en curso para obtener la respuesta de Mistral (hace ${timeSinceLastFetch/1000}s)`);
        return;
      }
    }
    
    // Registrar tiempo de inicio para control de timeout
    localStorage.setItem('whatsapp_analyzer_last_fetch_time', Date.now().toString());
    
    // Limpiar el flag de forzar fetch si existe
    localStorage.removeItem('whatsapp_analyzer_force_fetch');
    
    console.log(`INICIANDO ANÁLISIS DE IA - Tenemos chatData: ${!!chatData}, Longitud: ${chatData?.length || 0}`);
    
    setIsFetchingMistral(true);
    setProgressMessage(t('app.generating_ai_analysis'));
    
    try {
      addDebugMessage('Analizando chat directamente con Azure OpenAI desde el frontend');
      console.log('Iniciando análisis con chatData de longitud:', chatData.length);
      
      // Actualizar mensaje de progreso
      setProgressMessage(`${t('app.generating_analysis')}: ${t('progress_phases.processing_data')}`);
      
      // Obtener el idioma del usuario (predeterminado a 'es')
      const userLanguage = localStorage.getItem('i18nextLng') || 'es';
      
      console.log(`Enviando solicitud a Azure OpenAI - Idioma: ${userLanguage}`);
      
      // Enviar solicitud directamente a Azure OpenAI usando el método actualizado
      const result = await getMistralResponse(chatData, userLanguage);
      
      console.log('Respuesta del servicio de IA recibida:', { 
        success: result.success, 
        ready: result.ready,
        tieneRespuesta: !!result.response,
        longitudRespuesta: result.response?.length || 0
      });
      
      if (result.success && result.ready && result.response) {
        addDebugMessage('Respuesta de Azure recibida con éxito');
        setChatGptResponse(result.response);
        setShowChatGptResponse(true);
        
        // Guardar en localStorage que el análisis está completo
        localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
        localStorage.setItem('whatsapp_analyzer_chatgpt_response', result.response);
        
        // Hacer scroll automático hacia arriba cuando finaliza el análisis
        setTimeout(() => scrollToAnalysis(), 300);
        
        // Programar limpieza automática después de 30 minutos
        setTimeout(() => {
          addDebugMessage('Programando limpieza local después de análisis completado');
          checkAndDeleteFiles(operationId);
        }, 1800000); // Esperar 30 minutos (1800000 ms)
        
        setIsFetchingMistral(false);
        // Eliminar marca de tiempo al completar
        localStorage.removeItem('whatsapp_analyzer_last_fetch_time');
        return true;
      } else {
        // Si hay un error, mostrar mensaje
        console.error('Error en respuesta de IA:', result.error || 'Error desconocido');
        addDebugMessage(`Error al obtener respuesta de Azure: ${result.error}`);
        setError(result.error || 'Error al analizar el chat con Azure OpenAI');
        setIsFetchingMistral(false);
        // Eliminar marca de tiempo al completar (incluso con error)
        localStorage.removeItem('whatsapp_analyzer_last_fetch_time');
        return false;
      }
    } catch (error) {
      console.error('Excepción en fetchMistralResponse:', error);
      addDebugMessage(`Error general en fetchMistralResponse: ${error.message}`);
      setIsFetchingMistral(false);
      setError(`Error al analizar el chat: ${error.message}`);
      // Guardar que hubo un error para poder recuperarse después
      localStorage.setItem('whatsapp_analyzer_mistral_error', 'true');
      // Eliminar marca de tiempo al completar (incluso con error)
      localStorage.removeItem('whatsapp_analyzer_last_fetch_time');
      return false;
    }
  };
  
  // Add this new function for checking if processing is complete before deleting
  const checkAndDeleteFiles = async (operationId, retries = 5, delay = 20000) => {
    if (retries <= 0) {
      addDebugMessage('Máximo de reintentos alcanzado, intentando limpiar almacenamiento local');
      tryDeleteFiles(operationId);
      return;
    }
    
    try {
      // En lugar de verificar en el backend, simplemente verificamos si hay un flag local
      const isComplete = localStorage.getItem('whatsapp_analyzer_analysis_complete') === 'true';
      
      if (isComplete) {
        addDebugMessage('Procesamiento confirmado como completo, limpiando almacenamiento local en 60 segundos');
        // Add a longer delay to ensure any ongoing processes are complete
        setTimeout(() => tryDeleteFiles(operationId), 60000);
      } else {
        addDebugMessage(`Procesamiento no completado todavía, esperando ${delay/1000} segundos...`);
        setTimeout(() => checkAndDeleteFiles(operationId, retries - 1, delay), delay);
      }
    } catch (error) {
      addDebugMessage(`Error en el proceso de verificación: ${error.message}`);
      setTimeout(() => checkAndDeleteFiles(operationId, retries - 1, delay), delay);
    }
  };

const tryDeleteFiles = async (operationId) => {
  try {
    addDebugMessage('Limpiando datos del análisis del almacenamiento local');
    
    // Eliminar datos relacionados con el análisis del localStorage
    localStorage.removeItem('whatsapp_analyzer_operation_id');
    localStorage.removeItem('whatsapp_analyzer_loading');
    localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
    localStorage.removeItem('whatsapp_analyzer_show_analysis');
    localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
    localStorage.removeItem('whatsapp_analyzer_analysis_complete');
    localStorage.removeItem('whatsapp_analyzer_mistral_error');
    localStorage.removeItem('whatsapp_analyzer_force_fetch');
    localStorage.removeItem('whatsapp_analyzer_page_refreshed');
    
    // También limpiar el estado de la aplicación
    setZipFile(null);
    setChatData(null);
    if (operationId) {
      setOperationId(null);
    }
    
    addDebugMessage('Datos eliminados exitosamente del almacenamiento local');
  } catch (error) {
    addDebugMessage(`Error al limpiar datos locales: ${error.message}`);
  }
};
  // Start analysis when we have chat data
  useEffect(() => {
    // Verificar si estamos cargando desde IndexedDB
    if (isLoadingFromIndexedDB) {
      console.log('Aún cargando desde IndexedDB, postponiendo análisis...');
      // Añadir un timeout de respaldo en caso de que se quede bloqueado
      const backupTimer = setTimeout(() => {
        console.log('⚠️ Forzando análisis a pesar de carga de IndexedDB por timeout');
        // Verificar nuevamente si tenemos datos del chat
        if (chatData && !chatGptResponse) {
          console.log('Iniciando fetchMistralResponse desde timeout de respaldo...');
          fetchMistralResponse();
        }
      }, 15000); // 15 segundos de espera máxima
      
      return () => clearTimeout(backupTimer);
    }
    
    // Si tenemos datos de chat pero no respuesta de IA, iniciar análisis
    if (chatData) {
      // Crear un pequeño retraso para asegurar que todos los estados están actualizados
      console.log('Tenemos datos de chat, programando análisis en 500ms...');
      const timer = setTimeout(() => {
        // Verificar nuevamente si tenemos respuesta para evitar duplicados
        if (!chatGptResponse) {
          console.log('Iniciando fetchMistralResponse desde useEffect...');
          fetchMistralResponse();
        } else {
          console.log('Ya tenemos chatGptResponse, omitiendo fetchMistralResponse');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('No hay datos de chat disponibles para análisis');
    }
  }, [chatData, chatGptResponse, isLoadingFromIndexedDB]);

  // Gestionar archivos recibidos por compartición (simulado, ya que no tenemos ShareReceiver)
  const handleSharedFiles = (sharedFiles) => {
    if (sharedFiles && sharedFiles.length > 0) {
      console.log("Archivos compartidos recibidos:", sharedFiles);
      setZipFile(sharedFiles[0]);
      setIsProcessingSharedFile(true);
    }
  };

  // Función para encontrar archivos de chat entre los archivos procesados
  const encontrarArchivosChat = (archivos) => {
    if (!archivos || archivos.length === 0) return null;
    
    // Buscar archivos con nombres que indiquen que son chats
    const posiblesChats = archivos.filter(file => {
      const nombre = file.name.toLowerCase();
      return nombre.includes('chat') || 
             nombre.endsWith('.txt') || 
             nombre.includes('whatsapp') ||
             nombre.includes('_chat');
    });
    
    // Si encontramos alguno, devolver el primero
    if (posiblesChats.length > 0) {
      console.log("Archivo de chat encontrado:", posiblesChats[0].name);
      return posiblesChats[0];
    }
    
    return null;
  };

  // Procesar archivos de forma asíncrona
  useEffect(() => {
    const processFiles = async () => {
      if (zipFile && isProcessingSharedFile) {
        console.log(`Iniciando procesamiento de archivo: ${zipFile.name}`);
        
        // Limpiar estados previos
        setChatGptResponse("");
        setShowChatGptResponse(false);
        setOperationId(null); // Asegurar que operationId se resetea
        setChatData(null); // Resetear chatData explícitamente
        
        // Limpiar localStorage relacionado con análisis previos
        localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
        localStorage.removeItem('whatsapp_analyzer_analysis_complete');
        localStorage.removeItem('whatsapp_analyzer_chat_data');
        localStorage.removeItem('whatsapp_analyzer_has_chat_data');
        
        setIsLoading(true);
        setError('');
        console.log(`Procesando archivo: ${zipFile.name}`);
        
        try {
          // Usar nuestro procesador cliente para extraer y anonimizar
          console.log('Llamando a processZipFile...');
          const result = await processZipFile(zipFile);
          console.log('Resultado de processZipFile:', result);
          
          if (result === true || (result && result.success)) {
            console.log("Procesamiento completado con éxito");
            if (result.processedFiles) {
              setFiles(result.processedFiles);
              setProcessingResult(result);
              
              // Buscar el archivo de chat para análisis
              console.log('Buscando archivo de chat entre los procesados...');
              const chatFile = encontrarArchivosChat(result.processedFiles);
              if (chatFile) {
                console.log("Archivo de chat encontrado para análisis:", chatFile.name);
                // Usar FileReader para leer el contenido del archivo de chat
                const reader = new FileReader();
                reader.onload = (e) => {
                  const content = e.target.result;
                  console.log(`Contenido de chat leído, longitud: ${content.length}`);
                  setChatContent(content);
                  
                  // Si chatData no se estableció en processZipFile, establecerlo aquí
                  if (!chatData) {
                    console.log("Estableciendo chatData desde FileReader");
                    setChatData(content);
                    // También guardar en localStorage
                    localStorage.setItem('whatsapp_analyzer_chat_data', content);
                    localStorage.setItem('whatsapp_analyzer_has_chat_data', 'true');
                  }
                };
                reader.readAsText(chatFile.data);
              } else {
                console.warn('No se encontró ningún archivo de chat');
              }
            }
            
            // Una vez procesado con éxito, eliminar el archivo pendiente de IndexedDB
            console.log('Eliminando archivo de IndexedDB después de procesamiento exitoso');
            await removeSharedFile();
          } else {
            console.error("Error en el procesamiento:", result?.error || "Error desconocido");
            setError(result?.error || "Error procesando el archivo");
          }
        } catch (err) {
          console.error("Error durante el procesamiento:", err);
          setError(`Error: ${err.message}`);
        } finally {
          setIsLoading(false);
          setIsProcessingSharedFile(false);
        }
      }
    };

    processFiles();
  }, [zipFile, isProcessingSharedFile]);

  // Efecto para procesar parámetros de URL
  useEffect(() => {
    // Verificar parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const isShared = urlParams.has('shared');
    const hasError = urlParams.has('error');
    const shareId = urlParams.get('shared');
    const errorReason = urlParams.get('reason');
    
    if (hasError) {
      const errorMessage = errorReason 
        ? `Error: ${decodeURIComponent(errorReason)}`
        : 'Hubo un problema al procesar el archivo compartido. Por favor, intenta de nuevo.';
      
      setError(errorMessage);
      addDebugMessage(`Error detectado en parámetros URL: ${errorMessage}`);
      
      // Limpiar URL después de procesar el error
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (isShared && shareId) {
      // Evitar procesar el mismo ID más de una vez
      if (processedShareIds.current.has(shareId)) {
        addDebugMessage(`ShareID ${shareId} ya fue procesado, ignorando`);
        
        // Limpiar URL después de verificar duplicado
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Evitar procesamiento concurrente
      if (isProcessingRef.current) {
        addDebugMessage('Ya hay un procesamiento en curso, ignorando');
        return;
      }
      
      addDebugMessage(`Parámetro 'shared' detectado en URL: ${shareId}`);
      setIsProcessingSharedFile(true);
      isProcessingRef.current = true;
      
      // Solicitar el archivo compartido si tenemos un ID y el Service Worker está activo
      if (navigator.serviceWorker.controller) {
        addDebugMessage('Solicitando archivo compartido al Service Worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_SHARED_FILE',
          shareId: shareId
        });
        
        // Configurar un timeout por si no recibimos respuesta
        setTimeout(() => {
          if (isProcessingRef.current) {
            addDebugMessage('Timeout esperando archivo compartido');
            setError('No se pudo recibir el archivo compartido. Por favor, intenta de nuevo.');
            setIsProcessingSharedFile(false);
            isProcessingRef.current = false;
          }
        }, 30000); // 30 segundos
      } else {
        addDebugMessage('Service Worker no está controlando la página, no se puede solicitar el archivo');
        setError('El Service Worker no está listo. Por favor, recarga la página e intenta de nuevo.');
        setIsProcessingSharedFile(false);
        isProcessingRef.current = false;
      }
      
      // Limpiar URL después de procesar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Efecto para manejar Service Worker y verificar archivos pendientes
  useEffect(() => {
    // Verificar si hay archivos pendientes en IndexedDB al iniciar
    const checkPendingFiles = async () => {
      try {
        setIsLoadingFromIndexedDB(true); // Marcar inicio de carga
        // Añadir un timeout de seguridad para resetear el estado de carga
        const loadingTimeout = setTimeout(() => {
          console.log('⚠️ Reiniciando estado de carga desde IndexedDB por timeout de seguridad');
          setIsLoadingFromIndexedDB(false);
        }, 10000); // 10 segundos de timeout

        const pendingFile = await getSharedFile();
        if (pendingFile) {
          console.log('Archivo pendiente encontrado en IndexedDB:', pendingFile.name);
          
          // Verificar primero si el usuario está logueado
          if (!user) {
            console.log('Usuario no logueado pero hay archivo pendiente, redirigiendo a login');
            setError('Debes iniciar sesión para analizar conversaciones');
            // Redirigir a la página de login después de un breve retraso
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            clearTimeout(loadingTimeout); // Limpiar el timeout si salimos antes
            setIsLoadingFromIndexedDB(false); // Importante: resetear el estado
            return;
          }
          
          // Limpiar cualquier análisis anterior
          localStorage.removeItem('whatsapp_analyzer_operation_id');
          localStorage.removeItem('whatsapp_analyzer_loading');
          localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
          localStorage.removeItem('whatsapp_analyzer_show_analysis');
          localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
          localStorage.removeItem('whatsapp_analyzer_analysis_complete');
          localStorage.removeItem('whatsapp_analyzer_mistral_error');
          localStorage.removeItem('whatsapp_analyzer_chat_data');
          localStorage.removeItem('whatsapp_analyzer_has_chat_data');
          
          // Limpiar estados
          setChatGptResponse("");
          setShowChatGptResponse(false);
          setOperationId(null);
          setChatData(null);
          
          // Procesar el archivo pendiente
          setZipFile(pendingFile);
          setIsProcessingSharedFile(true);
        }
        
        // Siempre resetear el estado de carga, éxito o fallo
        clearTimeout(loadingTimeout); // Limpiar timeout ya que terminamos
        setIsLoadingFromIndexedDB(false);
      } catch (error) {
        console.error('Error al verificar archivos pendientes:', error);
        setIsLoadingFromIndexedDB(false); // Importante: resetear también en caso de error
      }
    };
    
    // Comprobar archivos pendientes al inicio
    checkPendingFiles();
    
    // Configurar el Service Worker si está disponible
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          addDebugMessage('Service Worker registrado correctamente');
          
          // Comprobar si el Service Worker está activo
          if (navigator.serviceWorker.controller) {
            addDebugMessage('Service Worker está controlando la página');
          } else {
            addDebugMessage('Service Worker registrado pero aún no controla la página');
          }
        } catch (error) {
          addDebugMessage(`Error al registrar Service Worker: ${error.message}`);
        }
      });
    }
    
    // Función para manejar los mensajes del Service Worker
    const handleServiceWorkerMessage = (event) => {
      addDebugMessage(`Mensaje recibido del Service Worker: ${event.data?.type}`);
      
      if (event.data && event.data.type === 'SHARED_FILE' && event.data.file) {
        addDebugMessage(`Archivo recibido del Service Worker: ${event.data.file.name}`);
        
        // Evitar procesamiento duplicado
        if (event.data.shareId && processedShareIds.current.has(event.data.shareId)) {
          addDebugMessage(`ShareID ${event.data.shareId} ya procesado, ignorando`);
          return;
        }
        
        if (event.data.shareId) {
          processedShareIds.current.add(event.data.shareId);
        }
        
        // Verificar primero si el usuario está logueado
        if (!user) {
          console.log('Usuario no logueado, guardando archivo y mostrando mensaje');
          saveSharedFile(event.data.file).then(() => {
            setError('Debes iniciar sesión para analizar conversaciones');
            // Redirigir a la página de login después de un breve retraso
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          });
          return;
        }
        
        // Primero guardar el archivo en IndexedDB
        saveSharedFile(event.data.file).then(() => {
          // Borrar datos del análisis anterior automáticamente
          localStorage.removeItem('whatsapp_analyzer_operation_id');
          localStorage.removeItem('whatsapp_analyzer_loading');
          localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
          localStorage.removeItem('whatsapp_analyzer_show_analysis');
          localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
          localStorage.removeItem('whatsapp_analyzer_analysis_complete');
          localStorage.removeItem('whatsapp_analyzer_mistral_error');
          localStorage.removeItem('whatsapp_analyzer_chat_data');
          localStorage.removeItem('whatsapp_analyzer_has_chat_data');
          
          // Limpiar estados
          setChatGptResponse("");
          setShowChatGptResponse(false);
          setOperationId(null);
          setChatData(null);
          
          // Iniciar procesamiento del nuevo archivo
          handleSharedFile(event.data.file);
        }).catch(error => {
          console.error('Error al guardar archivo en IndexedDB:', error);
          // Si falla el guardado en IndexedDB, intentar procesar directamente
          handleSharedFile(event.data.file);
        });
      } else if (event.data && event.data.type === 'SHARED_FILE_ERROR') {
        setError(`Error al recibir archivo: ${event.data.error || 'Error desconocido'}`);
        setIsProcessingSharedFile(false);
        isProcessingRef.current = false;
      } else if (event.data && event.data.type === 'PONG') {
        addDebugMessage('Service Worker está activo (respuesta PONG)');
      }
    };
    
    // Registrar el listener para mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Cargar datos persistentes al iniciar la aplicación
  useEffect(() => {
    // Intentar recuperar el operationId del localStorage
    const savedOperationId = localStorage.getItem('whatsapp_analyzer_operation_id');
    const savedIsLoading = localStorage.getItem('whatsapp_analyzer_loading') === 'true';
    const savedIsFetchingMistral = localStorage.getItem('whatsapp_analyzer_fetching_mistral') === 'true';
    const savedShowAnalysis = localStorage.getItem('whatsapp_analyzer_show_analysis') === 'true';
    const savedChatGptResponse = localStorage.getItem('whatsapp_analyzer_chatgpt_response');
    const savedAnalysisComplete = localStorage.getItem('whatsapp_analyzer_analysis_complete') === 'true';
    const hadMistralError = localStorage.getItem('whatsapp_analyzer_mistral_error') === 'true';
    const wasRefreshed = localStorage.getItem('whatsapp_analyzer_page_refreshed') === 'true';
    const savedChatData = localStorage.getItem('whatsapp_analyzer_chat_data');
    const hasChatData = localStorage.getItem('whatsapp_analyzer_has_chat_data') === 'true';
    
    // Si hay un operationId guardado, hacer scroll automático hacia arriba después de un refresh
    if (savedOperationId) {
      // Usar un pequeño retraso para asegurarse de que el componente se ha renderizado
      setTimeout(() => scrollToAnalysis(), 300);
    }
    
    // Si el análisis estaba completo y la página se recargó, mostrar alerta de confirmación
    if (savedAnalysisComplete && wasRefreshed) {
      // Quitar inmediatamente la marca de refrescado para evitar bucles
      localStorage.removeItem('whatsapp_analyzer_page_refreshed');
      
      // Mostrar confirmación antes de borrar
      setTimeout(() => {
        if (window.confirm("La página se ha recargado y hay un análisis previo guardado. Si continúas, se perderán todos los datos del análisis actual (tanto estadístico como psicológico). ¿Deseas continuar?")) {
          // Si confirma, limpiar todos los datos guardados
          localStorage.removeItem('whatsapp_analyzer_operation_id');
          localStorage.removeItem('whatsapp_analyzer_loading');
          localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
          localStorage.removeItem('whatsapp_analyzer_show_analysis');
          localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
          localStorage.removeItem('whatsapp_analyzer_analysis_complete');
          localStorage.removeItem('whatsapp_analyzer_mistral_error');
          localStorage.removeItem('whatsapp_analyzer_chat_data');
          localStorage.removeItem('whatsapp_analyzer_has_chat_data');
          
          // Recargar nuevamente para actualizar la interfaz
          window.location.reload();
        }
      }, 100);
    }
    
    // Verificar si hay archivos pendientes en IndexedDB al iniciar
    const checkPendingFiles = async () => {
      try {
        const pendingFile = await getSharedFile();
        if (pendingFile) {
          console.log('Archivo pendiente encontrado en IndexedDB al iniciar:', pendingFile.name);
          
          // Verificar primero si el usuario está logueado
          if (!user) {
            console.log('Usuario no logueado pero hay archivo pendiente, redirigiendo a login');
            setError('Debes iniciar sesión para analizar conversaciones');
            // Redirigir a la página de login después de un breve retraso
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            return;
          }
          
          // Limpiar cualquier análisis anterior
          localStorage.removeItem('whatsapp_analyzer_operation_id');
          localStorage.removeItem('whatsapp_analyzer_loading');
          localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
          localStorage.removeItem('whatsapp_analyzer_show_analysis');
          localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
          localStorage.removeItem('whatsapp_analyzer_analysis_complete');
          localStorage.removeItem('whatsapp_analyzer_mistral_error');
          localStorage.removeItem('whatsapp_analyzer_chat_data');
          localStorage.removeItem('whatsapp_analyzer_has_chat_data');
          
          // Limpiar estados
          setChatGptResponse("");
          setShowChatGptResponse(false);
          setOperationId(null);
          setChatData(null);
          
          // Procesar el archivo pendiente
          setZipFile(pendingFile);
          setIsProcessingSharedFile(true);
        }
      } catch (error) {
        console.error('Error al verificar archivos pendientes:', error);
      }
    };
    
    // Comprobar archivos pendientes al inicio
    checkPendingFiles();
    
    // Restaurar el estado desde localStorage
    if (savedOperationId) {
      setOperationId(savedOperationId);
      
      // Restaurar datos de análisis
      if (savedChatGptResponse) {
        setChatGptResponse(savedChatGptResponse);
        setShowChatGptResponse(true);
      }
      
      // Restaurar chatData si está disponible
      if (savedChatData && hasChatData) {
        setChatData(savedChatData);
      }
      
      // Restaurar otros estados
      setIsLoading(savedIsLoading);
      setIsFetchingMistral(savedIsFetchingMistral);
      setShowAnalysis(savedShowAnalysis || !!savedChatGptResponse);
      
      // Si hay un error registrado con Mistral, mostrar mensaje
      if (hadMistralError) {
        setError(t('app.errors.mistral'));
      }
      
      // Si estábamos en medio de la carga, continuar donde lo dejamos
      if (savedIsLoading || savedIsFetchingMistral) {
        // Intentar recuperar la operación si estaba en progreso
        const continuarAnalisis = setTimeout(() => {
          if (savedIsFetchingMistral) {
            console.log('Retomando la obtención de la respuesta de IA');
            setIsFetchingMistral(true);
            setTimeout(() => fetchMistralResponse(), 2000);
          }
        }, 1000);
      }
    }
    
    // Añadir un atajo para reinicio con CTRL+ALT+R (solo en desarrollo)
    const handleReset = (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'r') {
        e.preventDefault();
        console.log('Reinicio manual forzado');
        
        // Limpiar localStorage
        localStorage.removeItem('whatsapp_analyzer_operation_id');
        localStorage.removeItem('whatsapp_analyzer_loading');
        localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
        localStorage.removeItem('whatsapp_analyzer_show_analysis');
        localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
        localStorage.removeItem('whatsapp_analyzer_analysis_complete');
        localStorage.removeItem('whatsapp_analyzer_mistral_error');
        localStorage.removeItem('whatsapp_analyzer_force_fetch');
        localStorage.removeItem('whatsapp_analyzer_page_refreshed');
        
        // Recargar la página
        window.location.reload();
      }
    };
    
    // Solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleReset);
      return () => window.removeEventListener('keydown', handleReset);
    }
  }, []);

  // Función para continuar con la acción después de la confirmación
  const handleConfirmRefresh = () => {
    // Limpiar el localStorage antes de refrescar
    localStorage.removeItem('whatsapp_analyzer_operation_id');
    localStorage.removeItem('whatsapp_analyzer_loading');
    localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
    localStorage.removeItem('whatsapp_analyzer_show_analysis');
    localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
    localStorage.removeItem('whatsapp_analyzer_analysis_complete');
    localStorage.removeItem('whatsapp_analyzer_mistral_error');
    localStorage.removeItem('whatsapp_analyzer_page_refreshed');
    localStorage.removeItem('whatsapp_analyzer_chat_data');
    localStorage.removeItem('whatsapp_analyzer_has_chat_data');
    
    // Recargar la página
    window.location.reload();
  };
  
  // Función para cancelar la acción
  const handleCancelRefresh = () => {
    setShowRefreshConfirmation(false);
  };
  
  // Component to render when user needs to upgrade
  const UpgradeModal = () => (
    <div className="upgrade-modal">
      <div className="upgrade-modal-content">
        <h2>{t('app.upgrade_modal.title')}</h2>
        <p>{t('app.upgrade_modal.message')}</p>
        <p>{t('app.upgrade_modal.upgrade')}</p>
        <div className="upgrade-buttons">
          <button 
            className="view-plans-button"
            onClick={() => window.location.href = '/plans'}
          >
            {t('app.upgrade_modal.view_plans')}
          </button>
          <button 
            className="close-button"
            onClick={() => setShowUpgradeModal(false)}
          >
            {t('app.upgrade_modal.close')}
          </button>
        </div>
      </div>
    </div>
  );

  // Actualizar visibilidad del botón de Ver Análisis basado en la posición de scroll
  useEffect(() => {
    if (!operationId) return;
    
    const checkScrollPosition = () => {
      if (analysisRef.current) {
        const rect = analysisRef.current.getBoundingClientRect();
        // Si la sección de análisis está fuera de la vista (por debajo de la ventana),
        // mostrar el botón flotante
        if (rect.top > window.innerHeight) {
          setShowViewAnalysisButton(true);
        } else {
          setShowViewAnalysisButton(false);
        }
      }
    };
    
    window.addEventListener('scroll', checkScrollPosition);
    // Comprobar inicialmente
    checkScrollPosition();
    
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
    };
  }, [operationId]);

  // Añadir un efecto para manejar cuando el usuario vuelve a la aplicación después de cambiar de pestaña
  useEffect(() => {
    // No hacer nada si no hay análisis
    if (!operationId) return;
    
    // Función para manejar cuando el usuario vuelve a la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && operationId) {
        // Si el usuario vuelve a la página y hay un análisis, hacer scroll
        setTimeout(() => scrollToAnalysis(), 300);
      }
    };
    
    // Añadir listener para cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar listener al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [operationId]);

  // Guardar datos críticos en localStorage cuando cambien
  useEffect(() => {
    if (operationId) {
      localStorage.setItem('whatsapp_analyzer_operation_id', operationId);
    }
    
    localStorage.setItem('whatsapp_analyzer_loading', isLoading.toString());
    localStorage.setItem('whatsapp_analyzer_fetching_mistral', isFetchingMistral.toString());
    localStorage.setItem('whatsapp_analyzer_show_analysis', showAnalysis.toString());
    
    if (chatGptResponse) {
      localStorage.setItem('whatsapp_analyzer_chatgpt_response', chatGptResponse);
      // Marcar que el análisis está completo cuando tengamos respuesta
      localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
    }
    
    // Guardar chatData en localStorage para persistir entre refrescos
    if (chatData) {
      try {
        localStorage.setItem('whatsapp_analyzer_chat_data', chatData);
        // Marcar que tenemos datos de análisis
        localStorage.setItem('whatsapp_analyzer_has_chat_data', 'true');
      } catch (error) {
        console.error("Error al guardar chatData en localStorage:", error);
        // El chatData puede ser muy grande, intentar comprimir o limitar si es necesario
      }
    }
  }, [operationId, isLoading, isFetchingMistral, showAnalysis, chatGptResponse, chatData]);

  // Modificar el efecto de beforeunload para mostrar advertencia cuando el análisis esté completo
  useEffect(() => {
    const isAnalysisComplete = chatGptResponse && operationId && !isLoading && !isFetchingMistral;
    const hasAnalysisData = chatData || chatGptResponse;
    
    // Si el análisis está completo o hay datos de análisis, registrar este estado
    if (isAnalysisComplete || hasAnalysisData) {
      localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
    }
    
    // Función para advertir al usuario antes de refrescar o cerrar la página cuando hay datos de análisis
    const handleBeforeUnload = (e) => {
      if (isAnalysisComplete || hasAnalysisData) {
        // Marcar que el usuario está refrescando la página con análisis
        localStorage.setItem('whatsapp_analyzer_page_refreshed', 'true');
        
        // Mensaje que se mostrará
        const message = "¿Estás seguro que quieres salir? Se perderán todos los datos del análisis estadístico y psicológico.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    // Marcar siempre refrescado en pagetransition o unload
    const handlePageHide = () => {
      if (isAnalysisComplete || hasAnalysisData) {
        localStorage.setItem('whatsapp_analyzer_page_refreshed', 'true');
      }
    };
    
    // Monitorear clicks en enlaces y botones que puedan causar navegación
    const handleLinkClick = (e) => {
      if ((isAnalysisComplete || hasAnalysisData) && e.target.tagName === 'A' && !e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        setShowRefreshConfirmation(true);
        return false;
      }
    };
    
    // Monitorear clicks en elementos que puedan causar recarga
    const handleNavClick = (e) => {
      // Detectar clics en la esquina superior derecha (donde suele estar el botón de recarga)
      if ((isAnalysisComplete || hasAnalysisData) && e.clientY < 50 && e.clientX > window.innerWidth - 100) {
        setShowRefreshConfirmation(true);
      }
    };

    // Activar las advertencias solo cuando hay datos de análisis
    if (isAnalysisComplete || hasAnalysisData) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('unload', handlePageHide);
      document.addEventListener('click', handleLinkClick, true);
      document.addEventListener('mousedown', handleNavClick, true);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handlePageHide);
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('mousedown', handleNavClick, true);
    };
  }, [chatGptResponse, operationId, isLoading, isFetchingMistral, chatData]);

  // Main app component UI with routing
  return (
    <div className="app-container">
      <Router>
        <div className="App">
          <Header user={user} />
          <UserPlanBanner userProfile={userProfile} />
          
          {/* Indicador de progreso flotante para todos los dispositivos */}
          {(isLoading || isFetchingMistral) && (
            <div className="mobile-progress-indicator">
              <div className="progress-content">
                <div className="spinner-small"></div>
                <span>{progressMessage || (isLoading ? t('app.progress.processing') : t('app.progress.generating'))}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-value"></div>
              </div>
            </div>
          )}
          
          {/* Botón flotante para ver análisis */}
          {operationId && showViewAnalysisButton && !(isLoading || isFetchingMistral) && (
            <button 
              className="view-analysis-button"
              onClick={scrollToAnalysis}
            >
              <span className="icon">📊</span>
              {t('app.buttons.view_analysis')}
            </button>
          )}
          
          <main className="App-main">
            {showPaymentSuccess && (
              <PaymentSuccessBanner 
                show={showPaymentSuccess} 
                onClose={() => setShowPaymentSuccess(false)}
              />
            )}
            {showUpgradeModal && <UpgradeModal />}
            
            <Routes>
              {/* Home/Upload Page */}
              <Route 
                path="/"
                element={
                  <>
                    {/* Mostrar componentes de análisis estadístico */}
                    {operationId && (
                      <div className="analysis-container" ref={analysisRef}>
                        <h2>{t('app.analysis.statistical')}</h2>
                        
                        {/* Reemplazar el spinner individual con un contenedor simple */}
                        {isLoading ? (
                          <div className="empty-placeholder-container">
                            <p>{t('app.analysis.preparing_statistical')}</p>
                          </div>
                        ) : (
                          <>
                            <div className="analysis-module">
                              <AnalisisPrimerChat chatData={chatData} />
                            </div>
                            {/* Nuevos componentes de análisis */}
                            <div className="additional-analysis">
                              <div className="analysis-module">
                                <AnalisisTop chatData={chatData} />
                              </div>
                              {/* <div className="analysis-module">
                                <ChatAnalysisComponent chatData={chatData} />
                              </div> */}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Mostrar componentes de análisis psicológico */}
                    {operationId && (
                      <div className="chat-analysis-section">
                        <h2>{t('app.analysis.psychological')}</h2>
                        
                        {isFetchingMistral ? (
                          <div className="empty-placeholder-container">
                            <p>{t('app.analysis.preparing_psychological')}</p>
                          </div>
                        ) : (
                          chatGptResponse ? <Chatgptresultados chatGptResponse={chatGptResponse} /> :
                          // Si no hay respuesta y no está cargando, mostrar botón para reintentar
                          <div className="retry-analysis-container">
                            <p>No se ha podido completar el análisis psicológico.</p>
                            <button 
                              className="retry-analysis-button"
                              onClick={() => {
                                console.log("Forzando análisis psicológico");
                                localStorage.setItem('whatsapp_analyzer_force_fetch', 'true');
                                fetchMistralResponse();
                              }}
                            >
                              Reintentar análisis psicológico
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección de carga de archivos */}
                    <div id="upload-section" className="upload-section">
                      {!user ? (
                        <>
                          {/* Componente de vista previa de la aplicación ANTES del login */}
                          <AppPreview />
                          
                          <div className="login-required">
                            <h2>{t('app.login_required.title')}</h2>
                            <p>{t('app.login_required.description')}</p>
                            <div className="auth-buttons">
                              <button 
                                className="login-button"
                                onClick={() => window.location.href = '/login'}
                              >
                                {t('app.login_required.login')}
                              </button>
                              <button 
                                className="register-button"
                                onClick={() => window.location.href = '/register'}
                              >
                                {t('app.login_required.register')}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <h2>{showAnalysis ? t('app.upload.another') : t('app.upload.title') + " "}<span className="whatsapp-text">WhatsApp</span></h2>
                          
                          {/* Carrusel de instrucciones de WhatsApp separado del botón */}
                          <WhatsappInstructions />
                          
                          {/* User subscription status card */}
                          
                          <div className="file-upload-container">
                            <label className="file-upload-label">
                              <input 
                                type="file" 
                                className="file-upload-input" 
                                accept=".zip,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream,*/*" 
                                onChange={handleFileUpload} 
                              />
                              <div className="file-upload-text">
                                <span className="upload-icon">📂</span>
                                <span>{t('app.upload.button')}</span>
                                <span className="file-upload-subtext">{t('app.upload.subtext')}</span>
                              </div>
                            </label>
                          </div>
                        </>
                      )}
                    </div>

                    {error && (
                      <div className="error-message">
                        <p>{error}</p>
                      </div>
                    )}

                    {isLoading && (
                      <div className="loading-indicator-minimal">
                        <div className="spinner"></div>
                      </div>
                    )}
                  </>
                }
              />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<PasswordReset />} />
              
              {/* Subscription Plan Routes - Now correctly passing user prop */}
              <Route path="/plans" element={
                <ProtectedRoute>
                  <PlansWithLocationCheck user={user} />
                </ProtectedRoute>
              } />

              <Route path="/payment-success" element={
                <ProtectedRoute>
                  <SimplePaymentSuccess />
                </ProtectedRoute>
              } />

            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<TermsOfService />} />
            < Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
            
            {/* Componente de footer */}
            <Footer/>
            {/* Componente de instalación de PWA */}
            <InstallPWA />
            
            
            {/* Optional: Add AuthDebug component for debugging */}
            {process.env.NODE_ENV === 'development' && <AuthDebug />}

            {/* Reemplazar la advertencia de no refrescar con un indicador de carga más sutil */}
            {(isLoading || isFetchingMistral) && (
              <div className="loading-status-indicator">
                <div className="spinner-small"></div>
                <div className="loading-status-text">
                  {t('app.loading_status')}
                </div>
              </div>
            )}
            
            {/* Alerta de confirmación cuando el usuario intenta salir con análisis completo */}
            {showRefreshConfirmation && (
              <div className="refresh-confirmation">
                <div className="refresh-confirmation-icon">⚠️</div>
                <div className="refresh-confirmation-content">
                  <h3>¿Estás seguro?</h3>
                  <p>Si continúas, se perderán todos los datos del análisis actual (tanto estadístico como psicológico). ¿Deseas continuar?</p>
                  <div className="refresh-confirmation-buttons">
                    <button 
                      className="refresh-confirmation-cancel" 
                      onClick={handleCancelRefresh}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="refresh-confirmation-confirm" 
                      onClick={handleConfirmRefresh}
                    >
                      Sí, continuar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </Router>
    </div>
  );
} 

export default App;