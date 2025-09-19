import { AuthError } from 'firebase/auth';

export const getFirebaseAuthErrorMessage = (err: AuthError): string => {
  if (!err || !err.code) {
    return 'An unknown authentication error occurred. Please try again.';
  }

  switch (err.code) {
    // --- Specific & Common Errors ---
    case 'auth/user-not-found':
      return 'Account does not exist. Please sign up to continue.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': 
      return 'Invalid email or password. Please check your credentials and try again.';

    case 'auth/email-already-in-use':
      return 'This email address is already in use. Please sign in or use a different email.';

    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';

    case 'auth/invalid-email':
      return 'The email address is not valid. Please check and try again.';

    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
    
    case 'auth/requires-recent-login':
        return 'This action is sensitive and requires recent authentication. Please sign out and sign back in before trying again.';
        
    case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/web-storage-unsupported':
        return 'This browser is not supported or 3rd party cookies and data may be disabled. Please update your browser settings.';

    case 'auth/unauthorized-domain':
        return 'This domain is not authorized for this action. Please contact support.';

    case 'auth/user-disabled':
        return 'This user account has been disabled by an administrator.';

    // --- Default Catch-all ---
    default:
      console.error(`Unhandled Firebase Auth Error (${err.code}):`, err.message);
      return 'An unexpected authentication error occurred. Please try again.';
  }
};
