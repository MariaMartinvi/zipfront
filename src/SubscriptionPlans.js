// SubscriptionPlans.js
import React, { useState, useEffect } from 'react';
import { PLANS, redirectToCheckout, manageSubscription, getUserPlan } from './stripe_integration';
import './SubscriptionPlans.css';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserProfile } from './firebase_auth';

// Add paymentSuccess prop
const SubscriptionPlans = ({ userId, paymentSuccess }) => {
  const { t } = useTranslation();
  const [userPlan, setUserPlan] = useState('free');
  const [userUsage, setUserUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  
  // Show success message if redirected from successful payment
  useEffect(() => {
    // Check URL parameters for payment success
    const urlParams = new URLSearchParams(location.search);
    const hasPaymentSuccess = urlParams.get('payment_success') === 'true';
    
    if (hasPaymentSuccess || paymentSuccess) {
      // Actualizar el plan del usuario
      const updateUserPlan = async () => {
        try {
          const newPlan = await getUserPlan(userId);
          setUserPlan(newPlan);
          setSuccessMessage(t('subscription.success_message'));
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, '/plans');
          
          // Hide the success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 5000);
        } catch (error) {
          console.error('Error updating user plan:', error);
          setError(t('subscription.error.load'));
        }
      };
      
      updateUserPlan();
    }
  }, [location, paymentSuccess, userId, t]);

  // Load user plan and usage data
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // Intentar obtener el perfil del usuario primero
        try {
          const userProfile = await getUserProfile(userId);
          if (userProfile) {
            setUserPlan(userProfile.plan || 'free');
            setUserUsage(userProfile.currentPeriodUsage || 0);
            setIsAdmin(userProfile.is_admin || false);
            console.log('Perfil de usuario cargado:', userProfile);
          } else {
            // Fallback a datos por defecto
            console.log('Usando datos por defecto para evitar errores CORS');
            setUserPlan('free');
            setUserUsage(0);
            setIsAdmin(false);
          }
        } catch (profileError) {
          console.warn('Error cargando perfil, usando datos por defecto:', profileError);
          setUserPlan('free');
          setUserUsage(0);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError(t('subscription.error.load'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId, t]);

  // Handle plan subscription
  const handleSubscribe = async (planId) => {
    try {
      setError('');
      setSuccessMessage('');
      
      // Find the plan details
      const plan = Object.values(PLANS).find(p => p.id === planId);
      
      console.log('Attempting to subscribe to plan:', plan);
      
      if (!plan) {
        throw new Error('Plan no encontrado');
      }
      
      if (!plan.priceId) {
        console.error('Plan sin priceId:', plan);
        throw new Error('Plan no válido: Falta priceId');
      }
      
      await redirectToCheckout(plan.priceId, userId);
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      setError(t('subscription.error.subscribe'));
    }
  };

  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      setError('');
      await manageSubscription(userId);
    } catch (error) {
      console.error('Error managing subscription:', error);
      setError(t('subscription.error.manage'));
    }
  };

  if (isLoading) {
    return <div className="subscription-loading">{t('subscription.loading')}</div>;
  }

  // Calculate quota usage and limits
  const currentPlan = Object.values(PLANS).find(p => p.id === userPlan) || PLANS.FREE;
  
  // Para administradores, mostrar información especial
  let usagePercentage, remainingUploads, displayQuota;
  if (isAdmin) {
    usagePercentage = 0; // Siempre 0% para admin
    remainingUploads = 'Ilimitado';
    displayQuota = 'Ilimitado';
  } else {
    usagePercentage = Math.min((userUsage / currentPlan.quota) * 100, 100);
    remainingUploads = Math.max(currentPlan.quota - userUsage, 0);
    displayQuota = currentPlan.quota;
  }

  // Traducir nombres de planes
  const getPlanName = (plan) => {
    switch (plan.id) {
      case 'free':
        return t('subscription.plans.free.name');
      case 'basic':
        return t('subscription.plans.basic.name', { price: plan.price });
      case 'standard':
        return t('subscription.plans.standard.name', { price: plan.price });
      case 'premium':
        return t('subscription.plans.premium.name', { price: plan.price });
      case 'enterprise':
        return t('subscription.plans.enterprise.name', { price: plan.price });
      default:
        return plan.name;
    }
  };

  return (
    <div className="subscription-container">
      <h2>{t('subscription.title')}</h2>
      
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
      
      {/* Mostrar badge especial para administradores */}
      {isAdmin && (
        <div className="admin-badge" style={{
          backgroundColor: "#ff6b35",
          color: "white",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
          fontWeight: "bold",
          border: "2px solid #ff8c42"
        }}>
          🔧 CUENTA ADMINISTRADOR - UPLOADS ILIMITADOS
        </div>
      )}
      
      <div className="current-plan-info">
        <h3>{t('subscription.current_plan', { planName: getPlanName(currentPlan) })}</h3>
        <div className="usage-info">
          <div className="usage-text">
            <span>
              {isAdmin 
                ? `Uploads utilizados: ${userUsage} / Ilimitado` 
                : t('subscription.usage', { used: userUsage, total: displayQuota })
              }
            </span>
          </div>
          <div className="usage-bar-container">
            <div 
              className="usage-bar" 
              style={{ 
                width: `${usagePercentage}%`,
                backgroundColor: isAdmin ? "#4CAF50" : undefined
              }}
            ></div>
          </div>
        </div>
        
        {userPlan !== 'free' && !isAdmin && (
          <button 
            className="manage-subscription-button"
            onClick={handleManageSubscription}
          >
            {t('subscription.manage_button')}
          </button>
        )}
        
        {isAdmin && (
          <div style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#f0f8ff",
            borderRadius: "5px",
            fontSize: "14px",
            color: "#666"
          }}>
            <strong>Privilegios de Administrador:</strong><br/>
            • Uploads ilimitados de informes<br/>
            • Acceso completo a todas las funcionalidades<br/>
            • Sin restricciones de cuota
          </div>
        )}
      </div>
      
      <div className="plans-grid">
        {Object.values(PLANS).map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${userPlan === plan.id ? 'current-plan' : ''} ${isAdmin ? 'admin-user' : ''}`}
          >
            {userPlan === plan.id && (
              <div className="current-plan-badge">
                {t('subscription.current_plan_badge')}
              </div>
            )}
            <div className="plan-header">
              <h3 className="plan-name">{getPlanName(plan)}</h3>
              <div className="plan-price">
                {plan.price > 0 ? (
                  <>
                    <span className="price-amount">{plan.price}€</span>
                    <span className="price-period">{t('subscription.per_month')}</span>
                  </>
                ) : (
                  <span className="price-free">{t('subscription.plans.free.price')}</span>
                )}
              </div>
            </div>
            
            <div className="plan-features">
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>{t('subscription.features.chats', { quota: plan.quota })}</span>
              </div>
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>{t('subscription.features.stats')}</span>
              </div>
              <div className="plan-feature">
                <span className="feature-check">✓</span>
                <span>{t('subscription.features.psych')}</span>
              </div>
              {plan.id !== 'free' && (
                <div className="plan-feature">
                  <span className="feature-check">✓</span>
                  <span>{t('subscription.features.renewal')}</span>
                </div>
              )}
            </div>
            
            <div className="plan-action">
              {isAdmin ? (
                <button className="plan-button admin" disabled>
                  Administrador
                </button>
              ) : userPlan === plan.id ? (
                <button className="plan-button current" disabled>
                  {t('subscription.current_button')}
                </button>
              ) : plan.id === 'free' ? (
                <button 
                  className="plan-button"
                  disabled
                >
                  {t('subscription.free_button')}
                </button>
              ) : (
                <button 
                  className="plan-button"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {t('subscription.subscribe_button')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {userPlan === 'premium' && userUsage >= PLANS.PREMIUM.quota && !isAdmin && (
        <div className="quota-exceeded-message">
          {t('subscription.quota_exceeded')}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;