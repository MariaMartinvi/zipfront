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
  
  // 🔥 URGENCIA: Estados para countdown y escasez
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [stockLeft, setStockLeft] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState(0);
  
  // 🎯 SOCIAL PROOF: Estados para métricas de conversión
  const [socialProofData, setSocialProofData] = useState({
    totalUsers: 0,
    monthlyAnalyses: 0,
    dailyAnalyses: 0,
    satisfactionRating: 4.8
  });

  // Cargar perfil del usuario directamente desde Firestore (solo si está logueado)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) {
        // Usuario no logueado - mostrar pricing público
        setIsLoading(false);
        return;
      }
      
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

  // 🔥 URGENCIA: Inicializar y mantener countdown de 24h
  useEffect(() => {
    const initializeUrgency = () => {
      const now = new Date().getTime();
      const today = new Date().toDateString();
      
      // Verificar si ya hay datos de hoy en localStorage
      const savedDate = localStorage.getItem('urgency_date');
      const savedEndTime = localStorage.getItem('urgency_end_time');
      const savedStock = localStorage.getItem('urgency_stock');
      const savedPurchases = localStorage.getItem('urgency_purchases');
      
      let endTime;
      
      if (savedDate === today && savedEndTime) {
        // Usar datos existentes del día
        endTime = parseInt(savedEndTime);
        setStockLeft(parseInt(savedStock) || 7);
        setRecentPurchases(parseInt(savedPurchases) || 3);
      } else {
        // Nuevo día - generar nuevos datos
        endTime = now + (24 * 60 * 60 * 1000); // 24 horas desde ahora
        const newStock = Math.floor(Math.random() * 8) + 5; // 5-12
        const newPurchases = Math.floor(Math.random() * 8) + 1; // 1-8
        
        localStorage.setItem('urgency_date', today);
        localStorage.setItem('urgency_end_time', endTime.toString());
        localStorage.setItem('urgency_stock', newStock.toString());
        localStorage.setItem('urgency_purchases', newPurchases.toString());
        
        setStockLeft(newStock);
        setRecentPurchases(newPurchases);
      }
      
      // Función para actualizar el countdown cada segundo
      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTimeLeft({ hours, minutes, seconds });
        } else {
          // Tiempo expirado - generar nuevo countdown
          initializeUrgency();
        }
      };
      
      updateCountdown();
      return setInterval(updateCountdown, 1000);
    };
    
    const interval = initializeUrgency();
    return () => clearInterval(interval);
  }, []);

  // 🎯 SOCIAL PROOF: Inicializar métricas de conversión
  useEffect(() => {
    const initializeSocialProof = () => {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('social_proof_date');
      
      if (savedDate === today) {
        // Usar datos guardados del día
        const savedData = {
          totalUsers: parseInt(localStorage.getItem('social_proof_users')) || 15847,
          monthlyAnalyses: parseInt(localStorage.getItem('social_proof_monthly')) || 2341,
          dailyAnalyses: parseInt(localStorage.getItem('social_proof_daily')) || 47,
          satisfactionRating: 4.8
        };
        setSocialProofData(savedData);
      } else {
        // Nuevo día - generar nuevos números creíbles
        const baseUsers = 15800 + Math.floor(Math.random() * 100); // 15800-15900
        const monthlyAnalyses = 2300 + Math.floor(Math.random() * 100); // 2300-2400
        const dailyAnalyses = 40 + Math.floor(Math.random() * 20); // 40-60
        
        const newData = {
          totalUsers: baseUsers,
          monthlyAnalyses: monthlyAnalyses,
          dailyAnalyses: dailyAnalyses,
          satisfactionRating: 4.8
        };
        
        // Guardar en localStorage
        localStorage.setItem('social_proof_date', today);
        localStorage.setItem('social_proof_users', newData.totalUsers.toString());
        localStorage.setItem('social_proof_monthly', newData.monthlyAnalyses.toString());
        localStorage.setItem('social_proof_daily', newData.dailyAnalyses.toString());
        
        setSocialProofData(newData);
      }
    };
    
    initializeSocialProof();
  }, []);

  // Manejar compra de créditos IA
  const handlePurchaseAI = async () => {
    // Si no está logueado, redirigir al registro
    if (!userId) {
      window.location.href = '/register';
      return;
    }
    
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

      {/* Estado actual del usuario o promoción para no logueados */}
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
              {!userId ? '?' : (isAdmin ? t('freemium.stats.unlimited') : aiCredits)}
            </div>
            <div className="stat-description">
              {!userId 
                ? t('freemium.public.register_to_see') 
                : (isAdmin ? t('freemium.stats.admin_account') : t('freemium.stats.ai_available'))
              }
            </div>
          </div>
        </div>

        {!userId && (
          <div className="public-cta-banner" style={{
            background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
            border: "2px solid #2196f3",
            borderRadius: "16px",
            padding: "20px",
            marginTop: "20px",
            textAlign: "center"
          }}>
            <h4 style={{ color: "#1565c0", marginBottom: "10px", fontSize: "1.2rem" }}>
              ✨ {t('freemium.public.cta_title')}
            </h4>
            <p style={{ color: "#1976d2", marginBottom: "15px" }}>
              {t('freemium.public.cta_description')}
            </p>
            <button 
              onClick={() => window.location.href = '/register'}
              style={{
                background: "linear-gradient(135deg, #2196f3, #1976d2)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {t('freemium.public.register_button')}
            </button>
          </div>
        )}

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
            <div className="discount-badge">
              {t('freemium.ai_pack.discount_badge')} {t('freemium.ai_pack.discount_percentage')}
            </div>
            <h2>{t('freemium.ai_pack.title')}</h2>
            <div className="ai-pack-price">
              <div className="price-comparison">
                <span className="original-price">{t('freemium.ai_pack.original_price')}</span>
                <span className="current-price">{t('freemium.ai_pack.price')}</span>
              </div>
              <span className="price-period">{t('freemium.ai_pack.analyses')}</span>
              <div className="limited-time-notice">
                {t('freemium.ai_pack.limited_time')}
              </div>
            </div>
            
            {/* 🔥 URGENCIA: Countdown y escasez */}
            <div className="urgency-section">
              <div className="countdown-timer">
                <span className="countdown-label">{t('freemium.urgency.countdown_label')}</span>
                <span className="countdown-time">
                  {timeLeft.hours}{t('freemium.urgency.hours')} {timeLeft.minutes}{t('freemium.urgency.minutes')} {timeLeft.seconds}{t('freemium.urgency.seconds')}
                </span>
              </div>
              <div className="stock-urgency">
                {t('freemium.urgency.stock_limited', { count: stockLeft })}
              </div>
              <div className="recent-purchases">
                {t('freemium.urgency.recent_purchases', { count: recentPurchases })}
              </div>
            </div>
            
            <div className="full-analysis-notice">
              {t('freemium.ai_pack.full_analysis_note')}
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
            {!userId ? (
              <button 
                className="ai-purchase-button"
                onClick={handlePurchaseAI}
              >
                {t('freemium.public.register_and_buy')}
              </button>
            ) : isAdmin ? (
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

      {/* 🎯 SOCIAL PROOF: Métricas de conversión */}
      <div className="social-proof-section">
        {/* Contador de usuarios */}
        <div className="users-counter">
          {t('freemium.social_proof.users_count', { count: socialProofData.totalUsers.toLocaleString() })}
        </div>
        
        {/* Estadísticas de rendimiento */}
        <div className="performance-stats">
          <div className="stat-item">
            {t('freemium.social_proof.analyses_completed', { count: socialProofData.monthlyAnalyses.toLocaleString() })}
          </div>
          <div className="stat-item">
            {t('freemium.social_proof.satisfaction_rating', { rating: socialProofData.satisfactionRating })}
          </div>
          <div className="stat-item">
            {t('freemium.social_proof.daily_analyses', { count: socialProofData.dailyAnalyses })}
          </div>
        </div>
        
        {/* Badges de confianza */}
        <div className="trust-badges">
          <div className="trust-badge">
            {t('freemium.social_proof.trust_badges.secure_payment')}
          </div>
          <div className="trust-badge">
            {t('freemium.social_proof.trust_badges.satisfaction_guarantee')}
          </div>
          <div className="trust-badge">
            {t('freemium.social_proof.trust_badges.instant_analysis')}
          </div>
          <div className="trust-badge">
            {t('freemium.social_proof.trust_badges.no_subscription')}
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

