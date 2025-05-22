import React from 'react';
import { useTranslation } from 'react-i18next';
import './GameBanner.css';

const GameBanner = ({ onShareClick }) => {
  const { t } = useTranslation();

  return (
    <div className="game-banner">
      <div className="game-banner-content">
        <div className="game-banner-text">
          {t('game.banner.description', '¡Comparte tu análisis como un juego de adivinar personalidades!')}
        </div>
        <button className="share-game-button" onClick={onShareClick}>
          {t('game.banner.share', 'Compartir Juego')}
        </button>
      </div>
    </div>
  );
};

export default GameBanner; 