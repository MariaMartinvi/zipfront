import React from 'react';
import '../AppPreview.css';

const PoliticaCookies = () => {
  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">Política de Cookies</h1>
            <p className="hero-description">Última actualización: Diciembre 2024</p>
            <p className="hero-description">
              Información sobre cómo utilizamos las cookies en nuestro sitio web para mejorar tu experiencia de navegación.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">POLÍTICA DE COOKIES</span>
          <h2 className="features-title">Gestión de Cookies</h2>
          <p className="features-description">
            Conoce qué cookies utilizamos, para qué las usamos y cómo puedes gestionar tus preferencias.
          </p>
          
          <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '40px' }}>
            
            {/* What are cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🍪</span>
              </div>
              <h3>¿Qué son las cookies?</h3>
              <p style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web. 
                Estas cookies nos ayudan a mejorar tu experiencia de navegación y proporcionarte un servicio más personalizado.
              </p>
            </div>

            {/* Types of cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📋</span>
              </div>
              <h3>Tipos de cookies que utilizamos</h3>
              
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>Cookies estrictamente necesarias</h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar. Incluyen:</p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>Firebase Auth:</strong> Autenticación de usuario y gestión de sesiones</li>
                  <li style={{ marginBottom: '8px' }}><strong>Stripe:</strong> Procesamiento seguro de pagos y prevención de fraude</li>
                  <li style={{ marginBottom: '8px' }}><strong>Workbox PWA:</strong> Funcionalidad de aplicación web progresiva y cache offline</li>
                  <li style={{ marginBottom: '8px' }}><strong>Cookies de consentimiento:</strong> Recordar tus preferencias de cookies</li>
                </ul>
                
                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>Cookies analíticas</h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>Utilizadas para entender cómo interactúas con nuestro sitio web. Incluyen:</p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>Google Analytics (GTM):</strong> Estadísticas de uso y comportamiento</li>
                  <li style={{ marginBottom: '8px' }}><strong>Microsoft Clarity:</strong> Análisis de comportamiento y mapas de calor (si está habilitado)</li>
                  <li style={{ marginBottom: '8px' }}><strong>Métricas internas:</strong> Para mejorar el servicio de análisis de chats</li>
                </ul>

                <h4 style={{ color: '#E91E63', marginBottom: '15px', fontSize: '20px' }}>Cookies de marketing</h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>Utilizadas para personalizar la publicidad y medir su efectividad. Incluyen:</p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>Google Ads:</strong> Publicidad personalizada y remarketing</li>
                  <li style={{ marginBottom: '8px' }}><strong>Facebook Pixel:</strong> Tracking de conversiones y audiencias personalizadas</li>
                  <li style={{ marginBottom: '8px' }}><strong>TikTok Pixel:</strong> Seguimiento de conversiones de TikTok Ads</li>
                </ul>

                <h4 style={{ color: '#FF9800', marginBottom: '15px', fontSize: '20px' }}>Cookies de funcionalidad</h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>Permiten recordar tus configuraciones para ofrecerte una experiencia personalizada. Incluyen:</p>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>Preferencias de idioma:</strong> Recordar tu idioma seleccionado</li>
                  <li style={{ marginBottom: '8px' }}><strong>Configuraciones de interfaz:</strong> Tema, layout y preferencias de visualización</li>
                  <li style={{ marginBottom: '8px' }}><strong>Datos de usuario:</strong> Información no sensible para personalizar la experiencia</li>
                </ul>
              </div>
            </div>

            {/* Specific cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🔍</span>
              </div>
              <h3>Cookies específicas que utilizamos</h3>
              
              <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ffeaa7' }}>
                <p style={{ margin: '0', fontSize: '18px', color: '#856404', lineHeight: '1.6' }}>
                  <strong>⚠️ Nota importante:</strong> La lista siguiente incluye todas las cookies que <em>pueden</em> generarse según los servicios configurados. 
                  Las cookies específicas que se instalan en tu dispositivo dependen de tus preferencias de consentimiento, 
                  los servicios activos y tu configuración de navegador.
                </p>
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>Cookies propias:</h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '12px' }}><strong>cookieConsent:</strong> Almacena si has aceptado el uso de cookies (1 año)</li>
                  <li style={{ marginBottom: '12px' }}><strong>cookiePreferences:</strong> Guarda tus preferencias específicas por categoría de cookies (1 año)</li>
                  <li style={{ marginBottom: '12px' }}><strong>cookieConsentDate:</strong> Fecha en que diste tu consentimiento para cookies (1 año)</li>
                </ul>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>Cookies de terceros - Google Tag Manager:</h4>
                <p style={{ fontStyle: 'italic', marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>Las siguientes cookies solo se generan si los tags correspondientes están activos en GTM:</p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>_ga:</strong> Cookie principal de Google Analytics (2 años)</li>
                  <li style={{ marginBottom: '8px' }}><strong>_ga_[ID]:</strong> Cookie de Google Analytics 4 (2 años)</li>
                  <li style={{ marginBottom: '8px' }}><strong>_gid:</strong> Cookie de Google Analytics (24 horas)</li>
                  <li style={{ marginBottom: '8px' }}><strong>_fbp:</strong> Cookie de Facebook Pixel (90 días)</li>
                  <li style={{ marginBottom: '8px' }}><strong>_ttp:</strong> Cookie de TikTok Pixel (13 meses)</li>
                </ul>

                <h4 style={{ color: '#FF5722', marginBottom: '15px', fontSize: '20px' }}>Cookies de Firebase y Stripe:</h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}><strong>firebase-heartbeat-store:</strong> Conexión con Firebase</li>
                  <li style={{ marginBottom: '8px' }}><strong>__stripe_mid:</strong> Detección de fraude de Stripe (1 año)</li>
                  <li style={{ marginBottom: '8px' }}><strong>__stripe_sid:</strong> Sesión de Stripe (30 minutos)</li>
                </ul>
              </div>
            </div>

            {/* Cookie management */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">⚙️</span>
              </div>
              <h3>Gestión de cookies</h3>
              <div style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>Puedes controlar y gestionar las cookies de varias maneras:</p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '12px' }}>A través de nuestro banner de cookies al visitar el sitio</li>
                  <li style={{ marginBottom: '12px' }}>Configurando tu navegador para bloquear o eliminar cookies</li>
                  <li style={{ marginBottom: '12px' }}>Utilizando las opciones de privacidad de tu dispositivo</li>
                </ul>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>Configuración del navegador:</h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '12px' }}><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                  <li style={{ marginBottom: '12px' }}><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                  <li style={{ marginBottom: '12px' }}><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                  <li style={{ marginBottom: '12px' }}><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                </ul>
              </div>
            </div>

            {/* Retention and deletion */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🗂️</span>
              </div>
              <h3>Retención y eliminación de cookies</h3>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>Tiempo de retención:</h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '12px' }}><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
                  <li style={{ marginBottom: '12px' }}><strong>Cookies temporales:</strong> Entre 30 minutos y 24 horas</li>
                  <li style={{ marginBottom: '12px' }}><strong>Cookies de análisis:</strong> Hasta 2 años (Google Analytics)</li>
                  <li style={{ marginBottom: '12px' }}><strong>Cookies de preferencias:</strong> 1 año</li>
                  <li style={{ marginBottom: '12px' }}><strong>Cookies de autenticación:</strong> Hasta 2 años</li>
                </ul>

                <h4 style={{ color: '#DC2626', marginBottom: '15px', fontSize: '20px' }}>Cómo eliminar todas las cookies:</h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '12px' }}>Desde nuestro sitio: Revoca tu consentimiento en el banner de cookies</li>
                  <li style={{ marginBottom: '12px' }}>Desde tu navegador: Elimina cookies específicas de "chatsalsa.com"</li>
                  <li style={{ marginBottom: '12px' }}>Modo incógnito: Las cookies se eliminan automáticamente al cerrar</li>
                  <li style={{ marginBottom: '12px' }}>Configuración automática: Configura tu navegador para eliminar cookies al salir</li>
                </ul>
              </div>
            </div>

            {/* Updates and contact */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📞</span>
              </div>
              <h3>Actualizaciones y contacto</h3>
              <div style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>
                  Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en nuestras prácticas o por razones legales. 
                  Te notificaremos de cualquier cambio importante.
                </p>
                <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  Si tienes alguna pregunta sobre nuestra Política de Cookies, por favor{' '}
                  <a href="/contact" className="privacy-link">contáctanos</a>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Notice */}
      <section className="process-section">
        <div className="process-container">
          <div className="feature-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="feature-icon-new gradient-bg rotate-left">
              <span className="feature-icon-large">🍪</span>
            </div>
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>Consentimiento de Cookies</h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6' }}>
              Al continuar usando nuestro sitio web, aceptas el uso de cookies según se describe en esta política.
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">🍪</span>
          <span className="security-text">Cookies Transparentes</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
    </div>
  );
};

export default PoliticaCookies; 