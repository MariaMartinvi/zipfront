// FreemiumPlans.js — página de precios: Gratis, Análisis IA y (en castellano) Juegos para fiestas.
// Solo información verdadera: sin cuentas atrás, stock ni cifras inventadas.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { purchaseAICredits, db } from './firebase_auth';
import { doc, getDoc } from 'firebase/firestore';
import './PricingPage.css';
import { getAiPackPricing, getPaymentHighlightKey, getPorraPricing } from './utils/pricing';

const FreemiumPlans = ({ userId }) => {
  const { t, i18n } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const esCastellano = (i18n.language || 'es').startsWith('es');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) { setIsLoading(false); return; }
      try {
        setIsLoading(true);
        const userDoc = await getDoc(doc(db, 'users', userId));
        setUserProfile(userDoc.exists() ? userDoc.data() : null);
      } catch (e) {
        setError(t('freemium.error_loading'));
      } finally {
        setIsLoading(false);
      }
    };
    loadUserProfile();
  }, [userId, t]);

  const handlePurchaseAI = async () => {
    if (!userId) { window.location.href = '/register'; return; }
    try {
      setIsPurchasing(true);
      setError('');
      await purchaseAICredits(userId);
    } catch (e) {
      setError(t('hero.ai_purchase.error_purchase'));
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) return <div className="precios-cargando">{t('freemium.loading')}</div>;

  const aiCredits = userProfile?.aiCredits || 0;
  const isAdmin = userProfile?.is_admin || false;
  const pack = getAiPackPricing();
  const juego = getPorraPricing();
  const avisoPago = getPaymentHighlightKey();

  const botonIA = () => {
    if (!userId) {
      return <button type="button" className="precios-boton" onClick={handlePurchaseAI}>{t('freemium.public.register_and_buy', pack)}</button>;
    }
    if (isAdmin) {
      return <button type="button" className="precios-boton" disabled>{t('freemium.ai_pack.admin_button')}</button>;
    }
    return (
      <button type="button" className="precios-boton" onClick={handlePurchaseAI} disabled={isPurchasing}>
        {isPurchasing ? t('freemium.ai_pack.processing') : t('freemium.ai_pack.purchase_button')}
      </button>
    );
  };

  return (
    <div className="precios">
      <header className="precios-cabecera">
        <h1>{t('freemium.header.title')}</h1>
        <p>{t('freemium.header.subtitle')}</p>
        {userId && (
          <p className="precios-creditos">
            {isAdmin ? t('freemium.stats.admin_account') : t('freemium.plans.your_credits', { count: aiCredits })}
          </p>
        )}
      </header>

      {error && <div className="precios-error">{error}</div>}

      <div className={`precios-tarjetas ${esCastellano ? 'tres' : 'dos'}`}>
        <section className="precios-tarjeta">
          <h2>{t('freemium.plans.free_title')}</h2>
          <div className="precios-precio">{t('freemium.plans.free_price')}</div>
          <ul>
            <li>{t('freemium.plans.free_f1')}</li>
            <li>{t('freemium.plans.free_f2')}</li>
            <li>{t('freemium.plans.free_f3')}</li>
          </ul>
          <Link to={userId ? '/' : '/register'} className="precios-boton secundario">{t('freemium.plans.free_button')}</Link>
        </section>

        <section className="precios-tarjeta destacada">
          <h2>{t('freemium.ai_pack.title')}</h2>
          <div className="precios-precio">{pack.price}<span>{t('freemium.ai_pack.analyses')}</span></div>
          <ul>
            <li>{t('freemium.ai_pack.features.psychological')}</li>
            <li>{t('freemium.ai_pack.features.personalities')}</li>
            <li>{t('freemium.ai_pack.features.group_dynamics')}</li>
            <li>{t('freemium.ai_pack.features.no_subscription')}</li>
          </ul>
          {botonIA()}
        </section>

        {esCastellano && (
          <section className="precios-tarjeta juegos">
            <h2>{t('freemium.plans.games_title')}</h2>
            <div className="precios-precio">{juego.price}<span>por juego y chat</span></div>
            <ul>
              <li>20 preguntas sobre vuestro grupo de WhatsApp</li>
              <li>Hoja de jugador y acta con las respuestas en PDF</li>
              <li>Ronda 1 con datos del chat, Ronda 2 con IA</li>
            </ul>
            <div className="precios-juegos">
              <Link to="/porra-halloween" className="precios-boton halloween">🎃 Halloween</Link>
              <Link to="/porra-navidad" className="precios-boton navidad">🎄 Navidad</Link>
            </div>
          </section>
        )}
      </div>

      <div className="precios-garantias">
        <span>{t('freemium.social_proof.trust_badges.secure_payment')}</span>
        <span>{t('freemium.social_proof.trust_badges.no_subscription')}</span>
        {avisoPago && <span>{t(avisoPago)}</span>}
      </div>

      <section className="precios-como">
        <h3>{t('freemium.how_it_works.title')}</h3>
        <div className="precios-pasos">
          {['step1', 'step2', 'step3'].map((paso) => (
            <div key={paso}>
              <h4>{t(`freemium.how_it_works.${paso}.title`)}</h4>
              <p>{t(`freemium.how_it_works.${paso}.description`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FreemiumPlans;
