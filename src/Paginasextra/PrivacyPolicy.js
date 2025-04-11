import React from 'react';
import './Pages.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <div className="privacy-header">
        <h1>Política de Privacidad</h1>
        <p>Última actualización: Abril 2024</p>
      </div>

      <div className="privacy-content">
        <section>
          <h2>1. Información que Recopilamos</h2>
          <p>Recopilamos la información que nos proporcionas directamente:</p>
          <ul>
            <li>Datos de registro: nombre, correo electrónico, contraseña</li>
            <li>Archivos de chat de WhatsApp que subes para análisis</li>
            <li>Información de pago para suscripciones</li>
          </ul>
        </section>

        <section>
          <h2>2. Cómo Usamos tu Información</h2>
          <ul>
            <li>Proporcionar y mejorar nuestro servicio de análisis de conversaciones</li>
            <li>Procesar tus solicitudes de análisis</li>
            <li>Comunicarnos contigo sobre tu cuenta o servicio</li>
            <li>Enviar actualizaciones y comunicaciones relacionadas con el servicio</li>
          </ul>
        </section>

        <section>
          <h2>3. Protección de Datos</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal:</p>
          <ul>
            <li>Encriptación de datos sensibles</li>
            <li>Eliminación automática de archivos después del análisis</li>
            <li>Acceso restringido a información personal</li>
          </ul>
        </section>

        <section>
          <h2>4. Eliminación de Datos</h2>
          <p>Nos comprometemos a:</p>
          <ul>
            <li>Eliminar automáticamente los archivos de chat después de su análisis</li>
            <li>No almacenar el contenido de tus conversaciones</li>
            <li>Permitirte eliminar tu cuenta y datos en cualquier momento</li>
          </ul>
        </section>

        <section>
          <h2>5. Compartir Información</h2>
          <p>No vendemos ni compartimos tu información personal con terceros. Podemos compartir información agregada y anónima con fines de investigación o mejora del servicio.</p>
        </section>

        <section>
          <h2>6. Cookies y Tecnologías de Seguimiento</h2>
          <p>Utilizamos cookies y tecnologías similares para:</p>
          <ul>
            <li>Mejorar la experiencia de usuario</li>
            <li>Analizar el tráfico del sitio</li>
            <li>Recordar tus preferencias</li>
          </ul>
        </section>

        <section>
          <h2>7. Derechos del Usuario</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li>Acceder a tu información personal</li>
            <li>Solicitar la corrección de datos inexactos</li>
            <li>Solicitar la eliminación de tu cuenta y datos</li>
          </ul>
        </section>

        <section>
          <h2>8. Contacto</h2>
          <p>Si tienes preguntas sobre esta política de privacidad, puedes <a href="/contact">contactarnos</a>.</p>
        </section>
      </div>

      <div className="privacy-footer">
        <p>Al continuar usando nuestro servicio, aceptas esta política de privacidad.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;