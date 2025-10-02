'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Permission } from '@/lib/permissions';
import { canPerformAction } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'visitante' | 'comunidad' | 'admin' | 'super_admin';
  allowedRoles?: string[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean; // true = requiere todos, false = requiere cualquiera
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  fallbackPath = '/'
}) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    console.log('ProtectedRoute: Verificando acceso - userProfile:', userProfile);
    console.log('ProtectedRoute: requiredRole:', requiredRole);
    console.log('ProtectedRoute: allowedRoles:', allowedRoles);

    // Si no hay usuario autenticado
    if (!userProfile) {
      console.log('ProtectedRoute: No hay usuario autenticado, redirigiendo a login');
      toast.error('Debes iniciar sesión para acceder a esta sección');
      router.push('/login');
      return;
    }

    // Verificar rol específico
    if (requiredRole && userProfile.role !== requiredRole) {
      console.log(`ProtectedRoute: Acceso denegado. Se requiere rol: ${requiredRole}, usuario tiene: ${userProfile.role}`);
      toast.error(`Acceso denegado. Se requiere rol: ${requiredRole}`);
      router.push(fallbackPath);
      return;
    }

    // Verificar roles permitidos
    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
      console.log(`ProtectedRoute: Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}, usuario tiene: ${userProfile.role}`);
      toast.error('No tienes permisos para acceder a esta sección');
      router.push(fallbackPath);
      return;
    }

    // Verificar permiso específico
    if (requiredPermission && !canPerformAction(userProfile.role, userProfile.permissions || [], requiredPermission)) {
      toast.error(`No tienes permisos para acceder a esta sección. Se requiere: ${requiredPermission}`);
      router.push(fallbackPath);
      return;
    }

    // Verificar múltiples permisos
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAllPermissions ? 
        requiredPermissions.every(permission => canPerformAction(userProfile.role, userProfile.permissions || [], permission)) :
        requiredPermissions.some(permission => canPerformAction(userProfile.role, userProfile.permissions || [], permission));

      if (!hasRequiredPermissions) {
        const message = requireAllPermissions ? 
          'No tienes todos los permisos requeridos para acceder a esta sección' :
          'No tienes ninguno de los permisos requeridos para acceder a esta sección';
        toast.error(message);
        router.push(fallbackPath);
        return;
      }
    }
  }, [userProfile, loading, requiredRole, allowedRoles, requiredPermission, requiredPermissions, requireAllPermissions, fallbackPath, router]);

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

  // Verificar permiso específico
  if (requiredPermission && !canPerformAction(userProfile.role, userProfile.permissions || [], requiredPermission)) {
    return null;
  }

  // Verificar múltiples permisos
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions ? 
      requiredPermissions.every(permission => canPerformAction(userProfile.role, userProfile.permissions || [], permission)) :
      requiredPermissions.some(permission => canPerformAction(userProfile.role, userProfile.permissions || [], permission));

    if (!hasRequiredPermissions) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

