import React from 'react';
import './Pages.css';

const TermsOfService = () => {
  return (
    <div className="terms-of-service">
      <div className="tos-header">
        <h1>Términos de Servicio</h1>
        <p>Última actualización: Abril 2024</p>
      </div>

      <div className="tos-content">
        <section>
          <h2>1. Aceptación de Términos</h2>
          <p>Al acceder y utilizar nuestro servicio de análisis de conversaciones de WhatsApp, aceptas estos términos de servicio en su totalidad. Si no estás de acuerdo con alguno de estos términos, no debes utilizar nuestro servicio.</p>
        </section>

        <section>
          <h2>2. Descripción del Servicio</h2>
          <p>Proporcionamos una plataforma web que permite a los usuarios cargar y analizar conversaciones de WhatsApp exportadas como archivos ZIP, ofreciendo diversos insights y análisis estadísticos y de IA.</p>
        </section>

        <section>
          <h2>3. Uso del Servicio</h2>
          <ul>
            <li>Debes tener al menos 18 años para usar nuestro servicio.</li>
            <li>Eres responsable de mantener la confidencialidad de tu cuenta.</li>
            <li>Te comprometes a no utilizar el servicio para actividades ilegales o no autorizadas.</li>
          </ul>
        </section>

        <section>
          <h2>4. Privacidad y Datos</h2>
          <p>Nos comprometemos a proteger tu privacidad. Los archivos que subes son procesados temporalmente y eliminados automáticamente después del análisis. Consulta nuestra Política de Privacidad para más detalles.</p>
        </section>

        <section>
          <h2>5. Derechos de Propiedad Intelectual</h2>
          <p>Todo el contenido, características y funcionalidad de nuestro servicio son propiedad nuestra y están protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.</p>
        </section>

        <section>
          <h2>6. Limitación de Responsabilidad</h2>
          <p>Nuestro servicio se proporciona "tal cual", sin garantías de ningún tipo. No nos hacemos responsables de ningún daño directo, indirecto, incidental o consecuencial derivado del uso de nuestro servicio.</p>
        </section>

        <section>
          <h2>7. Modificaciones del Servicio</h2>
          <p>Nos reservamos el derecho de modificar o interrumpir el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante ti o cualquier tercero por cualquier modificación, suspensión o interrupción del servicio.</p>
        </section>

        <section>
          <h2>8. Planes y Suscripciones</h2>
          <p>Ofrecemos planes gratuitos y de pago. Los términos específicos de cada plan, incluyendo precios, características y límites de uso, se detallan en nuestra página de planes.</p>
        </section>

        <section>
          <h2>9. Terminación</h2>
          <p>Podemos terminar o suspender tu cuenta y acceso al servicio inmediatamente, sin previo aviso ni responsabilidad, por cualquier razón, incluido el incumplimiento de estos términos.</p>
        </section>

        <section>
          <h2>10. Ley Aplicable</h2>
          <p>Estos términos se regirán e interpretarán de acuerdo con las leyes de España, sin consideración a sus principios de conflicto de leyes.</p>
        </section>

        <section>
          <h2>11. Contacto</h2>
          <p>Si tienes alguna pregunta sobre estos términos, por favor <a href="/contact">contáctanos</a>.</p>
        </section>
      </div>

      <div className="tos-footer">
        <p>Al continuar usando nuestro servicio, aceptas estos términos de servicio.</p>
      </div>
    </div>
  );
};

export default TermsOfService;