'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'visitante' | 'comunidad' | 'admin' | 'super_admin';
  allowedRoles?: string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  fallbackPath = '/'
}) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si no hay usuario autenticado
    if (!userProfile) {
      toast.error('Debes iniciar sesión para acceder a esta sección');
      router.push('/login');
      return;
    }

    // Verificar rol específico
    if (requiredRole && userProfile.role !== requiredRole) {
      toast.error(`Acceso denegado. Se requiere rol: ${requiredRole}`);
      router.push(fallbackPath);
      return;
    }

    // Verificar roles permitidos
    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
      toast.error('No tienes permisos para acceder a esta sección');
      router.push(fallbackPath);
      return;
    }
  }, [userProfile, loading, requiredRole, allowedRoles, fallbackPath, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Si no hay usuario o no tiene permisos, no renderizar nada
  if (!userProfile) {
    return null;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

