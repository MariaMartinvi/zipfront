import React, { useState, useEffect } from 'react';

const PaymentSuccessBanner = ({ show, onClose }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    
    if (show) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      textAlign: 'center',
      maxWidth: '90%',
      width: '500px'
    }}>
      <p style={{ margin: 0, fontSize: '16px' }}>
        <strong>¡Tu pago ha sido procesado correctamente!</strong>
        <br />
        Tu plan ha sido actualizado.
      </p>
      <button 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
};

export default PaymentSuccessBanner;