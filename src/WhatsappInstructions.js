import React, { useState, useEffect } from 'react';
import './WhatsappInstructions.css';

// Componente para las instrucciones de WhatsApp en formato carrusel
function WhatsappInstructions() {
  const [activeSlide, setActiveSlide] = useState(0);

  // Lista de pasos con título, descripción e ícono
  const steps = [
    {
      title: "Instala la aplicación",
      description: "Asegúrate de tener esta app instalada en tu dispositivo",
      icon: "📱"
    },
    {
      title: "Abre tu chat de WhatsApp",
      description: "Ve al grupo o conversación que deseas analizar",
      icon: "💬"
    },
    {
      title: "Accede al menú",
      description: "Toca los tres puntos en la esquina superior derecha",
      icon: "⋮"
    },
    {
      title: "Selecciona 'Más'",
      description: "Busca y selecciona la opción 'Más' en el menú desplegable",
      icon: "+"
    },
    {
      title: "Exporta el chat",
      description: "Selecciona 'Exportar chat' en las opciones disponibles",
      icon: "📤"
    },
    {
      title: "Comparte con esta app",
      description: "Elige esta aplicación de la lista de opciones para compartir",
      icon: "✓"
    }
  ];

  // Cambiar automáticamente de slide cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [steps.length]);

  // Cambiar a un slide específico
  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  // Ir al slide anterior
  const prevSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide - 1 + steps.length) % steps.length);
  };

  // Ir al slide siguiente
  const nextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
  };

  return (
    <div className="whatsapp-instructions">
      <h2>Cómo compartir un chat desde WhatsApp</h2>
      
      <div className="carousel-container">
        <button className="carousel-button prev" onClick={prevSlide} aria-label="Anterior">
          &lt;
        </button>
        
        <div className="carousel-slides">
          {/* Mostrar solo el slide activo */}
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`carousel-slide ${index === activeSlide ? 'active' : ''}`}
              style={{ display: index === activeSlide ? 'flex' : 'none' }}
            >
              <div className="step-icon">{step.icon}</div>
              <h3>{`Paso ${index + 1}: ${step.title}`}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
        
        <button className="carousel-button next" onClick={nextSlide} aria-label="Siguiente">
          &gt;
        </button>
      </div>
      
      <div className="carousel-indicators">
        {steps.map((_, index) => (
          <button 
            key={index} 
            className={`indicator ${index === activeSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir al paso ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default WhatsappInstructions;