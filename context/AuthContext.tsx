'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, UserProfile, UserRole } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  updateUserRole: (newRole: UserRole) => Promise<void>;
  loginAsGuest: () => void;
  logoutGuest: () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  updateUserRole: async () => {},
  loginAsGuest: () => {},
  logoutGuest: () => {},
  isGuest: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error al cargar perfil del usuario:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserRole = async (newRole: UserRole) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, role: newRole };
      setUserProfile(updatedProfile);
    }
  };

  const loginAsGuest = () => {
    const guestProfile: UserProfile = {
      uid: 'guest',
      email: 'visitante@callejerusalen.com',
      displayName: 'Usuario Visitante',
      role: 'visitante',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    setUserProfile(guestProfile);
    setIsGuest(true);
  };

  const logoutGuest = () => {
    setUserProfile(null);
    setIsGuest(false);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    updateUserRole,
    loginAsGuest,
    logoutGuest,
    isGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
