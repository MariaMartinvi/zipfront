import React from 'react';
import './Pages.css';

const PoliticaCookies = () => {
  return (
    <div className="terms-of-service">
      <div className="tos-header">
        <h1>Política de Cookies</h1>
        <p>Última actualización: Diciembre 2024</p>
      </div>

      <div className="tos-content">
        <section>
          <h2>1. ¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web. Estas cookies nos ayudan a mejorar tu experiencia de navegación y proporcionarte un servicio más personalizado.</p>
        </section>

        <section>
          <h2>2. Tipos de cookies que utilizamos</h2>
          <h3>Cookies estrictamente necesarias</h3>
          <p>Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar. Incluyen:</p>
          <ul>
            <li><strong>Firebase Auth:</strong> Autenticación de usuario y gestión de sesiones</li>
            <li><strong>Stripe:</strong> Procesamiento seguro de pagos y prevención de fraude</li>
            <li><strong>Workbox PWA:</strong> Funcionalidad de aplicación web progresiva y cache offline</li>
            <li><strong>Cookies de consentimiento:</strong> Recordar tus preferencias de cookies</li>
          </ul>
          
          <h3>Cookies analíticas</h3>
          <p>Utilizadas para entender cómo interactúas con nuestro sitio web. Incluyen:</p>
          <ul>
            <li><strong>Google Analytics (GTM):</strong> Estadísticas de uso y comportamiento</li>
            <li><strong>Microsoft Clarity:</strong> Análisis de comportamiento y mapas de calor (si está habilitado)</li>
            <li><strong>Métricas internas:</strong> Para mejorar el servicio de análisis de chats</li>
          </ul>
          
          <h3>Cookies de marketing</h3>
          <p>Utilizadas para personalizar la publicidad y medir su efectividad. Incluyen:</p>
          <ul>
            <li><strong>Google Ads:</strong> Publicidad personalizada y remarketing</li>
            <li><strong>Facebook Pixel:</strong> Tracking de conversiones y audiencias personalizadas</li>
            <li><strong>TikTok Pixel:</strong> Seguimiento de conversiones de TikTok Ads</li>
          </ul>
          
          <h3>Cookies de funcionalidad</h3>
          <p>Permiten recordar tus configuraciones para ofrecerte una experiencia personalizada. Incluyen:</p>
          <ul>
            <li><strong>Preferencias de idioma:</strong> Recordar tu idioma seleccionado</li>
            <li><strong>Configuraciones de interfaz:</strong> Tema, layout y preferencias de visualización</li>
            <li><strong>Datos de usuario:</strong> Información no sensible para personalizar la experiencia</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies específicas que utilizamos</h2>
          <div className="cookie-important-note">
            <p><strong>⚠️ Nota importante:</strong> La lista siguiente incluye todas las cookies que <em>pueden</em> generarse según los servicios configurados. Las cookies específicas que se instalan en tu dispositivo dependen de:</p>
            <ul>
              <li>Tus preferencias de consentimiento de cookies</li>
              <li>Los servicios que estén activos en ese momento</li>
              <li>Tu configuración de navegador</li>
            </ul>
          </div>
          
          <h3>Cookies propias:</h3>
          <ul>
            <li><strong>cookieConsent</strong>: Almacena si has aceptado el uso de cookies (1 año)</li>
            <li><strong>cookiePreferences</strong>: Guarda tus preferencias específicas por categoría de cookies (1 año)</li>
            <li><strong>cookieConsentDate</strong>: Fecha en que diste tu consentimiento para cookies (1 año)</li>
          </ul>
          
          <h3>Cookies de terceros - Google Tag Manager (GTM-P4PTW3CH):</h3>
          <p><em>Las siguientes cookies solo se generan si los tags correspondientes están activos en GTM:</em></p>
          <ul>
            <li><strong>_ga</strong>: Cookie principal de Google Analytics para distinguir usuarios únicos (2 años)*</li>
            <li><strong>_ga_[ID]</strong>: Cookie de Google Analytics 4 para mantener el estado de sesión (2 años)*</li>
            <li><strong>_gid</strong>: Cookie de Google Analytics para distinguir usuarios únicos (24 horas)*</li>
            <li><strong>_gat_gtag_[ID]</strong>: Cookie para limitar velocidad de solicitudes a Google Analytics (1 minuto)*</li>
            <li><strong>_gcl_au</strong>: Cookie del Conversion Linker para atribuir conversiones (90 días)**</li>
            <li><strong>_gcl_aw</strong>: Cookie de Google Ads para tracking de conversiones (90 días)***</li>
            <li><strong>_gcl_dc</strong>: Cookie de Google DoubleClick para remarketing (90 días)***</li>
            <li><strong>_fbp</strong>: Cookie de Facebook Pixel para tracking de conversiones (90 días)***</li>
            <li><strong>_ttp</strong>: Cookie de TikTok Pixel para tracking de conversiones (13 meses)***</li>
          </ul>
          <p><em>* Solo se activan si tienes habilitadas las cookies de análisis</em></p>
          <p><em>** Se activa automáticamente con el Conversion Linker (cookie necesaria)</em></p>
          <p><em>*** Solo se activan si tienes habilitadas las cookies de marketing</em></p>
          
          <h3>Cookies de Firebase (Autenticación y Base de Datos):</h3>
          <ul>
            <li><strong>firebase-heartbeat-store</strong>: Para mantener la conexión con Firebase (localStorage)</li>
            <li><strong>firebase-installations-store</strong>: Identificador único de instalación de Firebase (localStorage)</li>
            <li><strong>__session</strong>: Cookie de sesión de Firebase (sesión del navegador)</li>
            <li><strong>__Secure-3PSIDCC</strong>: Cookie de seguridad de Google para autenticación (1 año)</li>
            <li><strong>__Secure-3PAPISID</strong>: Cookie de autenticación de Google APIs (2 años)</li>
            <li><strong>SAPISID</strong>: Cookie de autorización de Google APIs (2 años)</li>
          </ul>
          
          <h3>Cookies de Stripe (Procesamiento de Pagos):</h3>
          <ul>
            <li><strong>__stripe_mid</strong>: Identificador único para detección de fraude (1 año)</li>
            <li><strong>__stripe_sid</strong>: Cookie de sesión de Stripe para el proceso de pago (30 minutos)</li>
            <li><strong>cid</strong>: Cookie de identificación de cliente de Stripe (1 año)</li>
            <li><strong>__stripe_timestamp</strong>: Timestamp para análisis de Stripe (sesión)</li>
          </ul>
          
          <h3>Cookies de Azure OpenAI/Microsoft:</h3>
          <ul>
            <li><strong>MUID</strong>: Identificador único de Microsoft (1 año)</li>
            <li><strong>_clck</strong>: Cookie de Microsoft Clarity para análisis de comportamiento (1 año)**</li>
            <li><strong>_clsk</strong>: Cookie de sesión de Microsoft Clarity (1 día)**</li>
          </ul>
          
          <h3>Cookies del navegador y PWA (Workbox):</h3>
          <ul>
            <li><strong>workbox-*</strong>: Cookies de cache del Service Worker para funcionalidad offline (varía)</li>
            <li><strong>localStorage items</strong>: Preferencias de usuario, datos de sesión locales</li>
            <li><strong>sessionStorage items</strong>: Datos temporales de navegación (sesión del navegador)</li>
            <li><strong>indexedDB</strong>: Base de datos local para cache offline y datos temporales</li>
          </ul>
          
          <p><em>* Las cookies de Facebook y TikTok solo se activan si tienes habilitadas las cookies de marketing</em></p>
          <p><em>** Las cookies de Microsoft Clarity solo se activan si tienes habilitadas las cookies de análisis</em></p>
        </section>

        <section>
          <h2>4. Gestión de cookies</h2>
          <p>Puedes controlar y gestionar las cookies de varias maneras:</p>
          <ul>
            <li>A través de nuestro banner de cookies al visitar el sitio</li>
            <li>Configurando tu navegador para bloquear o eliminar cookies</li>
            <li>Utilizando las opciones de privacidad de tu dispositivo</li>
          </ul>
        </section>

        <section>
          <h2>5. Configuración del navegador</h2>
          <p>Instrucciones para gestionar cookies en los navegadores más comunes:</p>
          <ul>
            <li><strong>Chrome</strong>: Configuración &gt; Privacidad y seguridad &gt; Cookies</li>
            <li><strong>Firefox</strong>: Opciones &gt; Privacidad y seguridad &gt; Cookies</li>
            <li><strong>Safari</strong>: Preferencias &gt; Privacidad &gt; Cookies</li>
            <li><strong>Edge</strong>: Configuración &gt; Cookies y permisos del sitio</li>
          </ul>
        </section>

        <section>
          <h2>6. Retención y eliminación de cookies</h2>
          <h3>Tiempo de retención:</h3>
          <ul>
            <li><strong>Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
            <li><strong>Cookies temporales:</strong> Entre 30 minutos y 24 horas</li>
            <li><strong>Cookies de análisis:</strong> Hasta 2 años (Google Analytics)</li>
            <li><strong>Cookies de preferencias:</strong> 1 año</li>
            <li><strong>Cookies de autenticación:</strong> Hasta 2 años</li>
          </ul>
          
          <h3>Cómo eliminar todas las cookies:</h3>
          <ul>
            <li>Desde nuestro sitio: Revoca tu consentimiento en el banner de cookies</li>
            <li>Desde tu navegador: Elimina cookies específicas de "chatsalsa.com"</li>
            <li>Modo incógnito: Las cookies se eliminan automáticamente al cerrar</li>
            <li>Configuración automática: Configura tu navegador para eliminar cookies al salir</li>
          </ul>
        </section>

        <section>
          <h2>7. Cookies y análisis de datos</h2>
          <p>Las cookies analíticas nos ayudan a entender cómo utilizas nuestro servicio de análisis de conversaciones de WhatsApp, pero nunca accedemos al contenido real de tus conversaciones a través de estas cookies.</p>
        </section>

        <section>
          <h2>8. Actualizaciones de esta política</h2>
          <p>Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en nuestras prácticas o por razones legales. Te notificaremos de cualquier cambio importante.</p>
        </section>

        <section>
          <h2>9. Contacto</h2>
          <p>Si tienes alguna pregunta sobre nuestra Política de Cookies, por favor <a href="/contact">contáctanos</a>.</p>
        </section>
      </div>

      <div className="tos-footer">
        <p>Al continuar usando nuestro sitio web, aceptas el uso de cookies según se describe en esta política.</p>
      </div>
    </div>
  );
};

export default PoliticaCookies; 