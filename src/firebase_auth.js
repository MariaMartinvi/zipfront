// Updated firebase_auth.js with persistence
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
 authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
 projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
 storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
 appId: process.env.REACT_APP_FIREBASE_APP_ID
};





console.log("Firebase config:", firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL - this will keep the user logged in even after page refresh
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

const db = getFirestore(app);

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's profile with the display name
    await updateProfile(user, { displayName });
    
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      createdAt: new Date(),
      plan: 'free',
      currentPeriodUsage: 0,
      totalUploads: 0
    });
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in an existing user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Sign out the current user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset a user's password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Get the current authenticated user
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      console.log("getCurrentUser returned:", user ? user.uid : "No user");
      resolve(user);
    });
  });
};

// Check if a user is authenticated (with a timeout)
export const isAuthenticated = () => {
  return new Promise((resolve) => {
    // Set a timeout to resolve after 2 seconds if no auth state change occurs
    const timeout = setTimeout(() => {
      console.log("Auth check timed out, assuming not authenticated");
      resolve(false);
    }, 2000);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      const isLoggedIn = !!user;
      console.log("isAuthenticated:", isLoggedIn);
      resolve(isLoggedIn);
    });
  });
};

// Get a user's profile data from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Rest of your code remains the same...
export const updateUserPlan = async (userId, newPlan) => {
  try {
    console.group('Update User Plan Debug');
    console.log('User ID:', userId);
    console.log('New Plan:', newPlan);
    console.log('Current Auth User:', auth.currentUser?.uid);

    // Additional authentication check
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      console.error('Authentication mismatch');
      throw new Error('Not authenticated to update this user');
    }

    const userDocRef = doc(db, 'users', userId);

    await updateDoc(userDocRef, {
      plan: newPlan,
      planUpdatedAt: serverTimestamp(),
      currentPeriodUsage: 0
    });

    const updatedDoc = await getDoc(userDocRef);
    console.log('Updated Document:', updatedDoc.data());
    console.groupEnd();

    return true;
  } catch (error) {
    console.groupEnd();
    console.error('Plan Update Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Check if a user can upload more chats
export const canUploadChat = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    // Free plan users can upload 2 chats
    if (userProfile.plan === 'free') {
      return userProfile.currentPeriodUsage < 2;
    }
    
    // For paid plans, check their quota
    if (userProfile.plan === 'basic') {
      return userProfile.currentPeriodUsage < 20;
    } else if (userProfile.plan === 'standard') {
      return userProfile.currentPeriodUsage < 50;
    } else if (userProfile.plan === 'premium') {
      return userProfile.currentPeriodUsage < 120;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking upload capability:', error);
    throw error;
  }
};

// Increment a user's chat upload count
export const incrementChatUsage = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      currentPeriodUsage: increment(1),
      totalUploads: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing chat usage:', error);
    throw error;
  }
};

export { auth, db };