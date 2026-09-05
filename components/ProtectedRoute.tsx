'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isMainSuperAdmin, authUserIsMainSuperAdmin } from '@/lib/super-admin';
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
  const { user, userProfile, loading, isRegistrationPending, isRegistrationRejected } = useAuth();
  const router = useRouter();
  const isSuperAdminAccess =
    userProfile?.role === 'super_admin' ||
    isMainSuperAdmin(userProfile?.email) ||
    authUserIsMainSuperAdmin(user);

  useEffect(() => {
    if (loading) return;

    console.log('🔐 ProtectedRoute: Verificando acceso');
    console.log('👤 Usuario:', userProfile?.email || user?.email, '| Rol:', userProfile?.role);
    console.log('🎯 Permisos de usuario:', userProfile?.permissions);
    console.log('📋 Requerido - Role:', requiredRole, '| AllowedRoles:', allowedRoles);
    console.log('🔑 Permisos requeridos:', requiredPermissions);

    if (isSuperAdminAccess) {
      console.log('✅ Super Admin - Acceso total concedido (sin verificar estado de registro)');
      return;
    }

    if (!user && !userProfile) {
      console.log('❌ No hay usuario autenticado, redirigiendo a login');
      toast.error('Debes iniciar sesión para acceder a esta sección');
      router.push('/login');
      return;
    }

    if (user && !userProfile) {
      console.log('⚠️ Sesión activa pero sin perfil. No se redirige a login.');
      router.push(fallbackPath);
      return;
    }

    if (!userProfile) {
      return;
    }

    // Verificar estado de registro - SOLO PARA USUARIOS NO SUPER ADMIN
    if (isRegistrationPending) {
      console.log('⏳ Usuario con registro pendiente - BLOQUEANDO ACCESO');
      toast.error('Tu solicitud de registro está pendiente de aprobación. No puedes acceder al sistema hasta que sea aprobada.');
      router.push('/login');
      return;
    }

    if (isRegistrationRejected) {
      console.log('❌ Usuario con registro rechazado - BLOQUEANDO ACCESO');
      toast.error('Tu solicitud de registro fue rechazada. No puedes acceder al sistema.');
      router.push('/login');
      return;
    }

    // Verificar rol específico (solo si NO es super_admin)
    if (requiredRole && userProfile.role !== requiredRole) {
      console.log(`❌ Acceso denegado. Se requiere rol: ${requiredRole}, usuario tiene: ${userProfile.role}`);
      toast.error(`Acceso denegado. Se requiere rol: ${requiredRole}`);
      router.push(fallbackPath);
      return;
    }

    // Verificar roles permitidos (solo si NO es super_admin)
    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
      console.log(`❌ Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}, usuario tiene: ${userProfile.role}`);
      toast.error('No tienes el rol necesario para acceder a esta sección');
      router.push(fallbackPath);
      return;
    }

    // IMPORTANTE: Verificar permisos específicos para usuarios admin (NO super_admin)
    // Si se especificaron permisos, el admin DEBE tenerlos
    if (requiredPermission) {
      const hasPermission = canPerformAction(userProfile.role, userProfile.permissions || [], requiredPermission);
      console.log(`🔍 Verificando permiso "${requiredPermission}": ${hasPermission ? '✅' : '❌'}`);
      
      if (!hasPermission) {
        console.log(`❌ Acceso denegado. Falta permiso: ${requiredPermission}`);
        toast.error(`No tienes el permiso necesario: ${requiredPermission}`);
        router.push(fallbackPath);
        return;
      }
    }

    // Verificar múltiples permisos
    if (requiredPermissions && requiredPermissions.length > 0) {
      const permissionChecks = requiredPermissions.map(permission => ({
        permission,
        hasIt: canPerformAction(userProfile.role, userProfile.permissions || [], permission)
      }));

      console.log('🔍 Verificando múltiples permisos:', permissionChecks);

      const hasRequiredPermissions = requireAllPermissions ? 
        permissionChecks.every(check => check.hasIt) :
        permissionChecks.some(check => check.hasIt);

      if (!hasRequiredPermissions) {
        const missingPermissions = permissionChecks
          .filter(check => !check.hasIt)
          .map(check => check.permission);
        
        console.log(`❌ Acceso denegado. Permisos faltantes:`, missingPermissions);
        
        const message = requireAllPermissions ? 
          `No tienes todos los permisos requeridos. Faltan: ${missingPermissions.join(', ')}` :
          'No tienes ninguno de los permisos requeridos para acceder a esta sección';
        
        toast.error(message);
        router.push(fallbackPath);
        return;
      }

      console.log('✅ Permisos verificados correctamente');
    }

    console.log('✅ Acceso concedido');
  }, [user, userProfile, loading, isSuperAdminAccess, requiredRole, allowedRoles, requiredPermission, requiredPermissions, requireAllPermissions, fallbackPath, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isSuperAdminAccess) {
    return <>{children}</>;
  }

  if (!userProfile) {
    return null;
  }

  // Verificaciones para otros roles
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

