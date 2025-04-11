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
      answer: "Nuestro servicio analiza tus chats de WhatsApp después de exportarlos como archivo ZIP. Utilizamos técnicas de análisis de datos y IA para proporcionarte insights únicos sobre tus conversaciones."
    },
    {
      question: "¿Es seguro subir mis chats?",
      answer: "Sí, tomamos la privacidad muy en serio. Tus archivos se eliminan automáticamente después del análisis, y no guardamos ningún contenido de tus conversaciones. Nuestro proceso cumple con los más altos estándares de seguridad de datos."
    },
    {
      question: "¿Qué tipo de análisis ofrece la plataforma?",
      answer: "Ofrecemos varios tipos de análisis, incluyendo: estadísticas de primer chat, análisis de influencers, uso de emojis, palabras más frecuentes, y un análisis psicológico generado por IA."
    },
    {
      question: "¿Cómo puedo exportar mis chats de WhatsApp?",
      answer: "En WhatsApp, ve a un chat, selecciona 'Exportar chat' y guarda como archivo ZIP sin multimedia. Luego puedes subirlo directamente en nuestra plataforma."
    },
    {
      question: "¿Cuánto cuesta el servicio?",
      answer: "Ofrecemos diferentes planes: un plan gratuito con análisis limitados y planes premium con análisis más detallados y frecuencia de uso extendida."
    },
    {
      question: "¿Puedo usar el servicio en cualquier dispositivo?",
      answer: "Sí, nuestra plataforma es completamente web y responsive. Puedes acceder desde computadoras, tablets y teléfonos móviles."
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