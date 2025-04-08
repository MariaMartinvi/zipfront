// stripe_integration.js
import { loadStripe } from '@stripe/stripe-js';
import { getIdToken } from 'firebase/auth';
import { auth } from './firebase_auth';



// Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51R91efF4OlRGsz64CwQTalGcLYbnA4aJxXnZh225kgxgQL8J8dqfQSeV8P6Q8vWRUpoaTfhxZwvEc4T3MlOC1If300kdZzDmXb';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Plan definitions
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
    quota: 20,
    description: '20 chat analyses per month',
    priceId: 'price_1R93Z2F4OlRGsz64VddhadvK' // Replace with actual Stripe price ID
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard Plan',
    price: 20,
    quota: 50,
    description: '50 chat analyses per month',
    priceId: 'price_1R93ZtF4OlRGsz64LecgwS4m' // Replace with actual Stripe price ID
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    price: 20,
    quota: 120,
    description: '120 chat analyses per month',
    priceId: 'price_1R93bIF4OlRGsz64EwUeg6RY' // Replace with actual Stripe price ID
  }
};

// Initialize Stripe
let stripePromise;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

//copiar codigo



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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const session = await response.json();
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
    // First create a checkout session on your backend
    const response = await createCheckoutSession(priceId, userId);
    
    if (!response || !response.id) {
      throw new Error('Failed to create checkout session');
    }
    
    // Then redirect to Stripe with the session ID
    const stripe = await getStripe();
    const result = await stripe.redirectToCheckout({
      sessionId: response.id
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Failed to redirect to checkout:', error);
    throw error;
  }
};

// Handle subscription management
export const manageSubscription = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    const session = await response.json();
    window.location.href = session.url;
  } catch (error) {
    console.error('Failed to redirect to customer portal:', error);
    throw error;
  }
};

// Get current user's plan
export const getUserPlan = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/user-plan/${userId}`);
    const data = await response.json();
    return data.plan;
  } catch (error) {
    console.error('Failed to fetch user plan:', error);
    throw error;
  }
};

// Get current user's usage
export const getUserUsage = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/user-usage/${userId}`);
    const data = await response.json();
    return data.usage;
  } catch (error) {
    console.error('Failed to fetch user usage:', error);
    throw error;
  }
};

// Check if user can upload more chats
export const canUploadChat = async (userId) => {
  try {
    const plan = await getUserPlan(userId);
    const usage = await getUserUsage(userId);
    
    // Get plan quota
    const planDetails = Object.values(PLANS).find(p => p.id === plan);
    
    if (!planDetails) {
      throw new Error('Invalid plan');
    }
    
    return usage < planDetails.quota;
  } catch (error) {
    console.error('Failed to check upload eligibility:', error);
    throw error;
  }
};

// Increment user's chat usage counter
export const incrementChatUsage = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/increment-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to increment usage:', error);
    throw error;
  }
};