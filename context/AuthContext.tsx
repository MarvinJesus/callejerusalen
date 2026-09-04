'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { resolveUserProfile, buildLocalSuperAdminProfile, isMainSuperAdmin, authUserIsMainSuperAdmin, UserProfile, UserRole, getUserSecurityPlanStatus, SecurityPlanRegistration } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  securityPlan: SecurityPlanRegistration | null;
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
  securityPlan: null,
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
  const [securityPlan, setSecurityPlan] = useState<SecurityPlanRegistration | null>(null);
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let profile = await resolveUserProfile(firebaseUser);

          const isSuperAdmin =
            profile?.role === 'super_admin' ||
            authUserIsMainSuperAdmin(firebaseUser) ||
            isMainSuperAdmin(profile?.email);

          if (isSuperAdmin && profile) {
            console.log('👑 Super Admin detectado en AuthContext - Acceso garantizado:', profile.email, profile.role);
          }
          
          if (profile) {
            const userStatus = profile.status;
            const isActive = profile.isActive;
            
            if (!isSuperAdmin) {
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
                
                await auth.signOut();
                setUser(null);
                setUserProfile(null);
                setSecurityPlan(null);
                setIsRegistrationPending(false);
                setIsRegistrationRejected(false);
                setLoading(false);
                return;
              }
            }
            
            setUserProfile(profile);
            
            const isPending = !isSuperAdmin && profile.registrationStatus === 'pending';
            const isRejected = !isSuperAdmin && profile.registrationStatus === 'rejected';
            
            setIsRegistrationPending(isPending);
            setIsRegistrationRejected(isRejected);
            
            try {
              const securityPlanData = await getUserSecurityPlanStatus(firebaseUser.uid);
              setSecurityPlan(securityPlanData);
            } catch (securityError) {
              console.error('Error al cargar plan de seguridad:', securityError);
              setSecurityPlan(null);
            }
            
            console.log('🔍 Estado de registro detectado:', {
              email: profile.email,
              role: profile.role,
              registrationStatus: profile.registrationStatus,
              status: userStatus,
              isActive: isActive,
              isPending,
              isRejected,
              isSuperAdmin
            });
          } else if (authUserIsMainSuperAdmin(firebaseUser)) {
            const localProfile = buildLocalSuperAdminProfile(firebaseUser, null);
            setUserProfile(localProfile);
            setIsRegistrationPending(false);
            setIsRegistrationRejected(false);
            setSecurityPlan(null);
          } else {
            setUserProfile(null);
            setSecurityPlan(null);
            setIsRegistrationPending(false);
            setIsRegistrationRejected(false);
          }
        } catch (error) {
          console.error('Error al cargar perfil del usuario:', error);
          if (authUserIsMainSuperAdmin(firebaseUser)) {
            setUserProfile(buildLocalSuperAdminProfile(firebaseUser, null));
            setIsRegistrationPending(false);
            setIsRegistrationRejected(false);
          } else {
            setUserProfile(null);
            setIsRegistrationPending(false);
            setIsRegistrationRejected(false);
          }
          setSecurityPlan(null);
        }
      } else {
        setUserProfile(null);
        setSecurityPlan(null);
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
    setSecurityPlan(null);
    setIsGuest(false);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    securityPlan,
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
