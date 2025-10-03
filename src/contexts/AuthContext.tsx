import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthService } from '../services/auth';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for redirect result first
      try {
        await AuthService.handleRedirectResult();
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    initializeAuth();

    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user data from Firestore
        try {
          const data = await AuthService.getCurrentUserData();
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google function
  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    const user = await AuthService.signInWithGoogle();
    return user;
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    await AuthService.signOut();
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return userData?.isAdmin || false;
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signOut,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};