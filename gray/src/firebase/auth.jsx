// src/firebase/auth.jsx
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  updatePassword, 
  sendEmailVerification, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Register a new user with email and password
export const doCreateWithEmailAndPassword = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Sign in with Google
export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user; // You can return the user directly here for easier access
};

// Sign out the current user
export const doSignOut = () => {
    return auth.signOut();
};

// Send password reset email
export const doPasswordReset = (email) => {
    return sendPasswordResetEmail(auth, email);
};

// Change the user's password
export const doPasswordChange = (password) => {
    // Check if the user is logged in before trying to update the password
    if (auth.currentUser) {
        return updatePassword(auth.currentUser, password);
    } else {
        throw new Error('No user is currently signed in.');
    }
};

// Send email verification to the current user
export const doSendEmailVerification = () => {
    // Ensure the user is logged in before sending verification email
    if (auth.currentUser) {
        return sendEmailVerification(auth.currentUser, {
            url: `${window.location.origin}/home`,
        });
    } else {
        throw new Error('No user is currently signed in.');
    }
};

// Sign in with email and password
export const doSignInWithEmailAndPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};
