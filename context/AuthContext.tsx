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
  isRegistrationPending: boolean;
  isRegistrationRejected: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  updateUserRole: async () => {},
  loginAsGuest: () => {},
  logoutGuest: () => {},
  isGuest: false,
  isRegistrationPending: false,
  isRegistrationRejected: false,
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
  const [isRegistrationPending, setIsRegistrationPending] = useState(false);
  const [isRegistrationRejected, setIsRegistrationRejected] = useState(false);

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
          
          // ⚠️ VERIFICACIÓN CRÍTICA: Comprobar estado del usuario
          if (profile) {
            const userStatus = profile.status;
            const isActive = profile.isActive;
            const userEmail = profile.email;
            
            // 🔐 PROTECCIÓN SUPER ADMIN: El super admin NUNCA puede ser bloqueado
            const isSuperAdmin = userEmail === 'mar90jesus@gmail.com';
            
            if (isSuperAdmin) {
              console.log('👑 Super Admin detectado en AuthContext - Acceso garantizado:', userEmail);
              // El super admin siempre tiene acceso, continuar normalmente
            } else {
              // Para usuarios normales, verificar el estado
              // Solo permitir usuarios con status='active'
              if (userStatus === 'deleted' || 
                  userStatus === 'inactive' || 
                  userStatus === 'pending' ||
                  isActive === false) {
                console.warn('⚠️ Usuario con estado inválido detectado en AuthContext:', {
                  email: profile.email,
                  status: userStatus,
                  isActive: isActive,
                  currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
                });
                
                // Cerrar sesión automáticamente
                await auth.signOut();
                setUser(null);
                setUserProfile(null);
                setIsRegistrationPending(false);
                setIsRegistrationRejected(false);
                setLoading(false);
                return;
              }
            }
            
            setUserProfile(profile);
            
            // Verificar estado de registro
            const isPending = profile.registrationStatus === 'pending';
            const isRejected = profile.registrationStatus === 'rejected';
            
            setIsRegistrationPending(isPending);
            setIsRegistrationRejected(isRejected);
            
            // Log del estado para debugging
            console.log('🔍 Estado de registro detectado:', {
              email: profile.email,
              registrationStatus: profile.registrationStatus,
              status: userStatus,
              isActive: isActive,
              isPending,
              isRejected
            });
          } else {
            setIsRegistrationPending(false);
            setIsRegistrationRejected(false);
          }
        } catch (error) {
          console.error('Error al cargar perfil del usuario:', error);
          setUserProfile(null);
          setIsRegistrationPending(false);
          setIsRegistrationRejected(false);
        }
      } else {
        setUserProfile(null);
        setIsRegistrationPending(false);
        setIsRegistrationRejected(false);
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
    isRegistrationPending,
    isRegistrationRejected,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
