import React, { useState } from 'react';
import './Pages.css';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <div 
        className="faq-question" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3>{question}</h3>
        <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && <div className="faq-answer">{answer}</div>}
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      question: "¿Cómo funciona el análisis de conversaciones de WhatsApp?",
      answer: "Nuestro servicio analiza tus chats de WhatsApp después de exportarlos como archivo ZIP. Utilizamos técnicas avanzadas de análisis de datos y IA para proporcionarte insights detallados sobre tus conversaciones, incluyendo patrones de comunicación, análisis psicológico y estadísticas detalladas."
    },
    {
      question: "¿Es seguro subir mis chats?",
      answer: "Sí, la privacidad es nuestra prioridad. Tus archivos se eliminan automáticamente después del análisis, y no guardamos ningún contenido de tus conversaciones. Además, ofrecemos la opción de omitir el análisis psicológico por IA si lo prefieres. Nuestro proceso cumple con los más altos estándares de seguridad de datos."
    },
    {
      question: "¿Qué tipo de análisis ofrece la plataforma?",
      answer: "Ofrecemos un análisis completo que incluye: estadísticas detalladas de conversación, patrones de comunicación, análisis de horarios y actividad, uso de emojis y palabras más frecuentes, análisis de conversaciones iniciadas y terminadas, y un análisis psicológico opcional generado por IA. Todos los análisis se presentan de forma visual e interactiva."
    },
    {
      question: "¿Cómo puedo exportar mis chats de WhatsApp?",
      answer: "En WhatsApp, ve a un chat, selecciona 'Exportar chat' y guarda como archivo ZIP sin multimedia. La plataforma acepta archivos ZIP de WhatsApp tanto de Android como de iOS, y detecta automáticamente el formato. Puedes subir el archivo directamente en nuestra plataforma."
    },
    {
      question: "¿Cuánto cuesta el servicio?",
      answer: "Ofrecemos diferentes planes: un plan gratuito con análisis básicos y planes premium con análisis más detallados, mayor frecuencia de uso y características avanzadas. Todos los planes incluyen la opción de omitir el análisis psicológico por IA si lo prefieres."
    },
    {
      question: "¿Puedo usar el servicio en cualquier dispositivo?",
      answer: "Sí, nuestra plataforma es completamente web y responsive. Puedes acceder desde cualquier dispositivo (computadoras, tablets y teléfonos móviles) y los análisis se adaptan automáticamente a tu pantalla. Además, puedes compartir los resultados fácilmente con otros."
    }
  ];

  return (
    <div className="faq-page">
      <div className="faq-header">
        <h1>Preguntas Frecuentes</h1>
        <p>Encuentra respuestas a las consultas más comunes sobre nuestro servicio.</p>
      </div>

      <div className="faq-container">
        {faqs.map((faq, index) => (
          <FAQItem 
            key={index} 
            question={faq.question} 
            answer={faq.answer} 
          />
        ))}
      </div>

      <div className="faq-additional-help">
        <h2>¿No encuentras tu respuesta?</h2>
        <p>Si tienes una pregunta que no está en esta lista, no dudes en <a href="/contact">contactarnos</a>.</p>
      </div>
    </div>
  );
};

export default FAQ;