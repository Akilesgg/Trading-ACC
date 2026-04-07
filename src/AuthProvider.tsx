import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, db, doc, setDoc, Timestamp, getDocFromServer } from './services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: Timestamp.now(),
            role: 'user' // Default role
          }, { merge: true });
          
          // Check if it's a new user to set createdAt
          const userDoc = await getDocFromServer(userRef);
          if (!userDoc.exists() || !userDoc.data()?.createdAt) {
            await setDoc(userRef, { createdAt: Timestamp.now() }, { merge: true });
          }
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      }
      setUser(user);
      setLoading(false);
    });

    // Safety timeout: if auth state doesn't resolve in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async () => {
    // Local bypass: No Google login required
    const localUser = {
      uid: 'local-admin-acc',
      displayName: 'ADMIN_ACC',
      email: 'acc08101970@gmail.com',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({})
    } as any;
    
    setUser(localUser);
    setLoading(false);
    
    // Sync to Firestore if possible (will fail if rules require real auth, but we'll update rules)
    const userRef = doc(db, 'users', localUser.uid);
    try {
      await setDoc(userRef, {
        uid: localUser.uid,
        displayName: localUser.displayName,
        email: localUser.email,
        photoURL: localUser.photoURL,
        lastLogin: Timestamp.now(),
        role: 'admin'
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore sync skipped (local mode):", e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
