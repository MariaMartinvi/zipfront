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
        setError(t('freemium.error_loading'));
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
    return <div className="subscription-loading">{t('freemium.loading')}</div>;
  }

  const aiCredits = userProfile?.aiCredits || 0;
  const isAdmin = userProfile?.is_admin || false;

  return (
    <div className="subscription-container">
      <div className="freemium-header">
        <h1>{t('freemium.header.title')}</h1>
        <p className="freemium-subtitle">
          {t('freemium.header.subtitle')}
        </p>
      </div>

      {error && <div className="subscription-error">{error}</div>}

      {/* Estado actual del usuario */}
      <div className="current-plan-info freemium-status">
        <div className="freemium-stats">
          <div className="stat-card">
            <h3>{t('freemium.stats.statistical_analysis')}</h3>
            <div className="stat-value">{t('freemium.stats.unlimited')}</div>
            <div className="stat-description">{t('freemium.stats.always_free')}</div>
          </div>
          
          <div className="stat-card">
            <h3>{t('freemium.stats.ai_credits')}</h3>
            <div className="stat-value">
              {isAdmin ? t('freemium.stats.unlimited') : aiCredits}
            </div>
            <div className="stat-description">
              {isAdmin ? t('freemium.stats.admin_account') : t('freemium.stats.ai_available')}
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
            {t('freemium.admin_badge')}
          </div>
        )}
      </div>

      {/* Sección de compra de IA */}
      <div className="ai-purchase-section">
        <div className="ai-pack-card">
          <div className="ai-pack-header">
            <h2>{t('freemium.ai_pack.title')}</h2>
            <div className="ai-pack-price">
              <span className="price-amount">{t('freemium.ai_pack.price')}</span>
              <span className="price-period">{t('freemium.ai_pack.analyses')}</span>
            </div>
          </div>
          
          <div className="ai-pack-features">
            <div className="ai-feature">
              <span className="feature-check">🧠</span>
              <span>{t('freemium.ai_pack.features.psychological')}</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">💬</span>
              <span>{t('freemium.ai_pack.features.personalities')}</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">📈</span>
              <span>{t('freemium.ai_pack.features.group_dynamics')}</span>
            </div>
            <div className="ai-feature">
              <span className="feature-check">💎</span>
              <span>{t('freemium.ai_pack.features.no_subscription')}</span>
            </div>
          </div>
          
          <div className="ai-pack-action">
            {isAdmin ? (
              <button className="ai-purchase-button admin" disabled>
                {t('freemium.ai_pack.admin_button')}
              </button>
            ) : (
              <button 
                className="ai-purchase-button"
                onClick={handlePurchaseAI}
                disabled={isPurchasing}
              >
                {isPurchasing ? t('freemium.ai_pack.processing') : t('freemium.ai_pack.purchase_button')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="freemium-info">
        <h3>{t('freemium.how_it_works.title')}</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>{t('freemium.how_it_works.step1.title')}</h4>
              <p>{t('freemium.how_it_works.step1.description')}</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon">🤖</div>
            <div className="info-content">
              <h4>{t('freemium.how_it_works.step2.title')}</h4>
              <p>{t('freemium.how_it_works.step2.description')}</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon">💰</div>
            <div className="info-content">
              <h4>{t('freemium.how_it_works.step3.title')}</h4>
              <p>{t('freemium.how_it_works.step3.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreemiumPlans;

