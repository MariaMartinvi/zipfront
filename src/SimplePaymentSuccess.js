// SimplePaymentSuccess.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SimplePaymentSuccess = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Just redirect to plans after a short delay
    setTimeout(() => {
      navigate('/plans?payment_success=true', { replace: true });
    }, 1500);
  }, [navigate]);
  
  return (
    <div style={{
      maxWidth: "600px",
      margin: "40px auto",
      padding: "30px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      textAlign: "center",
      backgroundColor: "#fff"
    }}>
      <h2 style={{ color: "#4CAF50" }}>¡Pago Exitoso!</h2>
      <p>Estamos redireccionando a la página de planes...</p>
      <div style={{
        width: "50px",
        height: "50px",
        margin: "20px auto",
        border: "5px solid #f3f3f3",
        borderTop: "5px solid #4CAF50",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SimplePaymentSuccess;