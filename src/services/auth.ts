import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { UserService } from './firestore';
import { User } from '../types';

export class AuthService {
  private static googleProvider: GoogleAuthProvider;

  private static getGoogleProvider(): GoogleAuthProvider {
    if (!this.googleProvider) {
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.addScope('email');
      this.googleProvider.addScope('profile');
      
      // Set custom parameters to help with CORS issues
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
    }
    return this.googleProvider;
  }

  // Sign in with Google using popup (primary method)
  static async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithPopup(auth, this.getGoogleProvider());
      return await this.handleGoogleSignInResult(userCredential.user);
    } catch (error: any) {
      console.error('Error signing in with Google popup:', error);
      
      // If popup fails due to CORS issues, try redirect method
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        console.log('Popup blocked, trying redirect method...');
        return await this.signInWithGoogleRedirect();
      }
      
      throw error;
    }
  }

  // Alternative sign in with Google using redirect (fallback method)
  static async signInWithGoogleRedirect(): Promise<FirebaseUser> {
    try {
      await signInWithRedirect(auth, this.getGoogleProvider());
      // This will cause a page redirect, so we won't reach this point
      // The result will be handled by handleRedirectResult
      throw new Error('Redirect initiated');
    } catch (error) {
      console.error('Error signing in with Google redirect:', error);
      throw error;
    }
  }

  // Handle redirect result after page reload
  static async handleRedirectResult(): Promise<FirebaseUser | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        return await this.handleGoogleSignInResult(result.user);
      }
      return null;
    } catch (error) {
      console.error('Error handling redirect result:', error);
      throw error;
    }
  }

  // Common handler for both popup and redirect results
  private static async handleGoogleSignInResult(firebaseUser: FirebaseUser): Promise<FirebaseUser> {
    // Check if user exists in Firestore, create if not
    let existingUser = await UserService.getUserById(firebaseUser.uid);
    
    if (!existingUser) {
      // Create new user document for first-time Google sign-in with UID as document ID
      await UserService.createUserWithId(firebaseUser.uid, {
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email!,
        isAdmin: false,
        skills: [],
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    return firebaseUser;
  }

  // Sign out current user
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user data from Firestore
  static async getCurrentUserData(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const userData = await UserService.getUserById(firebaseUser.uid);
      return userData;
    } catch (error) {
      console.error('Error getting current user data:', error);
      return null;
    }
  }

  // Subscribe to auth state changes
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Check if user is admin
  static async isAdmin(): Promise<boolean> {
    const userData = await this.getCurrentUserData();
    return userData?.isAdmin || false;
  }
}