// stripe_routes.js
import { loadStripe } from '@stripe/stripe-js';
import { getIdToken } from 'firebase/auth';
import { auth } from './firebase_auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a Stripe checkout session
export const createCheckoutSession = async (priceId, userId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await getIdToken(currentUser, true);
    
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        priceId,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Create a Stripe customer portal session
export const createPortalSession = async (userId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await getIdToken(currentUser, true);
    
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};

// Get user plan
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
    console.error('Error getting user plan:', error);
    return 'free';
  }
};

// Get a user's current usage
router.get('/api/user-usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get current billing period usage
    res.json({ usage: userData.currentPeriodUsage || 0 });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment user's chat usage counter
router.post('/api/increment-usage', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Update the user's usage count
    await db.collection('users').doc(userId).update({
      currentPeriodUsage: db.FieldValue.increment(1),
      totalUploads: db.FieldValue.increment(1)
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle Stripe events (subscription created, updated, etc.)
router.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      
      // Determine the plan based on the Price ID
      let plan = 'free';
      if (subscription.items.data[0].price.id === 'price_basic') {
        plan = 'basic';
      } else if (subscription.items.data[0].price.id === 'price_standard') {
        plan = 'standard';
      } else if (subscription.items.data[0].price.id === 'price_premium') {
        plan = 'premium';
      }
      
      // Update the user's plan in your database
      await db.collection('users').doc(userId).update({
        plan: plan,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end
      });
      break;
      
    case 'customer.subscription.deleted':
      const cancelledSubscription = event.data.object;
      const cancelledUserId = cancelledSubscription.metadata.userId;
      
      // Reset the user to free plan
      await db.collection('users').doc(cancelledUserId).update({
        plan: 'free',
        stripeSubscriptionId: null
      });
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      
      // If this is a subscription renewal, reset usage counters
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const renewalUserId = subscription.metadata.userId;
        
        // Reset usage for the new billing period
        await db.collection('users').doc(renewalUserId).update({
          currentPeriodUsage: 0,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end
        });
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

module.exports = router;