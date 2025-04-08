// Updated SimplePaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase_auth'; // Adjust path if needed

const SimplePaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, redirect to plans page with success flag
        console.log('User is authenticated, redirecting to plans page');
        setTimeout(() => {
          navigate('/plans?payment_success=true', { replace: true });
        }, 1500);
      } else {
        // User is not signed in, redirect to login page with return URL
        console.log('User is not authenticated, redirecting to login page');
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          // Redirect to login with return URL to come back to plans
          navigate('/login?returnUrl=/plans&payment_success=true', { replace: true });
        }, 1500);
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
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
      {error ? (
        <p style={{ color: "#F44336" }}>{error}</p>
      ) : (
        <p>Estamos redireccionando a la página de planes...</p>
      )}
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