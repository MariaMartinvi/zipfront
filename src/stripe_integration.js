// stripe_integration.js
import { loadStripe } from '@stripe/stripe-js';
import { getIdToken } from 'firebase/auth';
import { auth } from './firebase_auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Plan definitions - make sure priceIds match exactly with backend
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: '',
    quota: 2,
    description: 'Try our service with 2 free chat analyses'
  },
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    price: 4,
    quota: 5,
    description: '5 chat analyses',
    priceId: process.env.REACT_APP_STRIPE_BASIC_PRICE_ID
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard Plan',
    price: 8,
    quota: 10,
    description: '10 chat analyses',
    priceId: process.env.REACT_APP_STRIPE_STANDARD_PRICE_ID
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    price: 10,
    quota: 20,
    description: '20 chat analysis',
    priceId: process.env.REACT_APP_STRIPE_PREMIUM_PRICE_ID
  }
};

// Initialize Stripe
let stripePromise;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Create a checkout session
export const createCheckoutSession = async (priceId, userId) => {
  try {
    console.log('Creating checkout session for priceId:', priceId, 'userId:', userId);
    
    // Get the current user from auth object
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log('Firebase auth available:', !!auth);
    console.log('Current user:', currentUser);
    
    // Get ID token using the getIdToken function
    const token = await getIdToken(currentUser, true);
    console.log('Got fresh ID token');
    
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        priceId,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const session = await response.json();
    console.log('Checkout session created:', session);
    return session;
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Handle subscription checkout
export const redirectToCheckout = async (priceId, userId) => {
  try {
    console.log('Redirecting to checkout with priceId:', priceId, 'userId:', userId);
    
    // First create a checkout session on your backend
    const response = await createCheckoutSession(priceId, userId);
    
    if (!response || !response.id) {
      throw new Error('Failed to create checkout session');
    }
    
    console.log('Successfully created checkout session, redirecting to Stripe');
    
    // Then redirect to Stripe with the session ID
    const stripe = await getStripe();
    const result = await stripe.redirectToCheckout({
      sessionId: response.id
    });
    
    if (result.error) {
      console.error('Stripe redirect error:', result.error);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Failed to redirect to checkout:', error);
    throw error;
  }
};

// Get current user's plan
export const getUserPlan = async (userId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const token = await getIdToken(currentUser, true);
    
    const response = await fetch(`${API_URL}/api/user-plan/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.plan;
  } catch (error) {
    console.error('Failed to fetch user plan:', error);
    return 'free';
  }
};