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
  const { user, userProfile, setUserProfile, isAuthLoading } = useAuth();
  
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

  // This useEffect is not needed anymore as authentication state is managed by AuthContext
  // useEffect(() => {
  //   const checkAuthState = async () => {
  //     try {
  //       const currentUser = await getCurrentUser();
  //       setUser(currentUser);
  //       if (currentUser) {
  //         const userProfile = await getUserProfile(currentUser.uid);
  //         setUserProfile(userProfile);
  //       }
  //     } catch (error) {
  //       console.error('Auth check failed:', error);
  //     } finally {
  //       setIsAuthLoading(false);
  //     }
  //   };
  // 
  //   checkAuthState();
  // }, []);
  
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
          
          // Eliminar archivos automáticamente una vez recibida la respuesta
          addDebugMessage('Intentando eliminar archivos automáticamente');
          try {
            const deleteResponse = await fetch(`${API_URL}/api/delete-files/${operationId}`, {
              method: 'DELETE',
            });
            
            if (deleteResponse.ok) {
              addDebugMessage('Archivos eliminados automáticamente después del análisis');
            } else {
              const deleteData = await deleteResponse.json();
              addDebugMessage(`No se pudieron eliminar los archivos automáticamente: ${deleteData.error || 'Error desconocido'}`);
            }
          } catch (deleteError) {
            addDebugMessage(`Error al eliminar archivos: ${deleteError.message}`);
          }
          
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
      
      
  // Start polling for Mistral response when we have an operationId
  useEffect(() => {
    if (operationId && !chatGptResponse) {
      fetchMistralResponse();
    }
  }, [operationId]);

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

  // Check if user can upload a chat based on their subscription plan
  const checkUploadEligibility = async () => {
    if (!user) {
      setError('Debes iniciar sesión para analizar conversaciones.');
      return false;
    }
    
    try {
      const canUpload = await canUploadChat(user.uid);
      
      if (!canUpload) {
        setShowUpgradeModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking upload eligibility:', error);
      setError('Error al verificar tu plan. Por favor, inténtalo de nuevo.');
      return false;
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
    
    // Verificar que sea un archivo ZIP
    const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
                      file.name.toLowerCase().endsWith('.zip');
    
    if (!isZipFile) {
      addDebugMessage(`Archivo no es ZIP: ${file.type}`);
      setError(`Por favor, comparte un archivo ZIP válido. Tipo recibido: ${file.type}`);
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }
    
    // Check if user is logged in and has available uploads
    const isEligible = await checkUploadEligibility();
    if (!isEligible) {
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
      return;
    }
    
    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      // Procesar el archivo
      await processZipFile(file);
      
      // If processing was successful, increment usage counter
      if (user) {
        await incrementChatUsage(user.uid);
        
        // Update local user profile data
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            currentPeriodUsage: (userProfile.currentPeriodUsage || 0) + 1,
            totalUploads: (userProfile.totalUploads || 0) + 1
          });
        }
      }
    } catch (err) {
      addDebugMessage(`Error procesando archivo: ${err.message}. Inténtalo más tarde.`);
      setError(`Error al procesar el archivo: ${err.message}. Inténtalo más tarde.`);
    } finally {
      setIsLoading(false);
      setIsProcessingSharedFile(false);
      isProcessingRef.current = false;
    }
  };

  // Procesar el archivo ZIP
  const processZipFile = async (file) => {
    addDebugMessage(`Enviando archivo al backend: ${file.name}`);
    
    const formData = new FormData();
    formData.append('zipFile', file);
    
    try {
      // Mostrar la URL a la que se está enviando la solicitud
      addDebugMessage(`URL de API: ${API_URL}/api/extract`);
      
      // Set operation_id and show analysis sections right after uploading files
      // but before waiting for the ChatGPT/Mistral response
      setShowAnalysis(true);
      
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });
      
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
      // This will be processed asynchronously after showing the analysis sections
      if (result.chatgpt_response || result.mistral_response) {
        addDebugMessage('Respuesta de AI recibida');
        setChatGptResponse(result.chatgpt_response || result.mistral_response);
        setShowChatGptResponse(true);
      } else {
        setChatGptResponse("");
        setShowChatGptResponse(false);
      }
      
    } catch (error) {
      addDebugMessage(`Error procesando ZIP: ${error.message}. Inténtalo más tarde.`);
      throw error;
    }
  };

  // Manejar la carga manual de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      setError('Por favor, sube un archivo ZIP válido');
      return;
    }
    
    // Check if user is logged in and has available uploads
    const isEligible = await checkUploadEligibility();
    if (!isEligible) {
      return;
    }
    
    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      await processZipFile(file);
      
      // If processing was successful, increment usage counter
      if (user) {
        await incrementChatUsage(user.uid);
        
        // Update local user profile data
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            currentPeriodUsage: (userProfile.currentPeriodUsage || 0) + 1,
            totalUploads: (userProfile.totalUploads || 0) + 1
          });
        }
      }
    } catch (err) {
      console.error('Error al procesar:', err);
      setError(`Error al procesar el archivo: ${err.message}. Inténtalo más tarde.`);
    } finally {
      setIsLoading(false);
    }
  };

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
                                accept=".zip,application/zip,application/x-zip,application/x-zip-compressed" 
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