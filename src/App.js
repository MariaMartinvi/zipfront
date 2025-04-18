import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import InstallPWA from './InstallPWA';
import Chatgptresultados from './Chatgptresultados';
import ChatAnalysisComponent from './ChatAnalysisComponent';
import WhatsappInstructions from './WhatsappInstructions';
import AnalisisPrimerChat from './Analisis_primer_chat';
import AnalisisInfluencer from './Analisis_influencer';
import AnalisisEmojis from './Analisis_emojis';
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
import { deleteFiles, uploadFile, getMistralResponse } from './fileService';
import Contact from './Paginasextra/Contact';
import FAQ from './Paginasextra/FAQ';
import TermsOfService from './Paginasextra/TermsOfService';
import PrivacyPolicy from './Paginasextra/PrivacyPolicy';

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

function App() {
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

  const processZipFile = async (file) => {
    addDebugMessage(`Enviando archivo al backend: ${file.name} (${file.size} bytes) - Tipo: ${file.type}`);
    
    // Asegurarse una última vez que el archivo tiene el tipo MIME correcto
    let finalFile = file;
    if (file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip') {
      try {
        finalFile = new File([file], file.name, {
          type: 'application/zip',
          lastModified: file.lastModified
        });
        addDebugMessage(`Tipo MIME corregido una última vez: ${finalFile.type}`);
      } catch (error) {
        addDebugMessage(`Error al corregir tipo MIME: ${error.message}`);
        // Usar el archivo original si falla la conversión
        finalFile = file;
      }
    }
    
    const formData = new FormData();
    formData.append('zipFile', finalFile);
    
    try {
      // Mostrar la URL a la que se está enviando la solicitud
      addDebugMessage(`URL de API: ${API_URL}/api/extract`);
      
      // Set operation_id and show analysis sections right after uploading files
      setShowAnalysis(true);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // Incluir cookies para autenticación si es necesario
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        addDebugMessage(`Error en respuesta del servidor: ${response.status}, ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}`);
        } catch (jsonError) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }
      
      const result = await response.json();
      addDebugMessage(`Respuesta exitosa: ${result.files?.length || 0} archivos`);
      
      // Set the operation_id immediately so analysis components can start loading their data
      if (result.operation_id) {
        setOperationId(result.operation_id);
        
        // Trigger Mistral analysis after successful file extraction
        try {
          addDebugMessage(`Iniciando análisis Mistral para operación ${result.operation_id}`);
          const mistralResponse = await fetch(`${API_URL}/api/analyze-mistral/${result.operation_id}`, {
            method: 'POST',
            credentials: 'include' // Incluir cookies para autenticación si es necesario
          });
          
          if (mistralResponse.ok) {
            addDebugMessage(`Análisis Mistral iniciado correctamente para operación ${result.operation_id}`);
          } else {
            addDebugMessage(`Error al iniciar análisis Mistral: ${mistralResponse.status}`);
          }
        } catch (mistralError) {
          addDebugMessage(`Error al iniciar análisis Mistral: ${mistralError.message}`);
        }
      }
      
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id,
        hasText: file.has_text
      }));
      
      setFiles(extractedFiles);
      
      // Handle ChatGPT/Mistral response separately
      if (result.chatgpt_response || result.mistral_response) {
        addDebugMessage('Respuesta de AI recibida');
        setChatGptResponse(result.chatgpt_response || result.mistral_response);
        setShowChatGptResponse(true);
      } else {
        setChatGptResponse("");
        setShowChatGptResponse(false);
      }
      
      // Indicar éxito para que la lógica de incremento de contador funcione
      addDebugMessage('Procesamiento de archivo ZIP completado con éxito');
      return result;
    } catch (error) {
      // Handle abort/timeout errors specifically
      if (error.name === 'AbortError') {
        addDebugMessage("La solicitud tardó demasiado tiempo en completarse");
        throw new Error("La operación tardó demasiado tiempo. Por favor, inténtalo de nuevo más tarde.");
      }
      
      addDebugMessage(`Error procesando ZIP: ${error.message}. Inténtalo más tarde.`);
      throw error;
    }
  };

  // Manejar la carga manual de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Archivo recibido:", file.name, "Tipo:", file.type, "Tamaño:", file.size);
    
    // Verificación extremadamente permisiva - aceptar cualquier archivo con extensión .zip
    // o cualquier archivo con tipo MIME que pueda ser un ZIP
    const isZipFile = file.name.toLowerCase().endsWith('.zip') || 
                      file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
                      file.type === 'application/octet-stream' ||
                      file.type === ''; // Google Drive a veces puede enviar tipo vacío
    
    if (!isZipFile) {
      setError('Por favor, sube un archivo ZIP válido (.zip)');
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
    
    try {
      await processZipFile(analyzedFile);
      
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
    const currentUser =  await getCurrentUser();
    if (currentUser && !user)  {
    
        setUser(currentUser);}
    setError('');
    setIsLoading(true);
    setZipFile(analyzedFile); // Usar el archivo analizado/corregido
    
    let processingSuccess = false;
    
    try {
      addDebugMessage(`Enviando archivo corregido al backend: ${analyzedFile.name} (${analyzedFile.size} bytes) - Tipo: ${analyzedFile.type}`);
      // Procesar el archivo
      await processZipFile(analyzedFile); // Usar el archivo analizado/corregido
      
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
    if (data.operation_id) {
      setOperationId(data.operation_id);
      setShowAnalysis(true);
    }
  };

  // Function to poll for Mistral response
  // Function to poll for Mistral response
  const fetchMistralResponse = async () => {
    if (!operationId || isFetchingMistral) return;
    
    setIsFetchingMistral(true);
    
    try {
      let attempts = 0;
      const maxAttempts = 10; // Try 10 times with delay in between
      
      const checkResponse = async () => {
        attempts++;
        
        try {
          const response = await fetch(`${API_URL}/api/mistral-response/${operationId}`);
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.ready && data.response) {
            addDebugMessage('Respuesta de Mistral recibida');
            setChatGptResponse(data.response);
            setShowChatGptResponse(true);
            
            // Wait a reasonable amount of time to ensure all components have loaded
            // before scheduling the file deletion
            setTimeout(() => {
              addDebugMessage('Programando eliminación de archivos tras un periodo adecuado');
              checkAndDeleteFiles(operationId);
            }, 60000); // Wait 1 minute before even starting the deletion process
            
            setIsFetchingMistral(false);
            return true;
          }
          
          if (attempts >= maxAttempts) {
            addDebugMessage('Máximo de intentos alcanzado esperando por Mistral');
            setIsFetchingMistral(false);
            return false;
          }
          
          // Wait and try again
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds delay
          return await checkResponse();
        } catch (error) {
          addDebugMessage(`Error al obtener respuesta de Mistral: ${error.message}`);
          setIsFetchingMistral(false);
          return false;
        }
      };
      
      // Start checking
      await checkResponse();
    } catch (error) {
      addDebugMessage(`Error general en fetchMistralResponse: ${error.message}`);
      setIsFetchingMistral(false);
    }
  };
  
  // Add this new function for checking if processing is complete before deleting
  const checkAndDeleteFiles = async (operationId, retries = 5, delay = 20000) => {
    if (retries <= 0) {
      addDebugMessage('Máximo de reintentos alcanzado, intentando eliminar archivos de todos modos');
      tryDeleteFiles(operationId);
      return;
    }
    
    try {
      // Check if the response file exists (since you don't have the /api/check-processing endpoint yet)
      const response = await fetch(`${API_URL}/api/check-processing/${operationId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.complete) {
          addDebugMessage('Procesamiento confirmado como completo, eliminando archivos en 60 segundos');
          // Add a longer delay to ensure any ongoing processes are complete
          setTimeout(() => tryDeleteFiles(operationId), 60000);
        } else {
          addDebugMessage(`Procesamiento no completado todavía, esperando ${delay/1000} segundos...`);
          setTimeout(() => checkAndDeleteFiles(operationId, retries - 1, delay), delay);
        }
      } else {
        addDebugMessage('Error al verificar estado del procesamiento, intentando eliminar de todos modos');
        // Give more time
        setTimeout(() => tryDeleteFiles(operationId), 60000);
      }
    } catch (error) {
      addDebugMessage(`Error en el proceso de verificación: ${error.message}`);
      setTimeout(() => checkAndDeleteFiles(operationId, retries - 1, delay), delay);
    }
  };

const tryDeleteFiles = async (operationId) => {
  try {
    addDebugMessage('Intentando eliminar archivos');
    const deleteResponse = await fetch(`${API_URL}/api/delete-files/${operationId}`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      addDebugMessage('Archivos eliminados con éxito');
    } else {
      const deleteData = await deleteResponse.json();
      addDebugMessage(`No se pudieron eliminar los archivos: ${deleteData.error || 'Error desconocido'}`);
    }
  } catch (deleteError) {
    addDebugMessage(`Error al intentar eliminar archivos: ${deleteError.message}`);
  }
};
  // Start polling for Mistral response when we have an operationId
  useEffect(() => {
    if (operationId && !chatGptResponse) {
      fetchMistralResponse();
    }
  }, [operationId, chatGptResponse]);

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

  // Reiniciar la aplicación (para debugging)
  const handleReset = () => {
    setIsProcessingSharedFile(false);
    isProcessingRef.current = false;
    setError('');
    setIsLoading(false);
    setDebugMessages([]);
    processedShareIds.current.clear();
    setChatGptResponse("");
    setShowChatGptResponse(false);
  };

  // Component to render when user needs to upgrade
  const UpgradeModal = () => (
    <div className="upgrade-modal">
      <div className="upgrade-modal-content">
        <h2>Límite de análisis alcanzado</h2>
        <p>Has alcanzado el límite de análisis de conversaciones para tu plan actual.</p>
        <p>Actualiza a un plan superior para continuar analizando tus conversaciones.</p>
        <div className="upgrade-buttons">
          <button 
            className="view-plans-button"
            onClick={() => window.location.href = '/plans'}
          >
            Ver Planes
          </button>
          <button 
            className="close-button"
            onClick={() => setShowUpgradeModal(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  // Main app component UI with routing
  return (
    <Router>
      <div className="App">
        <Header user={user} />
        <UserPlanBanner userProfile={userProfile} />
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
                  {isProcessingSharedFile ? (
                    <div className="loading-indicator">
                      <div className="spinner"></div>
                      <p>Recibiendo archivo compartido...</p>
                      <button 
                        onClick={handleReset}
                        className="cancel-button"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="upload-section">
                      {!user ? (
                        <div className="login-required">
                          <h2>Inicia sesión para comenzar</h2>
                          <p>Necesitas iniciar sesión para analizar conversaciones.</p>
                          <div className="auth-buttons">
                            <button 
                              className="login-button"
                              onClick={() => window.location.href = '/login'}
                            >
                              Iniciar Sesión
                            </button>
                            <button 
                              className="register-button"
                              onClick={() => window.location.href = '/register'}
                            >
                              Crear Cuenta
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                                <span>Sube un archivo ZIP</span>
                                <span className="file-upload-subtext">o comparte directamente desde WhatsApp siguiendo los pasos anteriores</span>
                              </div>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="error-message">
                      <p>{error}</p>
                    </div>
                  )}

                  {isLoading && (
                    <div className="loading-indicator">
                      <div className="spinner"></div>
                      <p>Descomprimiendo archivo y analizando contenido...</p>
                    </div>
                  )}

                  {/* Show analysis components immediately after upload */}
                  {showAnalysis && operationId && (
                    <div className="analysis-container">
                      <h2>Análisis Estadístico</h2>
                      <div className="analysis-module">
                        <AnalisisPrimerChat operationId={operationId} />
                      </div>
                      {/* Nuevos componentes de análisis */}
                      <div className="additional-analysis">
                        <div className="analysis-module">
                          <AnalisisInfluencer operationId={operationId} />
                        </div>
                        <div className="analysis-module">
                          <AnalisisEmojis operationId={operationId} />
                        </div>
                        <div className="analysis-module">
                          <AnalisisTop operationId={operationId} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show loading indicator for Mistral/ChatGPT response if it's still being fetched */}
                  {operationId && isFetchingMistral && (
                    <div className="chat-analysis-loading">
                      <h2>Análisis Psicológico</h2>
                      <div className="loading-indicator">
                        <div className="spinner"></div>
                        <p>Generando análisis con IA (esto puede tardar unos minutos)...</p>
                      </div>
                    </div>
                  )}

                  {/* Display ChatGPT/Mistral response when available */}
                  {showChatGptResponse && chatGptResponse && (
                    <div className="chat-analysis-section">
                      <h2>Análisis Psicológico</h2>
                      <Chatgptresultados chatGptResponse={chatGptResponse} />
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
        </main>
      </div>
    </Router>
  );
} 

export default App;