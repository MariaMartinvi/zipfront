import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import InstallPWA from './InstallPWA';
import Chatgptresultados from './Chatgptresultados';
import WhatsappInstructions from './WhatsappInstructions';
import AnalisisPrimerChat from './Analisis_primer_chat';
import AnalisisTop from './Analisis_top';
import { AuthContainer, Login, Register, PasswordReset } from './AuthComponents';
import SubscriptionPlans from './SubscriptionPlans';
import { getCurrentUser, getUserProfile, incrementChatUsage, canUploadChat } from './firebase_auth';
import Header from './Header';
import Footer from './Footer';
import UserPlanBanner from './UserPlanBanner';
import GameBanner from './GameBanner';
import SimplePaymentSuccess from './SimplePaymentSuccess';
import PaymentSuccessBanner from './PaymentSuccessBanner';
import CookieBanner from './CookieBanner';
import { useAuth } from './AuthContext';
import { deleteFiles, uploadFile, getMistralResponse, startChatAnalysis, getAzureResponse } from './fileService';
import Contact from './Paginasextra/Contact';
import FAQ from './Paginasextra/FAQ';
import TermsOfService from './Paginasextra/TermsOfService';
import PrivacyPolicy from './Paginasextra/PrivacyPolicy';
import PoliticaCookies from './Paginasextra/PoliticaCookies';
import AppPreview from './AppPreview';
import { useTranslation } from 'react-i18next'; // Importar useTranslation
// NUEVO: Importar el componente del juego
import ChatTopGame from './ChatTopGame';
import ChatHeadlinesGame from './ChatHeadlinesGame';
import Juegos from './Juegos'; // NUEVO: Componente independiente para juegos
import { userSession } from './utils/userSession';
import DebugLogger from './DebugLogger'; // Añadir import del DebugLogger
import HeroSection from './components/HeroSection';

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
    let totalUrlsAnonimizadas = 0;
    
    // Función para anonimizar números manteniendo consistencia
    const anonimizarNumero = (numeroStr) => {
      // Limpiar el número para mantener consistencia en reemplazos
      const numeroLimpio = numeroStr.replace(/[\s.-]/g, '');
      
      // Si ya anonimizamos este número antes, usamos el mismo reemplazo
      if (reemplazosNumeros[numeroLimpio]) {
        return reemplazosNumeros[numeroLimpio];
      }
      
      // Determinar cuántos dígitos mantener (aproximadamente la mitad)
      const numDigitos = numeroLimpio.length;
      const digitosAMantener = Math.max(2, Math.floor(numDigitos / 2)); // Al menos 2 dígitos
      
      // Construir el resultado: primeros dígitos + X's
      const resultado = numeroLimpio.substring(0, digitosAMantener) + 'X'.repeat(numDigitos - digitosAMantener);
      
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

    // Función para anonimizar URLs manteniendo solo el protocolo
    const detectarYAnonimizarUrls = (texto) => {
      // Patrón para detectar URLs completas
      const patronUrl = /(https?:\/\/[^\s]+)/gi;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronUrl);
      
      if (matches) {
        for (const url of matches) {
          // Extraer solo el protocolo (http:// o https://)
          const protocoloMatch = url.match(/^(https?:\/\/)/i);
          if (protocoloMatch) {
            const protocolo = protocoloMatch[1].toLowerCase();
            // Reemplazar toda la URL con solo el protocolo
            textoAnonimizado = textoAnonimizado.replace(url, protocolo);
            totalUrlsAnonimizadas++;
          }
        }
      }
      
      return textoAnonimizado;
    };
    
    // Detectar y anonimizar números de teléfono y similares
    const detectarYAnonimizarNumeros = (texto) => {
      // Patrones para detectar fechas completas (Android e iOS)
      const patronesFechas = [
        // Formatos de fecha estándar
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,     // DD/MM/YYYY o MM/DD/YYYY (ej: 17/12/23)
        /\d{1,2}-\d{1,2}-\d{2,4}/g,       // DD-MM-YYYY o MM-DD-YYYY  
        /\d{2,4}\/\d{1,2}\/\d{1,2}/g,     // YYYY/MM/DD
        /\d{2,4}-\d{1,2}-\d{1,2}/g,       // YYYY-MM-DD
        
        // Formatos de hora
        /\d{1,2}:\d{1,2}:\d{1,2}/g,       // HH:MM:SS (horas) (ej: 14:26:19)
        /\d{1,2}:\d{1,2}/g,               // HH:MM (horas)
        
        // Formatos específicos de WhatsApp con corchetes
        /\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}\]/g,  // [DD/MM/YY, HH:MM:SS]
        /\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}\]/g,          // [DD/MM/YY, HH:MM]
        /\[\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}\]/g,    // [DD-MM-YY, HH:MM:SS]
        /\[\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}\]/g,            // [DD-MM-YY, HH:MM]
        
        // Timestamps completos de WhatsApp (sin corchetes para detectar partes)
        /\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}/g,      // DD/MM/YY, HH:MM:SS
        /\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{1,2}/g,              // DD/MM/YY, HH:MM
        /\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}:\d{1,2}/g,        // DD-MM-YY, HH:MM:SS
        /\d{1,2}-\d{1,2}-\d{2,4},\s*\d{1,2}:\d{1,2}/g                 // DD-MM-YY, HH:MM
      ];
      
      // Crear un conjunto de todas las fechas encontradas para protegerlas
      const fechasProtegidas = new Set();
      
      // Encontrar todas las fechas en el texto y marcarlas como protegidas
      patronesFechas.forEach(patron => {
        const matches = texto.match(patron);
        if (matches) {
          matches.forEach(fecha => fechasProtegidas.add(fecha));
        }
      });
      
      // Patrón para encontrar cualquier número (con o sin separadores)
      const patronNumeros = /\d+(?:[\s.-]\d+)*/g;
      
      let textoAnonimizado = texto;
      const matches = textoAnonimizado.match(patronNumeros);
      
      if (matches) {
        for (const match of matches) {
          // Verificar si este número es parte de una fecha protegida
          let esParteDeFecha = false;
          for (const fecha of fechasProtegidas) {
            if (fecha.includes(match)) {
              esParteDeFecha = true;
              break;
            }
          }
          
          // Saltar si es parte de una fecha
          if (esParteDeFecha) {
            continue;
          }
          
          // Limpiar el número (quitar espacios, puntos, guiones)
          const numeroLimpio = match.replace(/[^0-9]/g, '');
          const numDigitos = numeroLimpio.length;
          
          // Determinar cuántos dígitos mantener
          let digitosAMantener;
          if (numDigitos === 1) {
            digitosAMantener = 0; // Se reemplazará todo con X
          } else if (numDigitos === 2) {
            digitosAMantener = 1; // Mantener 1 dígito
          } else if (numDigitos === 3) {
            digitosAMantener = 1; // Mantener 1 dígito
          } else {
            digitosAMantener = Math.ceil(numDigitos / 2); // Mitad de dígitos
          }
          
          // Construir el resultado
          const resultado = numeroLimpio.substring(0, digitosAMantener) + 'X'.repeat(numDigitos - digitosAMantener);
          
          // Reemplazar en el texto original
          textoAnonimizado = textoAnonimizado.replace(match, resultado);
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
      
      // Luego anonimizar URLs
      linea = detectarYAnonimizarUrls(linea);
      
      // Finalmente anonimizar números
      linea = detectarYAnonimizarNumeros(linea);
      
      lineasAnonimizadas.push(linea);
    }
    
    // Unir las líneas en un solo texto
    const contenidoAnonimizado = lineasAnonimizadas.join('\n');
    
    // Registrar las estadísticas de anonimización
    const totalEmails = Object.keys(reemplazosEmails).length;
    const totalNumeros = Object.keys(reemplazosNumeros).length;
    console.log(`Anonimización completada: ${totalEmails} emails, ${totalUrlsAnonimizadas} URLs y ${totalNumeros} números anonimizados`);
    
    return contenidoAnonimizado;
  } catch (error) {
    console.error("Error al anonimizar el chat:", error);
    return contenido; // En caso de error, devolver el contenido original
  }
};

// Componente interno que usa useLocation
function AppContent() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [operationId, setOperationId] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  // Nuevo estado para almacenar el archivo ZIP pendiente de procesar
  const [pendingZipFile, setPendingZipFile] = useState(null);
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
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState('');
  // Referencias para secciones de análisis - usadas para scroll automático
  const analysisRef = useRef(null);
  // Get user-related state from AuthContext instead of managing locally
  const { user, userProfile, setUserProfile, isAuthLoading, setUser } = useAuth();
  
  // Estados para juegos
  const [showShareGameModal, setShowShareGameModal] = useState(false);
  // State para la URL del juego
  const [gameUrl, setGameUrl] = useState("");
  // State para mostrar el mensaje de "copiado"
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Configuración de privacidad
  const [skipAIPsychologicalAnalysis, setSkipAIPsychologicalAnalysis] = useState(false);
  
  // NUEVO: Estado para datos del juego de titulares
  const [headlinesGameData, setHeadlinesGameData] = useState(null);
  
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

  // Check if user can upload a chat based on their subscription plan - NO CACHE, always fresh validation
  const checkUploadEligibility = async () => {
    console.log("[checkUploadEligibility] ===== INICIANDO VALIDACIÓN DE ELEGIBILIDAD =====");
    console.log("[checkUploadEligibility] Verificando elegibilidad para cargar - Estado actual del usuario:", user);
    
    if (!user) {
      // Intentar recuperar el usuario una vez más desde Firebase
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log("[checkUploadEligibility] Usuario recuperado correctamente desde Firebase:", currentUser);
          window.recoveredUser = currentUser; // Guardar para uso posterior

          if (setUser) setUser(currentUser); // Usar condicional para evitar errores

          // NO actualizar el estado local del perfil - dejar que canUploadChat haga consulta fresca
          
          // Verificar si el usuario puede cargar (consulta fresca garantizada)
          try {
            console.log("[checkUploadEligibility] Haciendo consulta FRESCA para usuario recuperado:", currentUser.uid);
            const uploadResult = await canUploadChat(currentUser.uid);
            // Manejar tanto el formato boolean (legacy) como el nuevo formato de objeto
            const canUpload = typeof uploadResult === 'boolean' ? uploadResult : uploadResult.canUpload;
            if (!canUpload) {
              console.log("[checkUploadEligibility] Usuario no puede subir - mostrando modal de upgrade");
              setShowUpgradeModal(true);
              return false;
            }
            console.log("[checkUploadEligibility] Usuario PUEDE subir");
            return true;
          } catch (planError) {
            console.error("[checkUploadEligibility] Error verificando plan:", planError);
            setError("Error verificando tu plan. Por favor, recarga la página.");
            return false;
          }
        } else {
          // No hay usuario autenticado
          console.log("[checkUploadEligibility] No hay usuario autenticado");
          setError('Debes iniciar sesión para analizar conversaciones.');
          // Redirigir a la página de login después de un breve retraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return false;
        }
      } catch (error) {
        console.error("[checkUploadEligibility] Error verificando autenticación:", error);
        setError('Error al verificar tu sesión. Por favor, inicia sesión nuevamente.');
        return false;
      }
    }
    
    // Ya hay un usuario en el contexto, verificar plan con consulta fresca
    try {
      console.log("[checkUploadEligibility] Haciendo consulta FRESCA para usuario actual:", user.uid);
      const uploadResult = await canUploadChat(user.uid);
      // Manejar tanto el formato boolean (legacy) como el nuevo formato de objeto
      const canUpload = typeof uploadResult === 'boolean' ? uploadResult : uploadResult.canUpload;
      
      if (!canUpload) {
        console.log("[checkUploadEligibility] Usuario no puede subir - mostrando modal de upgrade");
        setShowUpgradeModal(true);
        return false;
      }
      
      console.log("[checkUploadEligibility] Usuario PUEDE subir");
      return true;
    } catch (error) {
      console.error('[checkUploadEligibility] Error verificando plan de usuario:', error);
      setError('Error al verificar tu plan. Por favor, inténtalo de nuevo.');
      return false;
    }
  };

  // Función para procesar el archivo ZIP una vez validado y autorizado
  const processZipFile = async (file) => {
    // CRÍTICO: Verificación de seguridad - NO permitir análisis sin autenticación
    // MODIFICADO: Usar getCurrentUser() directamente para evitar race conditions
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error('[SEGURIDAD] Error verificando autenticación:', authError);
      setError('Error de autenticación. Por favor, inicia sesión nuevamente.');
      setIsLoading(false);
      return false;
    }
    
    if (!currentUser) {
      console.error('[SEGURIDAD] Intento de análisis sin usuario autenticado - BLOQUEADO');
      setError('Error de seguridad: Debes estar autenticado para analizar chats.');
      setIsLoading(false);
      return false;
    }
    
    console.log('[SEGURIDAD] Usuario verificado para análisis:', currentUser.uid);
    
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
      
      // CRÍTICO: Limpiar el análisis psicológico del chat anterior
      setChatGptResponse("");
      setShowChatGptResponse(false);
      setIsFetchingMistral(false);
      setShowAnalysis(false);
      
      // CRÍTICO: Limpiar también el localStorage del análisis psicológico
      localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
      localStorage.removeItem('whatsapp_analyzer_analysis_complete');
      localStorage.removeItem('whatsapp_analyzer_mistral_error');
      localStorage.removeItem('whatsapp_analyzer_force_fetch');
      localStorage.removeItem('whatsapp_analyzer_chat_data');
      localStorage.removeItem('whatsapp_analyzer_has_chat_data');
      
      // CRÍTICO: Limpiar también las variables globales de Azure
      window.lastAzureResponse = null;
      window.lastNameMapping = null;
      
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
          setChatData(extractedContent.chat);
          
          // Mostrar inmediatamente la sección de análisis estadístico sin esperar al análisis psicológico
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
          
          // Iniciar el análisis psicológico en background sin bloquear la UI
          // Pasar el contenido del chat directamente para evitar problemas de timing
          fetchMistralResponse(extractedContent.chat);
          
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
    
    // NUEVO: Limpieza selectiva del localStorage al inicio para evitar problemas
    // (igual que en handleSharedFile para unificar comportamiento)
    try {
      addDebugMessage('Limpieza selectiva del localStorage para carga manual de archivos');
      
      // Lista de claves que queremos eliminar (no incluye chat_data)
      const keysToRemove = [
        'whatsapp_analyzer_operation_id',
        'whatsapp_analyzer_loading',
        'whatsapp_analyzer_fetching_mistral',
        'whatsapp_analyzer_show_analysis',
        'whatsapp_analyzer_chatgpt_response',
        'whatsapp_analyzer_analysis_complete',
        'whatsapp_analyzer_mistral_error',
        'whatsapp_analyzer_page_refreshed',
        'whatsapp_analyzer_is_processing_shared', // NUEVO: Asegurar que no hay conflicto con archivo compartido
        'whatsapp_analyzer_force_fetch',
        'whatsapp_analyzer_chat_data',
        'whatsapp_analyzer_has_chat_data'
      ];
      
      // Eliminar solo las claves específicas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        addDebugMessage(`Eliminada clave de localStorage: ${key}`);
      });
      
      addDebugMessage('Limpieza selectiva de localStorage completada (manteniendo datos del chat)');
    } catch (err) {
      addDebugMessage(`Error al limpiar localStorage: ${err.message}`);
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
      setError(t('app.errors.zip_file'));
      return;
    }
    
    // Analizar y corregir el archivo si es necesario
    const analyzedFile = analyzeFile(file);
    
    // CRÍTICO: Validar SIEMPRE antes de cualquier early return
    const isEligible = await checkUploadEligibility();
    if (!isEligible) {
      return;
    }
    
    // Si ya hay un análisis en curso, guardar el nuevo archivo y mostrar confirmación
    if (operationId && (chatData || chatGptResponse)) {
      // Guardar el archivo pendiente para procesarlo después de la confirmación
      setPendingZipFile(analyzedFile);
      // Mostrar el diálogo de confirmación
      setShowRefreshConfirmation(true);
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
              
              // NO actualizar estado local - las próximas consultas serán frescas desde Firebase
              addDebugMessage(`Contador incrementado exitosamente para ${user.uid}. La próxima validación consultará datos frescos desde Firebase.`);
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
    
    // NUEVO: Establecer explícitamente el flag de procesamiento compartido al inicio
    localStorage.setItem('whatsapp_analyzer_is_processing_shared', 'true');
    addDebugMessage('Flag de procesamiento de archivos compartidos establecido (whatsapp_analyzer_is_processing_shared)');
    
    // MODIFICADO: Limpieza COMPLETA del localStorage al inicio para evitar problemas
    // Esto asegura que no haya datos previos que puedan causar comportamiento inconsistente
    try {
      addDebugMessage('Limpieza completa del localStorage para archivos de WhatsApp');
      
      // Lista ampliada de claves que queremos eliminar (incluyendo todas las relacionadas con análisis previos)
      const keysToRemove = [
        'whatsapp_analyzer_operation_id',
        'whatsapp_analyzer_loading',
        'whatsapp_analyzer_fetching_mistral',
        'whatsapp_analyzer_show_analysis',
        'whatsapp_analyzer_chatgpt_response',
        'whatsapp_analyzer_analysis_complete',
        'whatsapp_analyzer_mistral_error',
        'whatsapp_analyzer_page_refreshed',
        'whatsapp_analyzer_chat_data',
        'whatsapp_analyzer_has_chat_data',
        'whatsapp_analyzer_force_fetch'
      ];
      
      // Eliminar todas las claves específicas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        addDebugMessage(`Eliminada clave de localStorage: ${key}`);
      });
      
      // NUEVO: Guardar el flag isProcessingShared en localStorage para que persista tras refrescos
      localStorage.setItem('whatsapp_analyzer_is_processing_shared', 'true');
      addDebugMessage('Flag isProcessingShared guardado en localStorage para persistencia');
      
      addDebugMessage('Limpieza completa de localStorage completada');
    } catch (err) {
      addDebugMessage(`Error al limpiar localStorage: ${err.message}`);
    }
    
    if (!file) {
      setError('No se pudo recibir el archivo');
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      // Asegurar que el flag en localStorage también se elimine
      localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
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
      // Asegurar que el flag en localStorage también se elimine
      localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
      return;
    }
    
    // Analizar y posiblemente corregir el archivo antes de procesarlo
    addDebugMessage('Analizando y corrigiendo tipo MIME del archivo');
    const analyzedFile = analyzeFile(file);
    
    // Limpiar el estado anterior para un nuevo análisis
    addDebugMessage('Limpiando estado para nuevo análisis (WhatsApp)');
    // Limpiar cualquier análisis anterior
    setOperationId(null);
    setChatGptResponse("");
    setShowChatGptResponse(false);
    setChatData(null);
    setShowAnalysis(false);

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
      
      // NUEVO: Limpiar el flag de procesamiento de archivo compartido una vez completado con éxito
      localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
      addDebugMessage('Procesamiento exitoso - eliminado flag isProcessingShared del localStorage');
      
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
              
              // NO actualizar estado local - las próximas consultas serán frescas desde Firebase
              addDebugMessage(`Contador incrementado exitosamente para ${user.uid} (WhatsApp Share). La próxima validación consultará datos frescos desde Firebase.`);
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
      
      // NUEVO: Limpiar el flag isProcessingShared en caso de error
      localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
      addDebugMessage('Error en procesamiento - eliminado flag isProcessingShared del localStorage');
      
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
              // NO actualizar estado local - las próximas consultas serán frescas desde Firebase
              addDebugMessage("Contador de uso incrementado correctamente (archivo original). Próximas validaciones serán frescas desde Firebase.");
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
      // Asegurar que se resetean los flags de procesamiento
      setIsLoading(false);
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      
      // NUEVO: Asegurar que el flag en localStorage se elimina al finalizar (exitoso o fallido)
      // Solo si no fue exitoso (si fue exitoso ya se eliminó antes)
      if (!processingSuccess) {
        localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
        addDebugMessage('Finalizado procesamiento sin éxito - eliminado flag isProcessingShared del localStorage');
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
    // CRÍTICO: Verificación de seguridad antes de mostrar análisis
    if (!user) {
      console.error('[SEGURIDAD] Intento de mostrar análisis sin usuario autenticado - BLOQUEADO');
      setError('Error de seguridad: Debes estar autenticado para ver análisis.');
      return;
    }

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
  const fetchMistralResponse = async (chatContent = null) => {
    // CRÍTICO: Verificación de seguridad antes de cualquier análisis psicológico
    // MODIFICADO: Usar getCurrentUser() directamente para evitar race conditions
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error('[SEGURIDAD] Error verificando autenticación para análisis psicológico:', authError);
      setError('Error de autenticación para análisis psicológico. Por favor, inicia sesión nuevamente.');
      setIsFetchingMistral(false);
      return false;
    }
    
    if (!currentUser) {
      console.error('[SEGURIDAD] Intento de análisis psicológico sin usuario autenticado - BLOQUEADO');
      setError('Error de seguridad: Debes estar autenticado para realizar análisis psicológico.');
      setIsFetchingMistral(false);
      return false;
    }
    
    console.log('[SEGURIDAD] Usuario verificado para análisis psicológico:', currentUser.uid);
    
    // Esperar a que la autenticación se complete antes de proceder
    try {
      console.log("Esperando a que la autenticación se complete...");
      await userSession.waitForAuth();
      console.log("Autenticación completada, procediendo con el análisis");
    } catch (error) {
      console.error("Error esperando autenticación:", error);
      setError('Error de autenticación. Por favor, recarga la página e inicia sesión nuevamente.');
      return false;
    }

    // Usar el contenido pasado como parámetro o el del estado como fallback
    const contentToAnalyze = chatContent || chatData;
    
    // Verificar que tenemos datos del chat para analizar
    if (!contentToAnalyze) {
      addDebugMessage('No hay datos de chat disponibles para analizar');
      setError('No hay datos de chat disponibles para analizar');
      return;
    }
    
    // Mostrar inmediatamente los datos de análisis estadístico
    // Esto permite que se muestren mientras se espera el análisis psicológico
    setShowAnalysis(true);
    
    // Si el usuario optó por no compartir datos con la IA, no realizar el análisis psicológico
    if (skipAIPsychologicalAnalysis) {
      addDebugMessage('El usuario ha elegido no compartir datos con la IA para análisis psicológico');
      setIsFetchingMistral(false);
      setChatGptResponse("El usuario ha elegido no compartir datos con la IA para el análisis psicológico. Para obtener el perfil psicológico, vuelve a subir el archivo y desmarca la opción correspondiente.");
      setShowChatGptResponse(true);
      return;
    }
    
    // Evitar múltiples solicitudes simultáneas
    if (isFetchingMistral && !localStorage.getItem('whatsapp_analyzer_force_fetch')) {
      console.log('Ya hay una solicitud en curso para obtener la respuesta de Mistral');
      return;
    }
    
    // Limpiar el flag de forzar fetch si existe
    localStorage.removeItem('whatsapp_analyzer_force_fetch');
    
    setIsFetchingMistral(true);
    setProgressMessage(t('app.generating_ai_analysis'));
    
    // Iniciar actualización progresiva de mensajes
    setAiAnalysisProgress(t('app.progress_phases.initializing'));
    
    // Configurar actualizaciones de progreso
    const progressUpdates = [
      { message: t('app.progress_phases.analyzing_patterns'), delay: 3000 },
      { message: t('app.progress_phases.identifying_traits'), delay: 7000 },
      { message: t('app.progress_phases.evaluating_dynamics'), delay: 12000 },
      { message: t('app.progress_phases.preparing_results'), delay: 18000 },
      { message: t('app.progress_phases.finalizing'), delay: 24000 }
    ];
    
    // Programar actualizaciones de progreso
    progressUpdates.forEach(update => {
      setTimeout(() => {
        if (isFetchingMistral) { // Solo actualizar si aún estamos cargando
          setAiAnalysisProgress(update.message);
        }
      }, update.delay);
    });
    
    try {
      addDebugMessage('Analizando chat directamente con Azure OpenAI desde el frontend');
      
      // Actualizar mensaje de progreso
      setProgressMessage(`${t('app.generating_analysis')}: ${t('app.progress_phases.processing_data')}`);
      
      // Obtener el idioma del usuario (predeterminado a 'es')
      const userLanguage = localStorage.getItem('i18nextLng') || 'es';
      
      // Enviar solicitud directamente a Azure OpenAI usando el método actualizado
      // Usar contentToAnalyze en lugar de chatData
      const result = await getMistralResponse(contentToAnalyze, userLanguage);
      
      if (result.success && result.ready && result.response) {
        addDebugMessage('Respuesta de Azure recibida con éxito');
        setChatGptResponse(result.response);
        setShowChatGptResponse(true);
        
        // NUEVO: Extraer datos del juego de titulares de la respuesta
        try {
          const azureResponse = window.lastAzureResponse;
          if (azureResponse) {
            const gameDataMatch = azureResponse.match(/GAME_DATA:/);
            if (gameDataMatch) {
              // Buscar la posición inicial del array
              const startIndex = azureResponse.indexOf('GAME_DATA:[');
              if (startIndex !== -1) {
                // Extraer desde '[' hasta encontrar el ']' que cierra el array principal
                let arrayStart = azureResponse.indexOf('[', startIndex);
                let bracketCount = 0;
                let endIndex = arrayStart;
                
                for (let i = arrayStart; i < azureResponse.length; i++) {
                  if (azureResponse[i] === '[') {
                    bracketCount++;
                  } else if (azureResponse[i] === ']') {
                    bracketCount--;
                    if (bracketCount === 0) {
                      endIndex = i;
                      break;
                    }
                  }
                }
                
                // Extraer el JSON completo
                let jsonStr = azureResponse.substring(arrayStart, endIndex + 1);
                const parsedData = JSON.parse(jsonStr);
                
                if (parsedData && Array.isArray(parsedData) && parsedData.length >= 2) {
                  let [usuarios, headlines] = parsedData;
                  
                  // Convertir iniciales a nombres completos si hay nameMapping disponible
                  if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
                    const inverseMapping = {};
                    Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
                      inverseMapping[initials] = fullName;
                    });
                    
                    usuarios = usuarios.map(user => inverseMapping[user] || user);
                    if (Array.isArray(headlines)) {
                      headlines = headlines.map(headline => ({
                        ...headline,
                        nombre: inverseMapping[headline.nombre] || headline.nombre
                      }));
                    }
                  }
                  
                  setHeadlinesGameData([usuarios, headlines]);
                  addDebugMessage('Datos del juego de titulares extraídos correctamente');
                }
              }
            }
          }
        } catch (error) {
          addDebugMessage(`Error extrayendo datos del juego: ${error.message}`);
        }
        
        // Guardar en localStorage que el análisis está completo
        localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
        
        // NUEVO: Limpiamos el flag de isProcessingShared ya que el análisis está completo
        localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
        setIsProcessingSharedFile(false);
        isProcessingRef.current = false;
        
        // Hacer scroll automático hacia arriba cuando finaliza el análisis
        setTimeout(() => scrollToAnalysis(), 300);
        
        // Programar limpieza automática después de 30 minutos
        setTimeout(() => {
          addDebugMessage('Programando limpieza local después de análisis completado');
          checkAndDeleteFiles(operationId);
        }, 1800000); // Esperar 30 minutos (1800000 ms)
        
        setIsFetchingMistral(false);
        setAiAnalysisProgress('');
        return true;
      } else {
        // Si hay un error, mostrar mensaje
        addDebugMessage(`Error al obtener respuesta de Azure: ${result.error}`);
        setError(result.error || 'Error al analizar el chat con Azure OpenAI');
        setIsFetchingMistral(false);
        setAiAnalysisProgress('');
        return false;
      }
    } catch (error) {
      addDebugMessage(`Error general en fetchMistralResponse: ${error.message}`);
      setIsFetchingMistral(false);
      setAiAnalysisProgress('');
      setError(`Error al analizar el chat: ${error.message}`);
      // Guardar que hubo un error para poder recuperarse después
      localStorage.setItem('whatsapp_analyzer_mistral_error', 'true');
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
    localStorage.removeItem('whatsapp_analyzer_chat_data');
    localStorage.removeItem('whatsapp_analyzer_has_chat_data');
    
    // Limpiar variables globales de Azure
    window.lastAzureResponse = null;
    window.lastNameMapping = null;
    
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
    // CRÍTICO: Verificación de seguridad antes de mostrar análisis automáticamente
    if (!user) {
      console.error('[SEGURIDAD] Intento de mostrar análisis automáticamente sin usuario autenticado - BLOQUEADO');
      // No mostrar error aquí para evitar interferir con el flujo normal de autenticación
      return;
    }

    // Solo iniciar el análisis si chatData está disponible pero no hay respuesta aún
    // y si no está iniciado desde processZipFile
    if (chatData && !chatGptResponse && !isFetchingMistral) {
      // Mostrar inmediatamente los datos de análisis estadístico
      setShowAnalysis(true);
      
      // Iniciar análisis psicológico solo si fue solicitado por otra vía (no desde processZipFile)
      // Pasar chatData como parámetro para asegurar que usa el contenido correcto
      fetchMistralResponse(chatData);
    }
  }, [chatData, chatGptResponse, isFetchingMistral, user]); // Agregar user como dependencia

  // Efecto para manejar compartir archivos y configurar Service Worker
  useEffect(() => {
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
            // Recargar la página para activar el Service Worker si es necesario
            if (window.location.search.includes('shared=')) {
              window.location.reload();
            }
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
        
        handleSharedFile(event.data.file);
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

  // Cargar datos persistentes al iniciar la aplicación
  useEffect(() => {
    const restoreStateAfterAuth = async () => {
      try {
        // Esperar a que la autenticación se complete antes de restaurar el estado
        console.log("Esperando autenticación antes de restaurar estado...");
        await userSession.waitForAuth();
        console.log("Autenticación completada, procediendo con restauración de estado");

        // CRÍTICO: Verificar que hay usuario autenticado antes de restaurar cualquier estado
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          console.error('[SEGURIDAD] No hay usuario autenticado - NO restaurar estado de análisis');
          // Limpiar cualquier dato persistente sin autorización
          const keysToRemove = [
            'whatsapp_analyzer_operation_id',
            'whatsapp_analyzer_loading',
            'whatsapp_analyzer_fetching_mistral',
            'whatsapp_analyzer_show_analysis',
            'whatsapp_analyzer_chatgpt_response',
            'whatsapp_analyzer_analysis_complete',
            'whatsapp_analyzer_mistral_error',
            'whatsapp_analyzer_chat_data',
            'whatsapp_analyzer_has_chat_data',
            'whatsapp_analyzer_force_fetch'
          ];
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });
          
          console.log('[SEGURIDAD] Datos de análisis no autorizados eliminados del localStorage');
          return;
        }

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
        
        // MODIFICADO: Recuperar flag isProcessingShared desde localStorage
        const savedIsProcessingShared = localStorage.getItem('whatsapp_analyzer_is_processing_shared') === 'true';
        console.log('DIAGNÓSTICO: Flag isProcessingShared recuperado de localStorage:', savedIsProcessingShared);
        
        // Si se detecta que estamos procesando un archivo desde WhatsApp, actualizar el estado
        if (savedIsProcessingShared) {
          addDebugMessage('Detectada sesión de archivo compartido desde WhatsApp - actualizando estado');
          setIsProcessingSharedFile(true);
          isProcessingRef.current = true;
          
          // NUEVO: Si estamos procesando un archivo compartido desde WhatsApp,
          // limpiamos cualquier análisis previo para evitar interferencia
          if (savedAnalysisComplete) {
            addDebugMessage('Detectado análisis previo con archivo compartido - limpiando datos conflictivos');
            localStorage.removeItem('whatsapp_analyzer_analysis_complete');
            localStorage.removeItem('whatsapp_analyzer_page_refreshed');
          }
        }
        
        // Verificar si estamos procesando un archivo compartido desde WhatsApp (cualquier fuente)
        const isProcessingShared = isProcessingSharedFile || isProcessingRef.current || savedIsProcessingShared;
        
        // Si hay un operationId guardado, hacer scroll automático hacia arriba después de un refresh
        if (savedOperationId) {
          // Usar un pequeño retraso para asegurarse de que el componente se ha renderizado
          setTimeout(() => scrollToAnalysis(), 300);
        }
        
        // Si el análisis estaba completo y la página se recargó, mostrar alerta de confirmación
        // MODIFICADO: Mostrar confirmación independientemente de si se está procesando archivo compartido
        if (savedAnalysisComplete && wasRefreshed) {
          // Quitar inmediatamente la marca de refrescado para evitar bucles
          localStorage.removeItem('whatsapp_analyzer_page_refreshed');
          
          // Solo mostrar confirmación si hay un análisis activo en progreso
          if (savedIsLoading || savedIsFetchingMistral) {
            addDebugMessage('Detectada recarga con análisis en progreso - mostrando confirmación');
            
            // Mostrar confirmación antes de borrar
            setTimeout(() => {
              if (window.confirm(t('app.refresh_confirmation.message'))) {
                addDebugMessage('Usuario confirmó borrar análisis en progreso - limpiando localStorage');
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
                localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
                
                // Recargar nuevamente para actualizar la interfaz
                window.location.reload();
              }
            }, 100);
            
            // IMPORTANTE: Salir aquí para evitar la ejecución del código de restauración más abajo
            return;
          }
        }
        
        // Restaurar el estado desde localStorage (solo si no se mostró confirmación)
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
      } catch (error) {
        console.error("Error durante la restauración del estado:", error);
        addDebugMessage(`Error durante la restauración del estado: ${error.message}`);
      }
    };

    restoreStateAfterAuth();
  }, []);

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
    // CORREGIDO: Ser más específico sobre cuándo hay datos valiosos
    const isAnalysisComplete = chatGptResponse && operationId && !isLoading && !isFetchingMistral;
    const isRecoveringState = localStorage.getItem('whatsapp_analyzer_analysis_complete') === 'true';
    const hasValuableData = isAnalysisComplete || isRecoveringState;
    
    // DEBUGGER TEMPORAL - EXPANDIDO para mostrar también durante procesamiento
    const shouldShowDebugger = hasValuableData || isLoading || isFetchingMistral;
    if (shouldShowDebugger) {
      const debugDiv = document.getElementById('mobile-debug') || document.createElement('div');
      if (!document.getElementById('mobile-debug')) {
        debugDiv.id = 'mobile-debug';
        debugDiv.style.cssText = `position: fixed; top: 10px; right: 10px; z-index: 9999; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 10px; border-radius: 5px; max-width: 280px; font-family: monospace; overflow-y: auto; max-height: 90vh;`;
        document.body.appendChild(debugDiv);
      }
      const listeners = typeof window.getEventListeners !== 'undefined' ? window.getEventListeners(window).beforeunload?.length : 'DevTools only';
      
      // Información completa para comparar contextos
      const contextInfo = {
        // Window/Document
        referrer: document.referrer,
        visibilityState: document.visibilityState,
        isSecure: window.isSecureContext,
        
        // PWA context
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        navStandalone: navigator.standalone || false,
        
        // URL/Navigation
        href: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        historyLength: window.history.length,
        
        // Service Worker
        swController: !!navigator.serviceWorker.controller,
        
        // User Agent
        userAgent: navigator.userAgent.includes('Chrome'),
        
        // Document ready state
        readyState: document.readyState
      };
      
      // Estado del procesamiento
      const processingState = isLoading ? '🔄 PROCESANDO' : (isFetchingMistral ? '🧠 ANALIZANDO IA' : '✅ COMPLETADO');
      
      debugDiv.innerHTML = `🔍 DEBUG CONTEXT<br>
      ESTADO: ${processingState}<br>
      hasValuableData: ${hasValuableData}<br>
      isAnalysisComplete: ${isAnalysisComplete}<br>
      isLoading: ${isLoading}<br>
      isFetchingMistral: ${isFetchingMistral}<br>
      REACT: chatGpt:${!!chatGptResponse} opId:${!!operationId}<br>
      beforeunload listeners: ${listeners}<br>
      <br>CONTEXT COMPARISON:<br>
      referrer: ${contextInfo.referrer}<br>
      visibilityState: ${contextInfo.visibilityState}<br>
      standalone: ${contextInfo.standalone}<br>
      navStandalone: ${contextInfo.navStandalone}<br>
      URL: ${contextInfo.href}<br>
      search: ${contextInfo.search}<br>
      hash: ${contextInfo.hash}<br>
      historyLength: ${contextInfo.historyLength}<br>
      swController: ${contextInfo.swController}<br>
      readyState: ${contextInfo.readyState}<br>
      ${isLoading || isFetchingMistral ? 'PROCESANDO - refresh puede interrumpir' : 'DEBERÍA funcionar'}`;
    }
    
    // Verificar si estamos procesando un archivo compartido desde WhatsApp
    const isProcessingShared = isProcessingSharedFile || isProcessingRef.current;
    
    // Solo establecer el flag cuando el análisis esté realmente completo
    // CAMBIO MÍNIMO: Comentar la verificación de isProcessingShared para que siempre se establezca
    if (isAnalysisComplete /* && !isProcessingShared */) {
      localStorage.setItem('whatsapp_analyzer_analysis_complete', 'true');
    }
    
    // Función para advertir al usuario antes de refrescar o cerrar la página cuando hay datos de análisis
    const handleBeforeUnload = (e) => {
      // CAMBIO MÍNIMO: Comentar la verificación de isProcessingShared para que siempre muestre advertencia
      if (hasValuableData /* && !isProcessingShared */ && !isLoading) {
        const message = "¿Estás seguro que quieres salir? Se perderán todos los datos del análisis estadístico y psicológico.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    // Marcar siempre refrescado en pagetransition o unload
    const handlePageHide = () => {
      // CAMBIO MÍNIMO: Comentar la verificación de isProcessingShared para que siempre marque refrescado
      if (hasValuableData /* && !isProcessingShared */ && !isLoading) {
        localStorage.setItem('whatsapp_analyzer_page_refreshed', 'true');
      }
    };
    
    // Monitorear clicks en enlaces y botones que puedan causar navegación
    const handleLinkClick = (e) => {
      // CAMBIO MÍNIMO: Comentar la verificación de isProcessingShared para que siempre intercepte
      if (hasValuableData /* && !isProcessingShared */ && !isLoading &&
          e.target.tagName === 'A' && 
          e.target.getAttribute('href') && 
          !e.target.getAttribute('href').startsWith('#') &&
          !e.target.closest('.analysis-container') &&
          !e.target.closest('.upload-section')) {
        e.preventDefault();
        e.stopPropagation();
        setShowRefreshConfirmation(true);
        return false;
      }
    };
    
    // CAMBIO MÍNIMO: Comentar la verificación de isProcessingShared para que siempre active advertencias
    if (hasValuableData /* && !isProcessingShared */ && !isLoading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('unload', handlePageHide);
      // Solo interceptar enlaces de navegación real, no clics generales
      document.addEventListener('click', handleLinkClick, true);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handlePageHide);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [chatGptResponse, operationId, isLoading, isFetchingMistral, isProcessingSharedFile]);

  // Função para continuar con la acción después de la confirmación
  const handleConfirmRefresh = () => {
    console.log("[DIAGNÓSTICO] Iniciando handleConfirmRefresh");
    console.log("[DIAGNÓSTICO] Estado del archivo pendiente:", pendingZipFile ? "EXISTE" : "NO EXISTE");
    
    // Primero ocultar el diálogo de confirmación para evitar clics múltiples
    setShowRefreshConfirmation(false);
    
    if (pendingZipFile) {
      console.log("[DIAGNÓSTICO] Archivo pendiente detectado:", pendingZipFile.name, "Tipo:", pendingZipFile.type, "Tamaño:", pendingZipFile.size);
      
      // Guardar una copia local del archivo pendiente para evitar problemas con el estado asíncrono
      const fileToProccess = pendingZipFile;
      
      // IMPORTANTE: Mantener una referencia al archivo en una variable global para depuración
      window._debugPendingFile = fileToProccess;
      
      // Limpiar el localStorage
      localStorage.removeItem('whatsapp_analyzer_operation_id');
      localStorage.removeItem('whatsapp_analyzer_loading');
      localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
      localStorage.removeItem('whatsapp_analyzer_show_analysis');
      localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
      localStorage.removeItem('whatsapp_analyzer_analysis_complete');
      localStorage.removeItem('whatsapp_analyzer_mistral_error');
      localStorage.removeItem('whatsapp_analyzer_force_fetch');
      localStorage.removeItem('whatsapp_analyzer_page_refreshed');
      localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
      localStorage.removeItem('whatsapp_analyzer_chat_data');
      localStorage.removeItem('whatsapp_analyzer_has_chat_data');
      
      // NUEVO: Limpiar variables globales de Azure
      window.lastAzureResponse = null;
      window.lastNameMapping = null;
      
      console.log("[DIAGNÓSTICO] LocalStorage y variables globales limpiados");
      
      // Resetear el estado de la aplicación - IMPORTANTE: Hacer esto antes de la operación asíncrona
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      setError('');
      setDebugMessages([]);
      processedShareIds.current.clear();
      setChatGptResponse("");
      setShowChatGptResponse(false);
      setShowAnalysis(false);
      setOperationId(null);
      setChatData(null);
      
      console.log("[DIAGNÓSTICO] Estado de la aplicación reseteado");
      
      // Procesar el nuevo archivo ZIP inmediatamente, sin setTimeout
      console.log("[DIAGNÓSTICO] Iniciando procesamiento del nuevo archivo ZIP sin setTimeout");
      
      try {
        // Iniciar el procesamiento del nuevo archivo
        console.log("[DIAGNÓSTICO] Activando indicador de carga");
        setIsLoading(true);
        
        console.log("[DIAGNÓSTICO] Guardando el archivo pendiente como archivo activo");
        setZipFile(fileToProccess);
        
        console.log("[DIAGNÓSTICO] Estableciendo mensaje de progreso");
        setProgressMessage("Procesando nuevo chat: Extrayendo mensajes y participantes...");
        
        console.log("[DIAGNÓSTICO] Llamando directamente a processZipFile");
        
        // Llamada directa a processZipFile sin usar await dentro de un callback
        processZipFile(fileToProccess)
          .then(() => {
            console.log("[DIAGNÓSTICO] processZipFile completado con éxito");
            // Hacer scroll hacia la sección de análisis
            scrollToAnalysis();
            
            // Incrementar el contador de uso
            if (user) {
              console.log("[DIAGNÓSTICO] Incrementando contador para usuario:", user.uid);
              incrementChatUsage(user.uid)
                .then(() => {
                  console.log("[DIAGNÓSTICO] Contador incrementado con éxito");
                  // Actualizar datos locales del perfil
                  if (userProfile) {
                    const newPeriodUsage = (userProfile.currentPeriodUsage || 0) + 1;
                    const newTotalUploads = (userProfile.totalUploads || 0) + 1;
                    
                    setUserProfile({
                      ...userProfile,
                      currentPeriodUsage: newPeriodUsage,
                      totalUploads: newTotalUploads
                    });
                    console.log("[DIAGNÓSTICO] Perfil de usuario actualizado localmente");
                  }
                })
                .catch(error => {
                  console.error("[DIAGNÓSTICO] Error al incrementar contador:", error.message);
                  addDebugMessage(`Error al incrementar contador: ${error.message}`);
                });
            }
          })
          .catch(error => {
            console.error("[DIAGNÓSTICO] Error en processZipFile:", error.message);
            setError(`Error al procesar el nuevo archivo: ${error.message}`);
          })
          .finally(() => {
            // Limpiar el archivo pendiente
            console.log("[DIAGNÓSTICO] Limpiando archivo pendiente");
            setPendingZipFile(null);
            console.log("[DIAGNÓSTICO] Desactivando indicador de carga");
            setIsLoading(false);
          });
      } catch (error) {
        console.error("[DIAGNÓSTICO] Error general en handleConfirmRefresh:", error.message);
        setError(`Error al procesar el nuevo archivo: ${error.message}`);
        setPendingZipFile(null);
        setIsLoading(false);
      }
    } else {
      console.log("[DIAGNÓSTICO] No hay archivo pendiente, simplemente limpiando y recargando");
      // Si no hay archivo pendiente, simplemente limpiar y recargar
      localStorage.removeItem('whatsapp_analyzer_operation_id');
      localStorage.removeItem('whatsapp_analyzer_loading');
      localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
      localStorage.removeItem('whatsapp_analyzer_show_analysis');
      localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
      localStorage.removeItem('whatsapp_analyzer_analysis_complete');
      localStorage.removeItem('whatsapp_analyzer_mistral_error');
      localStorage.removeItem('whatsapp_analyzer_force_fetch');
      localStorage.removeItem('whatsapp_analyzer_page_refreshed');
      localStorage.removeItem('whatsapp_analyzer_chat_data');
      localStorage.removeItem('whatsapp_analyzer_has_chat_data');
      
      // Recargar la página como último recurso si no hay archivo pendiente
      window.location.reload();
    }
  };
  
  // Función para cancelar la acción
  const handleCancelRefresh = () => {
    console.log('[FUNCIÓN] Ejecutando handleCancelRefresh');
    
    // Limpiar variables globales de Azure
    window.lastAzureResponse = null;
    window.lastNameMapping = null;
    
    // Solo ocultamos el diálogo de confirmación sin alterar ningún otro estado
    setShowRefreshConfirmation(false);
    
    // Registramos un mensaje de diagnóstico para seguimiento
    console.log('[DIAGNÓSTICO] Acción cancelada por el usuario - continuando con procesamiento previo');
    
    // Verificar si hay un análisis de archivo compartido en curso
    const isProcessingShared = localStorage.getItem('whatsapp_analyzer_is_processing_shared') === 'true';
    if (isProcessingShared) {
      console.log('[DIAGNÓSTICO] Detectado procesamiento de archivo compartido en curso - preservando estado');
    }
  };

  // Limpieza cuando el usuario finaliza explícitamente el análisis o reinicia
  const handleReset = () => {
    // Limpiar variables globales de Azure
    window.lastAzureResponse = null;
    window.lastNameMapping = null;
    
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
    localStorage.removeItem('whatsapp_analyzer_is_processing_shared');
    localStorage.removeItem('whatsapp_analyzer_chat_data');
    localStorage.removeItem('whatsapp_analyzer_has_chat_data');
    
    // Resetear estado
    setError('');
    setDebugMessages([]);
    processedShareIds.current.clear();
    setChatGptResponse("");
    setShowChatGptResponse(false);
    setShowAnalysis(false);
    setOperationId(null);
    setChatData(null);
    setIsLoading(false);
    setIsFetchingMistral(false);
    setIsProcessingSharedFile(false);
    isProcessingRef.current = false;
    setZipFile(null);
    setPendingZipFile(null);
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

  // NUEVO: Función para generar URL del juego ultra compacta
  const generateGameUrl = () => {
    try {
      // Verificar que tengamos datos de análisis
      if (!chatData) {
        setError("No hay datos de análisis para compartir");
        return;
      }
      
      // Obtener datos del análisis
      const data = window.lastAnalysisTopData;
      
      if (!data || !data.categorias || !data.usuarios) {
        setError("No se pudieron obtener los datos del análisis");
        return;
      }

      // Mapeo de categorías completas a códigos de una letra
      const catCodes = {
        'profesor': 'p', 'rollero': 'r', 'pistolero': 's', 'vampiro': 'v',
        'cafeconleche': 'c', 'dejaenvisto': 'd', 'narcicista': 'n', 
        'puntofinal': 'f', 'fosforo': 'o', 'menosesmas': 'm',
        'chismoso': 'h', 'happyflower': 'y', 'amoroso': 'a', 'sicopata': 'x',
        'comico': 'co', 'agradecido': 'ag', 'disculpon': 'di', 'curioso': 'cu'
      };
      
      // Obtener usuarios
      let users = [];
      if (Array.isArray(data.usuarios)) {
        users = data.usuarios;
      } else if (typeof data.usuarios === 'object') {
        users = Object.keys(data.usuarios);
      }
      
      // Crear array de nombres únicos para eliminar redundancia
      const names = [...new Set(
        Object.values(data.categorias)
          .filter(c => c && c.nombre)
          .map(c => c.nombre)
      )];
      
      // Crear pares [código, índice] para cada categoría
      const cats = [];
      Object.entries(catCodes).forEach(([cat, code]) => {
        if (data.categorias[cat]?.nombre) {
          const idx = names.indexOf(data.categorias[cat].nombre);
          if (idx >= 0) {
            cats.push([code, idx]);
          }
        }
      });
      
      // Estructura final: [usuarios, nombres, categorías]
      const result = [users, names, cats];
      
      // Comprimir con LZ-String
      const lzs = require('lz-string');
      const compressed = lzs.compressToEncodedURIComponent(JSON.stringify(result));
      
      // URL con parámetro z (más corto)
      const url = `${window.location.origin}/chat-game?z=${compressed}`;
      
      console.log("Datos ultra compactos:", result);
      
      // Actualizar estado y mostrar modal
      setGameUrl(url);
      setShowShareGameModal(true);
      
      return url;
    } catch (error) {
      console.error("Error generando URL:", error);
      setError("Error generando URL del juego");
      return null;
    }
  };
  
  // NUEVO: Función para copiar URL al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameUrl)
      .then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error("Error copiando al portapapeles:", err);
        setError("No se pudo copiar al portapapeles");
      });
  };
  
  // NUEVO: Función para compartir en WhatsApp
  const shareOnWhatsApp = () => {
    // Mensaje con formato mejorado para que el enlace sea clickeable
    const message = `¡Juega a adivinar quién es quién en nuestro chat de WhatsApp!\n\n${gameUrl}\n\n🎮 Juego de adivinar personalidades`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Función para hacer scroll a la sección de carga
  const scrollToUploadSection = (e) => {
    e.preventDefault();
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Inicializar la sesión del usuario
    const initializeAuth = async () => {
      try {
        console.log("Inicializando autenticación...");
        await userSession.init();
        console.log("Autenticación inicializada correctamente");
      } catch (error) {
        console.error("Error al inicializar autenticación:", error);
      }
    };

    initializeAuth();

    // Suscribirse a cambios en la sesión
    const unsubscribe = userSession.subscribe((user) => {
      if (user) {
        // Actualizar el estado cuando el usuario cambia
        setUser(user);
        // Cargar el perfil del usuario con manejo de errores
        getUserProfile(user.uid)
          .then(profile => {
            console.log('Perfil de usuario cargado:', profile);
            setUserProfile(profile);
          })
          .catch(error => {
            console.warn('Error al cargar perfil de usuario:', error);
            // Si hay error cargando el perfil, crear uno básico con datos de Firebase
            const basicProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              plan: 'free',
              currentPeriodUsage: 0,
              totalUploads: 0,
              is_admin: false
            };
            console.log('Usando perfil básico:', basicProfile);
            setUserProfile(basicProfile);
          });
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // CRÍTICO: Efecto para limpiar análisis si el usuario se desconecta
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, limpiar completamente cualquier estado de análisis
      console.log('[SEGURIDAD] Usuario desconectado - limpiando todo estado de análisis');
      
      // Limpiar estados de análisis
      setShowAnalysis(false);
      setChatData(null);
      setChatGptResponse("");
      setShowChatGptResponse(false);
      setIsFetchingMistral(false);
      setOperationId(null);
      setZipFile(null);
      
      // Limpiar localStorage
      const keysToRemove = [
        'whatsapp_analyzer_operation_id',
        'whatsapp_analyzer_loading',
        'whatsapp_analyzer_fetching_mistral',
        'whatsapp_analyzer_show_analysis',
        'whatsapp_analyzer_chatgpt_response',
        'whatsapp_analyzer_analysis_complete',
        'whatsapp_analyzer_mistral_error',
        'whatsapp_analyzer_chat_data',
        'whatsapp_analyzer_has_chat_data',
        'whatsapp_analyzer_force_fetch'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpiar variables globales de Azure
      window.lastAzureResponse = null;
      window.lastNameMapping = null;
    }
  }, [user]);

  return (
    <div className="App">
      <Header user={user} />
      {user && userProfile && location.pathname === '/plans' && (
        <UserPlanBanner userProfile={userProfile} />
      )}
      {!user && location.pathname !== '/plans' && window.lastAnalysisTopData && (
        <GameBanner onShareClick={generateGameUrl} />
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
                {operationId && user && (
                  <div className="analysis-container" ref={analysisRef}>
                    <h2 className="analysis-special-title">{t('app.analysis.statistical')}</h2>
                    
                    {/* Mostrar los componentes de análisis estadístico inmediatamente cuando chatData esté disponible */}
                    {chatData ? (
                      <>
                        <div className="analysis-module">
                          <AnalisisPrimerChat chatData={chatData} />
                        </div>
                        {/* Nuevos componentes de análisis */}
                        <div className="additional-analysis">
                          <div className="analysis-module">
                            <AnalisisTop chatData={chatData} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="empty-placeholder-container">
                        <div className="spinner-small"></div>
                        <p>{progressMessage || (isLoading ? t('app.progress.processing') : t('app.progress.generating'))}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Análisis psicológico de Azure */}
                {operationId && user && (
                  <div className="chat-analysis-section">
                    <h2 className="analysis-special-title">{t('app.analysis.psychological')}</h2>
                    
                    {isFetchingMistral ? (
                      <div className="empty-placeholder-container">
                        <div className="loading-progress">
                          <div className="spinner-circle"></div>
                          <div className="progress-bar">
                            <div className="progress-fill"></div>
                          </div>
                        </div>
                        <p>{t('app.analysis.preparing_psychological')}</p>
                        {aiAnalysisProgress && (
                          <p className="analysis-progress-detail">{aiAnalysisProgress}</p>
                        )}
                      </div>
                    ) : (
                      chatGptResponse && <Chatgptresultados 
                        chatGptResponse={chatGptResponse}
                        promptInput={chatData?.prompt} 
                        usuarioId={user?.uid || "anonymous"} 
                      />
                    )}
                    
                    {/* NUEVO: Componente independiente para juegos */}
                    <Juegos 
                      headlinesGameData={headlinesGameData}
                      topData={window.lastAnalysisTopData}
                      showHeadlinesGame={!!headlinesGameData && !!chatGptResponse}
                      showTopGame={!!window.lastAnalysisTopData}
                    />
                  </div>
                )}
                
                {/* Botón para compartir juego al final del análisis - MOVIDO A CHATGPTRESULTADOS.JS */}

                {/* Vista previa de la aplicación para usuarios no logueados */}
                {!user && <AppPreview />}

                {/* Sección de carga de archivos */}
                <div id="upload-section" className="upload-section">
                  <div className="upload-section-container">
                    {!user ? (
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
                          <div className="privacy-option">
                            <label className="privacy-checkbox-label">
                              <input
                                type="checkbox"
                                checked={skipAIPsychologicalAnalysis}
                                onChange={(e) => setSkipAIPsychologicalAnalysis(e.target.checked)}
                              />
                              <span>{t('app.privacy.no_ai_analysis')}</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/politica-cookies" element={<PoliticaCookies />} />
        {/* NUEVA RUTA: Juego de adivinar perfiles */}
        <Route path="/chat-game" element={<ChatTopGame />} />
        {/* NUEVA RUTA: Juego de titulares */}
        <Route path="/headlines-game" element={<ChatHeadlinesGame />} />
        </Routes>
        
        {/* Componente de instalación de PWA */}
        <InstallPWA />
        
        
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[BOTÓN] Clic en botón Cancelar');
                    handleCancelRefresh();
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="refresh-confirmation-confirm" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[BOTÓN] Clic en botón Confirmar');
                    console.log('[BOTÓN] Estado pendingZipFile:', pendingZipFile ? 'EXISTE' : 'NO EXISTE');
                    handleConfirmRefresh();
                  }}
                >
                  Sí, continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO: Modal para compartir juego */}
        {showShareGameModal && (
          <div className="share-game-modal">
            <div className="share-game-modal-content">
              <span className="close-modal" onClick={() => setShowShareGameModal(false)}>&times;</span>
              <h3>¡Comparte el juego!</h3>
              <p>Envía este enlace a tus amigos para que adivinen quién es el profesor, el vampiro y demás personalidades del chat.</p>
              <p className="warning-message">⚠️ Enlace sólo válido para este chat</p>
              
              <div className="game-url-container">
                <input 
                  type="text" 
                  value={gameUrl} 
                  readOnly 
                  onClick={(e) => e.target.select()} 
                />
                <button onClick={copyToClipboard}>
                  Copiar
                </button>
                {showCopiedMessage && <div className="copied-message">¡Copiado!</div>}
              </div>
              
              <div className="share-options">
                <button className="whatsapp-share" onClick={shareOnWhatsApp}>
                  <span>Compartir en WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Componente de footer - Movido fuera del main para ocupar todo el ancho */}
      <Footer/>
      
      {/* Barra de cookies */}
      <CookieBanner />
      
      {/* Debug Logger para desarrollo - solo se muestra si viene de WhatsApp */}
      <DebugLogger />
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;