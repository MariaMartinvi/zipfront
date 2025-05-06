import React, { useState, useEffect } from 'react';
import './InstallPWA.css';
import { useTranslation } from 'react-i18next';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e) => {
      // Guarda el evento sin llamar a preventDefault
      setPromptInstall(e);
      setSupportsPWA(true);
    };
    
    // Verificar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = () => {
    if (!promptInstall) {
      return;
    }
    
    // Mostrar el prompt de instalación
    promptInstall.prompt();
    
    // Esperar a que el usuario responda al prompt
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        setIsInstalled(true);
      } else {
        console.log('Usuario rechazó la instalación');
      }
      // Limpiar el prompt guardado
      setPromptInstall(null);
    });
  };

  if (!supportsPWA || isInstalled) {
    return null;
  }

  return (
    <div className="install-pwa-container">
      <button className="install-pwa-button" onClick={onClick}>
        <span className="install-icon">📱</span>
        {t('pwa.install_button')}
      </button>
    </div>
  );
};

export default InstallPWA;