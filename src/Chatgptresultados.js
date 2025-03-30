import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import './Chatgptresultados.css';

function Chatgptresultados({ chatGptResponse }) {
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
    }
  }, [chatGptResponse]);

  // Renderizar el HTML generado
  return (
    <div 
      id="analysisResults" 
      className="chat-analysis-container"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default Chatgptresultados;