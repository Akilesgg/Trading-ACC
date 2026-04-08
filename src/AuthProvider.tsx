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
    const savedUser = localStorage.getItem("trading_acc_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async () => {
    const guestUser: any = {
      uid: "guest_" + Math.random().toString(36).substr(2, 9),
      displayName: "ADMIN_ACC",
      email: "admin@tradingacc.com",
      photoURL: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhixhHsvZHj0307YqCJPp6pmq4CJh9WTE8vm9MijmKX2xzRNUfGMz0RKm1Rj0NFIcX9tfo4kj-7a31qv1sPoJR_jSJP1x-7Hac3BriTf0PkB3VCCQdcLpNaumMXSZ2rr6pDGDofj0qNn7M77CjIRDQil6tHANBt8feofMurDJ7L6tVZp5HvS_sWvcqEkQ1twkzEWy9R7WjwgT7YWzN0GECdBOjnla1j2lE4p5K5fY8jqPo9M8oMc0X5x5OcJyqfJq1g9bTG0FFWPk"
    };
    setUser(guestUser);
    localStorage.setItem("trading_acc_user", JSON.stringify(guestUser));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("trading_acc_user");
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
