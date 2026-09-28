// Updated SimplePaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase_auth'; // Adjust path if needed
import { getUserPlan } from './stripe_integration';
import { useTranslation } from 'react-i18next';

// Precio del pack de IA (5 €). Valor de la conversión para GA4 / Google Ads.
const PURCHASE_VALUE_EUR = 5;

/**
 * Envía la compra a GTM (evento purchase_completed) una sola vez por sesión de Stripe.
 * Sin datos personales: GA4 prohíbe recibir emails.
 */
export const trackPurchase = (sessionId, userId) => {
  if (!sessionId) return false;
  const purchaseKey = `purchase_tracked_${sessionId}`;
  try {
    if (localStorage.getItem(purchaseKey)) return false;
  } catch (e) { /* almacenamiento bloqueado: seguimos */ }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'purchase_completed',
    user_id: userId,
    value: PURCHASE_VALUE_EUR,
    currency: 'EUR',
    transaction_id: sessionId
  });

  // Respaldo directo a Google Ads si la página tiene gtag cargado
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-17125098813/CuhGCMf20d0aEL2K8eU_',
      value: PURCHASE_VALUE_EUR,
      currency: 'EUR',
      transaction_id: sessionId
    });
  }

  try {
    localStorage.setItem(purchaseKey, 'true');
  } catch (e) { /* ignorar */ }
  return true;
};

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

          // 🎯 Evento de compra (antes de nada, para que un fallo posterior no lo impida)
          if (trackPurchase(sessionId, user.uid)) {
            console.log('✅ Evento purchase_completed enviado');
          }

          // Actualizar el plan del usuario
          const userPlan = await getUserPlan(user.uid);
          console.log('Plan actualizado:', userPlan);

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