import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, sanitizeFirestorePayload } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Authentication State Observer
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          
          // Ensure user profile document exists in /users/{userId}
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          const profileData = sanitizeFirestorePayload({
            displayName: currentUser.displayName || 'Anonymous Explorer',
            email: currentUser.email || null,
            photoURL: currentUser.photoURL || null,
            lastLoginAt: serverTimestamp(),
            ...(userDocSnap.exists() ? {} : { createdAt: serverTimestamp() }),
          });

          await setDoc(userDocRef, profileData, { merge: true });
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error syncing user profile to Firestore:', err);
        // Do not crash auth if Firestore write experiences transient error
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup window; do not treat as fatal error
        console.info('Google Sign-In popup closed by user.');
        return;
      } else if (err.code === 'auth/cancelled-popup-request') {
        console.info('Sign-In popup request was replaced.');
        return;
      } else {
        console.error('Google Sign-In failed:', err);
        setError(err.message || 'Failed to authenticate with Google. Please try again.');
        throw err;
      }
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
