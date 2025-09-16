import React from 'react';
import { useTranslation } from 'react-i18next';
import './AIPurchaseModal.css';

const AIPurchaseModal = ({ isOpen, onClose, onPurchase }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="ai-purchase-modal-overlay">
      <div className="ai-purchase-modal">
        <button className="ai-modal-close-button" onClick={onClose}>
          ×
        </button>
        
        <div className="ai-modal-content">
          <div className="ai-modal-header">
            <div className="ai-modal-icon">🤖</div>
            <h2 className="ai-modal-title">{t('hero.ai_purchase.modal_title')}</h2>
          </div>
          
          <div className="ai-modal-body">
            <div className="ai-discount-badge">
              {t('hero.ai_purchase.discount_notice')}
            </div>
            
            <div className="ai-price-section">
              <div className="ai-price-comparison">
                <span className="ai-original-price">10€</span>
                <span className="ai-current-price">5€</span>
              </div>
              <p className="ai-price-description">{t('hero.ai_purchase.pack_description')}</p>
            </div>
            
            <div className="ai-features">
              <div className="ai-feature">
                <span>{t('hero.ai_purchase.full_chat_notice')}</span>
              </div>
            </div>
            
            <div className="ai-modal-question">
              <p>{t('hero.ai_purchase.question')}</p>
            </div>
          </div>
          
          <div className="ai-modal-actions">
            <button className="ai-purchase-button" onClick={onPurchase}>
              <span className="ai-button-icon">🔒</span>
              {t('hero.ai_purchase.buy_button')}
            </button>
            <button className="ai-cancel-button" onClick={onClose}>
              {t('hero.ai_purchase.cancel_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPurchaseModal;
