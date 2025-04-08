import React, { useState, useEffect } from 'react';
import './WhatsappInstructions.css';

// Componente para las instrucciones de WhatsApp en formato carrusel
function WhatsappInstructions() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [platform, setPlatform] = useState('android'); // 'android' o 'ios'

  // Lista de pasos para Android
  const androidSteps = [
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

  // Lista de pasos para iOS
  const iosSteps = [
    {
      title: "Instala la App",
      description: "Asegúrate de tener esta app instalada en tu iPhone",
      icon: "📱"
    },
    {
      title: "Abre tu chat de WhatsApp",
      description: "Ve al grupo o conversación que deseas exportar",
      icon: "💬"
    },
    {
      title: "Toca el nombre del chat",
      description: "En la parte superior del chat, toca el nombre para ver los detalles",
      icon: "👆"
    },
    {
      title: "Desplázate al final",
      description: "En la información del chat, desplázate hasta el final de la pantalla",
      icon: "⬇️"
    },
    {
      title: "Exporta el chat",
      description: "Toca 'Exportar chat' en las opciones disponibles",
      icon: "📤"
    },
    {
      title: "Selecciona Sin medios",
      description: "Elige la opción 'Sin medios' para exportar solo los mensajes",
      icon: "📝"
    },
    {
      title: "Guarda en archivos",
      description: "Toca 'Guardar en archivos' para guardar en tu iPhone",
      icon: "💾"
    },
    {
      title: "Guarda localmente",
      description: "Selecciona 'En mi iPhone' y toca guardar",
      icon: "📂"
    },
    {
      title: "Abre nuestra web",
      description: "Abre esta aplicación y selecciona el archivo guardado",
      icon: "✓"
    }
  ];

  // Seleccionar los pasos según la plataforma
  const steps = platform === 'android' ? androidSteps : iosSteps;

  // Cambiar de plataforma
  const togglePlatform = (newPlatform) => {
    setPlatform(newPlatform);
    setActiveSlide(0); // Reiniciar a la primera diapositiva al cambiar de plataforma
  };

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
      
      <div className="platform-selector">
        <button 
          className={`platform-button ${platform === 'android' ? 'active' : ''}`}
          onClick={() => togglePlatform('android')}
        >
          Android
        </button>
        <button 
          className={`platform-button ${platform === 'ios' ? 'active' : ''}`}
          onClick={() => togglePlatform('ios')}
        >
          iOS
        </button>
      </div>
      
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