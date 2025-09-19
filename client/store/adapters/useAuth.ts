import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError, logout } from '../authSlice';
import {
  onAuthStateChanged,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, hasValidConfig } from '@/lib/firebase';
import { getFirebaseAuthErrorMessage } from '@/lib/auth-errors';
import { RootState } from '..';
import React from 'react';

const SESSION_KEY = 'user_has_active_session';

// Custom hook for authentication logic
export function useAuth() {
  const dispatch = useDispatch();
  const { currentUser, isLoading, error } = useSelector((state: RootState) => state.auth);

  // Effect to handle auth state changes from Firebase
  React.useEffect(() => {
    if (!hasValidConfig) {
      dispatch(setError('Firebase authentication is not configured.'));
      dispatch(logout());
      return;
    }

    dispatch(setLoading(true));
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === 'true';

      // If a Firebase user exists AND they have an active session, they are logged in.
      if (user && hasActiveSession) {
        dispatch(setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        }));
      } else {
        // For any other case (no user, or a user without an active session),
        // ensure the app state is logged out.
        dispatch(logout());
      }
      dispatch(setLoading(false));
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [dispatch]);

  const signUpWithEmail = async (email, password) => {
    if (!hasValidConfig) {
      const msg = 'Firebase is not configured. Cannot sign up with email.';
      dispatch(setError(msg));
      throw new Error(msg);
    }
    try {
      dispatch(setLoading(true));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      sessionStorage.setItem(SESSION_KEY, 'true');
      dispatch(setUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      }));
    } catch (err: any) {
      sessionStorage.removeItem(SESSION_KEY);
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      dispatch(setError(friendlyMessage));
      dispatch(setLoading(false));
      throw new Error(friendlyMessage);
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!hasValidConfig) {
      const msg = 'Firebase is not configured. Cannot sign in with email.';
      dispatch(setError(msg));
      throw new Error(msg);
    }
    try {
      dispatch(setLoading(true));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      sessionStorage.setItem(SESSION_KEY, 'true');
      dispatch(setUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      }));
    } catch (err: any) {
      sessionStorage.removeItem(SESSION_KEY);
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      dispatch(setError(friendlyMessage));
      dispatch(setLoading(false));
      throw new Error(friendlyMessage);
    }
  };


  const loginWithGoogle = async () => {
    if (!hasValidConfig) {
      const msg = 'Firebase is not configured. Cannot sign in with Google.';
      dispatch(setError(msg));
      throw new Error(msg);
    }
    try {
      dispatch(setLoading(true));
      sessionStorage.setItem(SESSION_KEY, 'true');
      // After redirect, onAuthStateChanged will handle setting the user.
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err: any) {
      sessionStorage.removeItem(SESSION_KEY);
      const friendlyMessage = getFirebaseAuthErrorMessage(err);
      dispatch(setError(friendlyMessage));
      dispatch(setLoading(false));
      throw new Error(friendlyMessage);
    }
  };

  const loginAsGuest = React.useCallback(async () => {
    const guest = {
      uid: `guest_${Date.now()}`,
      displayName: 'Guest',
      email: null,
      isGuest: true,
    };
    sessionStorage.setItem(SESSION_KEY, 'true');
    dispatch(setUser(guest));
    return Promise.resolve();
  }, [dispatch]);

  const signOut = async () => {
    // Remove our session flag first.
    sessionStorage.removeItem(SESSION_KEY);

    // If there's a real Firebase user, sign them out.
    // This will trigger onAuthStateChanged, which will then dispatch logout().
    if (hasValidConfig && auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch (err: any) {
        console.error('Firebase sign out failed:', err);
        // As a fallback, manually dispatch logout.
        dispatch(logout());
      }
    } else {
       // If it's a guest user, just dispatch logout.
       dispatch(logout());
    }
  };

  return {
    currentUser,
    isLoading,
    error,
    loginWithGoogle,
    loginAsGuest,
    signOut,
    signUpWithEmail,
    signInWithEmail
  };
}
