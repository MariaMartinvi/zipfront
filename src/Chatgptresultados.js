import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import { useTranslation } from 'react-i18next';
import './Chatgptresultados.css';

function Chatgptresultados({ chatGptResponse }) {
  const { t, i18n } = useTranslation();
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (chatGptResponse) {
      // Configurar marked para procesar correctamente los emojis
      marked.setOptions({
        breaks: true,  // Interpretar saltos de línea como <br>
        gfm: true,     // GitHub Flavored Markdown
      });

      // Convertir markdown a HTML
      const rawHtml = marked.parse(chatGptResponse);
      
      // Sanitizar el HTML (para prevenir ataques XSS)
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      
      // Actualizar el estado con el HTML procesado
      setHtmlContent(cleanHtml);
    } else {
      // Si no hay respuesta, mostrar un mensaje vacío o de carga
      setHtmlContent('');
    }
  }, [chatGptResponse]);

  // Efecto para aplicar personalizaciones específicas según el idioma
  useEffect(() => {
    // Si cambia el idioma, no es necesario recargar todo, pero podríamos aplicar estilos específicos
    // o modificaciones menores si fuera necesario
    const container = document.getElementById('analysisResults');
    if (container) {
      // Podríamos aplicar ajustes específicos por idioma si fuera necesario
      // Por ejemplo, fuentes especiales para ciertos idiomas, o estilos específicos
      console.log(`Idioma actualizado a: ${i18n.language}`);
    }
  }, [i18n.language]);

  // Si no hay contenido, mostrar un mensaje o nada
  if (!htmlContent) {
    return (
      <div className="no-content-message" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        {chatGptResponse === null ? '' : t('app.loading_status')}
      </div>
    );
  }

  // Renderizar el HTML generado
  return (
    <div 
      id="analysisResults" 
      className={`chat-analysis-container language-${i18n.language}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default Chatgptresultados;