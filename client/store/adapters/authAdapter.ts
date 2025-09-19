import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setUser as setUserAction, setLoading as setLoadingAction } from '@/store/authSlice';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signInWithRedirect,
  signInAnonymously,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { getFirebaseAuthErrorMessage } from '@/lib/auth-errors';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const loading = useSelector((s: RootState) => s.auth.isLoading);

  async function signUpWithEmail(email: string, password: string, displayName?: string) {
    const { hasValidConfig } = await import('@/lib/firebase');
    if (!hasValidConfig) {
      toast.warning('Auth system not configured — creating a local guest session instead');
      const guestUser = { uid: `guest_${Date.now()}`, displayName: displayName || 'Guest', email: null, isGuest: true };
      dispatch(setUserAction(guestUser));
      dispatch(setLoadingAction(false));
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
    } catch (err) {
      throw new Error(getFirebaseAuthErrorMessage(err as AuthError));
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const { hasValidConfig } = await import('@/lib/firebase');
    if (!hasValidConfig) {
      toast.warning('Auth system not configured — continuing in local guest mode');
      await loginAsGuest();
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(getFirebaseAuthErrorMessage(err as AuthError));
    }
  }

  async function logout() {
    try {
      if ((currentUser as any)?.isGuest) {
        dispatch(setUserAction(null));
        toast.success('Signed out successfully');
        return;
      }
      await signOut(auth);
      dispatch(setUserAction(null)); // Explicitly clear user for faster UI feedback
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Logout failed:', err);
      dispatch(setUserAction(null)); // Ensure user state is cleared on error too
      toast.error(getFirebaseAuthErrorMessage(err as AuthError));
    }
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const { hasValidConfig } = await import('@/lib/firebase');
    if (!hasValidConfig) {
      toast.warning('Firebase not configured — Google sign-in disabled. Continuing in guest mode');
      await loginAsGuest();
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const isUnauthorized = (err as AuthError)?.code === 'auth/unauthorized-domain';
      if (isUnauthorized) {
        const proceed = window.confirm(
          'Google sign-in is blocked for this domain. Add the domain in your Firebase console or continue as a guest. Proceed as guest?'
        );
        if (proceed) await loginAsGuest();
      } else {
        toast.error(getFirebaseAuthErrorMessage(err as AuthError));
        // As a fallback, try redirect which can sometimes succeed where popup fails
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          toast.error(getFirebaseAuthErrorMessage(redirectErr as AuthError));
          await loginAsGuest();
        }
      }
    }
  }

  async function loginAsGuest() {
    if (!(await import('@/lib/firebase').then(m => m.hasValidConfig))) {
        toast.warning('Firebase not configured — continuing in local guest mode');
        const guestUser = { uid: `guest_${Date.now()}`, displayName: 'Guest', email: null, isGuest: true } as any;
        dispatch(setUserAction(guestUser));
        dispatch(setLoadingAction(false));
        return;
      }
  
      try {
        await signInAnonymously(auth);
        toast.success('Signed in as guest');
      } catch (err) {
        toast.error(getFirebaseAuthErrorMessage(err as AuthError));
      }
  }

  return { currentUser: currentUser as any, loading, signUpWithEmail, signInWithEmail, logout, loginWithGoogle, loginAsGuest };
}
