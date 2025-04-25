// SubscriptionPlans.js
import React, { useState, useEffect } from 'react';
import { getUserProfile } from './firebase_auth';
import { PLANS, redirectToCheckout, manageSubscription } from './stripe_integration';
import './SubscriptionPlans.css';
import { useLocation } from 'react-router-dom';

// Add paymentSuccess prop
const SubscriptionPlans = ({ userId, paymentSuccess }) => {
  const [userPlan, setUserPlan] = useState('free');
  const [userUsage, setUserUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();
  
  // Show success message if redirected from successful payment
  useEffect(() => {
    // Check URL parameters for payment success
    const urlParams = new URLSearchParams(location.search);
    const hasPaymentSuccess = urlParams.get('payment_success') === 'true';
    
    if (hasPaymentSuccess || paymentSuccess) {
      setSuccessMessage('¡Tu pago ha sido procesado correctamente! Tu plan ha sido actualizado.');
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, '/plans');
      
      // Hide the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, [location, paymentSuccess]);

  // Load user plan and usage data
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const userProfile = await getUserProfile(userId);
        setUserPlan(userProfile.plan || 'free');
        setUserUsage(userProfile.currentPeriodUsage || 0);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('No se pudo cargar la información de tu plan. Por favor, inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Handle plan subscription
  const handleSubscribe = async (planId) => {
    try {
      setError('');
      setSuccessMessage('');
      
      // Find the plan details
      const plan = Object.values(PLANS).find(p => p.id === planId);
      
      if (!plan || !plan.priceId) {
        throw new Error('Plan no válido');
      }
      
      await redirectToCheckout(plan.priceId, userId);
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      setError('Error al procesar tu suscripción. Por favor, inténtalo de nuevo.');
    }
  };

  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      setError('');
      await manageSubscription(userId);
    } catch (error) {
      console.error('Error managing subscription:', error);
      setError('Error al abrir el portal de gestión. Por favor, inténtalo de nuevo.');
    }
  };

  if (isLoading) {
    return <div className="subscription-loading">Cargando información de planes...</div>;
  }

  // Calculate quota usage and limits
  const currentPlan = Object.values(PLANS).find(p => p.id === userPlan) || PLANS.FREE;
  const usagePercentage = Math.min((userUsage / currentPlan.quota) * 100, 100);
  const remainingUploads = Math.max(currentPlan.quota - userUsage, 0);

  return (
    <div className="subscription-container">
      <h2>Planes de Suscripción</h2>
      
      {error && <div className="subscription-error">{error}</div>}
      
      {successMessage && (
        <div className="success-message" style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
          textAlign: "center"
        }}>
          {successMessage}
        </div>
      )}
      
      <div className="current-plan-info">
        <h3>Tu Plan Actual: {currentPlan.name}</h3>
        <div className="usage-info">
          <div className="usage-text">
            <span>{userUsage} de {currentPlan.quota} chats utilizados</span>
            <span>{remainingUploads} chats restantes</span>
          </div>
          <div className="usage-bar-container">
            <div 
              className="usage-bar" 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
        
        {userPlan !== 'free' && (
          <button 
            className="manage-subscription-button"
            onClick={handleManageSubscription}
          >
            Gestionar Suscripción
          </button>
        )}
      </div>
      
      <div className="plans-grid">
        {Object.values(PLANS).map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${userPlan === plan.id ? 'current-plan' : ''}`}
          >
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                {plan.price > 0 ? (
                  <>
                    <span className="price-amount">{plan.price}€</span>
                    <span className="price-period">/mes</span>
                  </>
                ) : (
                  <span className="price-free">Gratis</span>
                )}
              </div>
            </div>
            
            <div className="plan-features">
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>Análisis de {plan.quota} chats por mes</span>
              </div>
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>Análisis estadístico</span>
              </div>
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>Análisis psicológico</span>
              </div>
              {plan.id !== 'free' && (
                <div className="plan-feature">
                  <span className="feature-check">✓</span>
                  <span>Renovación automática mensual</span>
                </div>
              )}
            </div>
            
            <div className="plan-action">
              {userPlan === plan.id ? (
                <button className="plan-button current" disabled>
                  Plan Actual
                </button>
              ) : plan.id === 'free' ? (
                <button 
                  className="plan-button"
                  disabled
                >
                  Plan Gratuito
                </button>
              ) : (
                <button 
                  className="plan-button"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {userPlan === 'free' ? 'Suscribirse' : 'Cambiar Plan'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {userPlan === 'premium' && userUsage >= PLANS.PREMIUM.quota && (
        <div className="quota-exceeded-message">
          Has alcanzado el límite máximo del Plan Premium. Deberás esperar hasta tu próximo ciclo de facturación para analizar más chats.
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;