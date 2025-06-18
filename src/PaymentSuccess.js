// Updated SimplePaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase_auth'; // Adjust path if needed
import { getUserPlan } from './stripe_integration';
import { useTranslation } from 'react-i18next';

const SimplePaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Obtener parámetros de la URL para verificar el pago
          const urlParams = new URLSearchParams(location.search);
          const sessionId = urlParams.get('session_id');
          
          // Actualizar el plan del usuario
          const userPlan = await getUserPlan(user.uid);
          console.log('Plan actualizado:', userPlan);
          
          // 🎯 ENVIAR EVENTO DE CONVERSIÓN DE COMPRA A GOOGLE ADS
          // Solo si tenemos session_id (confirmación de pago exitoso)
          if (sessionId && window.gtag) {
            // Verificar si ya enviamos este evento para evitar duplicados
            const purchaseKey = `purchase_tracked_${sessionId}`;
            const alreadyTracked = localStorage.getItem(purchaseKey);
            
            if (!alreadyTracked) {
              console.log('📊 Enviando evento de compra a Google Ads via GTM...');
              
              // Obtener información del plan para el valor de conversión
              const planValues = {
                'basic': 4,
                'standard': 8, 
                'premium': 10,
                'free': 0
              };
              
              const conversionValue = planValues[userPlan] || 0;
              
              // Enviar evento al dataLayer para GTM
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                'event': 'purchase_completed',
                'user_id': user.uid,
                'email': user.email,
                'plan': userPlan,
                'value': conversionValue,
                'currency': 'EUR',
                'transaction_id': sessionId,
                'timestamp': new Date().toISOString(),
                'conversion_id': user.uid,
                'conversion_label': 'purchase',
                'conversion_value': conversionValue
              });
              
              // También enviar directamente a gtag como respaldo
              window.gtag('event', 'purchase', {
                'transaction_id': sessionId,
                'value': conversionValue,
                'currency': 'EUR',
                'user_id': user.uid,
                'custom_parameter_1': userPlan,
                'send_to': 'AW-17125098813/PURCHASE_LABEL' // Crear nueva conversión para compras
              });
              
              // Marcar como enviado para evitar duplicados
              localStorage.setItem(purchaseKey, 'true');
              
              console.log(`✅ Evento de compra enviado - Plan: ${userPlan}, Valor: €${conversionValue}`);
            } else {
              console.log('⚠️ Evento de compra ya fue enviado anteriormente para esta sesión');
            }
          }
          
          // User is signed in, redirect to plans page with success flag
          console.log('User is authenticated, redirecting to plans page');
          setTimeout(() => {
            navigate('/plans?payment_success=true', { replace: true });
          }, 1500);
        } catch (error) {
          console.error('Error updating user plan:', error);
          setError(t('payment.success.error.update'));
        }
      } else {
        // User is not signed in, redirect to login page with return URL
        console.log('User is not authenticated, redirecting to login page');
        setError(t('payment.success.error.session'));
        setTimeout(() => {
          // Redirect to login with return URL to come back to plans
          navigate('/login?returnUrl=/plans&payment_success=true', { replace: true });
        }, 1500);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate, t, location.search]);
  
  return (
    <div style={{
      maxWidth: "600px",
      margin: "40px auto",
      padding: "30px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      textAlign: "center",
      backgroundColor: "#fff"
    }}>
      <h2 style={{ color: "#4CAF50" }}>{t('payment.success.title')}</h2>
      {error ? (
        <p style={{ color: "#F44336" }}>{error}</p>
      ) : (
        <p>{t('payment.success.redirecting')}</p>
      )}
      <div style={{
        width: "50px",
        height: "50px",
        margin: "20px auto",
        border: "5px solid #f3f3f3",
        borderTop: "5px solid #4CAF50",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SimplePaymentSuccess;