// FreemiumPlans.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { purchaseAICredits } from './firebase_auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase_auth';
import './SubscriptionPlans.css';

const FreemiumPlans = ({ userId }) => {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Cargar perfil del usuario directamente desde Firestore
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        // Consulta directa a Firestore (igual que canUseAI)
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          console.log('Usuario no encontrado en Firestore');
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Error cargando datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  // Manejar compra de créditos IA
  const handlePurchaseAI = async () => {
    try {
      setIsPurchasing(true);
      setError('');
      await purchaseAICredits(userId);
    } catch (error) {
      console.error('Error purchasing AI credits:', error);
      setError(t('hero.ai_purchase.error_purchase'));
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return <div className="subscription-loading">Cargando...</div>;
  }

  const aiCredits = userProfile?.aiCredits || 0;
  const isAdmin = userProfile?.is_admin || false;

  return (
    <div className="subscription-container">
      <div className="freemium-header">
        <h1>🎉 ChatSalsa es GRATIS</h1>
        <p className="freemium-subtitle">
          Análisis estadísticos ilimitados • Solo paga por la IA cuando la necesites
        </p>
      </div>

      {error && <div className="subscription-error">{error}</div>}

      {/* Estado actual del usuario */}
      <div className="current-plan-info freemium-status">
        <div className="freemium-stats">
          <div className="stat-card">
            <h3>📊 Análisis Estadísticos</h3>
            <div className="stat-value">ILIMITADOS</div>
            <div className="stat-description">Siempre gratis</div>
          </div>
          
          <div className="stat-card">
            <h3>🤖 Créditos de IA</h3>
            <div className="stat-value">
              {isAdmin ? 'ILIMITADOS' : aiCredits}
            </div>
            <div className="stat-description">
              {isAdmin ? 'Cuenta administrador' : 'Análisis IA disponibles'}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="admin-badge" style={{
            backgroundColor: "#ff6b35",
            color: "white",
            padding: "15px",
            borderRadius: "8px",
            marginTop: "20px",
            textAlign: "center",
            fontWeight: "bold",
            border: "2px solid #ff8c42"
          }}>
            🔧 CUENTA ADMINISTRADOR - ACCESO COMPLETO
          </div>
        )}
      </div>

      {/* Sección de compra de IA */}
      <div className="ai-purchase-section">
        <div className="ai-pack-card">
          <div className="ai-pack-header">
            <h2>🤖 Pack Análisis IA</h2>
            <div className="ai-pack-price">
              <span className="price-amount">5€</span>
              <span className="price-period">10 análisis</span>
            </div>
          </div>
          
          <div className="ai-pack-features">
            <div className="ai-feature">
              <span className="feature-check">🧠</span>
              <span>Análisis psicológico completo</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">💬</span>
              <span>Personalidades de cada participante</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">📈</span>
              <span>Dinámicas de grupo detalladas</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">💎</span>
              <span>Sin suscripción - Pago único</span>
            </div>
          </div>
          
          <div className="ai-pack-action">
            {isAdmin ? (
              <button className="ai-purchase-button admin" disabled>
                Acceso Administrador
              </button>
            ) : (
              <button 
                className="ai-purchase-button"
                onClick={handlePurchaseAI}
                disabled={isPurchasing}
              >
                {isPurchasing ? '⏳ Procesando...' : '🔓 Comprar Pack IA (5€)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="freemium-info">
        <h3>💡 ¿Cómo funciona?</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>1. Análisis Gratis</h4>
              <p>Sube tu chat y obtén estadísticas completas sin límites</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon">🤖</div>
            <div className="info-content">
              <h4>2. IA Opcional</h4>
              <p>Compra créditos solo cuando quieras análisis psicológico profundo</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon">💰</div>
            <div className="info-content">
              <h4>3. Sin Suscripción</h4>
              <p>Pago único por pack - Sin compromisos mensuales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreemiumPlans;

