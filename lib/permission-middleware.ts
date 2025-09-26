// Middleware de Permisos - Calle Jerusalén Community
// Proporciona funciones para verificar permisos en el cliente y servidor

import { Permission, hasPermission, hasAnyPermission, hasAllPermissions, canPerformAction } from './permissions';
import { UserProfile } from './auth';

// === MIDDLEWARE DEL CLIENTE ===

// Hook para verificar permisos en componentes React
export const usePermissions = (userProfile: UserProfile | null) => {
  const hasPermissionCheck = (permission: Permission): boolean => {
    if (!userProfile) return false;
    return canPerformAction(userProfile.role, userProfile.permissions || [], permission);
  };

  const hasAnyPermissionCheck = (permissions: Permission[]): boolean => {
    if (!userProfile) return false;
    return permissions.some(permission => 
      canPerformAction(userProfile.role, userProfile.permissions || [], permission)
    );
  };

  const hasAllPermissionsCheck = (permissions: Permission[]): boolean => {
    if (!userProfile) return false;
    return permissions.every(permission => 
      canPerformAction(userProfile.role, userProfile.permissions || [], permission)
    );
  };

  const canPerformActionCheck = (action: Permission): boolean => {
    if (!userProfile) return false;
    return canPerformAction(userProfile.role, userProfile.permissions || [], action);
  };

  return {
    hasPermission: hasPermissionCheck,
    hasAnyPermission: hasAnyPermissionCheck,
    hasAllPermissions: hasAllPermissionsCheck,
    canPerformAction: canPerformActionCheck,
    userPermissions: userProfile?.permissions || [],
    userRole: userProfile?.role || 'visitante'
  };
};

// === MIDDLEWARE DEL SERVIDOR ===

// Función para verificar permisos en API routes
export const verifyPermission = async (
  userId: string,
  requiredPermission: Permission,
  getUserProfile: (uid: string) => Promise<UserProfile | null>
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return false;
    }

    return canPerformAction(userProfile.role, userProfile.permissions || [], requiredPermission);
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    return false;
  }
};

// Función para verificar múltiples permisos (cualquiera)
export const verifyAnyPermission = async (
  userId: string,
  requiredPermissions: Permission[],
  getUserProfile: (uid: string) => Promise<UserProfile | null>
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return false;
    }

    return requiredPermissions.some(permission => 
      canPerformAction(userProfile.role, userProfile.permissions || [], permission)
    );
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};

// Función para verificar múltiples permisos (todos)
export const verifyAllPermissions = async (
  userId: string,
  requiredPermissions: Permission[],
  getUserProfile: (uid: string) => Promise<UserProfile | null>
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return false;
    }

    return requiredPermissions.every(permission => 
      canPerformAction(userProfile.role, userProfile.permissions || [], permission)
    );
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};

// === COMPONENTE DE PROTECCIÓN POR PERMISOS ===

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: Permission;
  userProfile: UserProfile | null;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  userProfile,
  fallback = null,
  requireAll = false
}) => {
  const canAccess = userProfile ? 
    canPerformAction(userProfile.role, userProfile.permissions || [], permission) : 
    false;

  if (!canAccess) {
    return fallback;
  }

  return children;
};

// === COMPONENTE DE PROTECCIÓN POR MÚLTIPLES PERMISOS ===

interface MultiPermissionGuardProps {
  children: React.ReactNode;
  permissions: Permission[];
  userProfile: UserProfile | null;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = requiere todos, false = requiere cualquiera
}

export const MultiPermissionGuard: React.FC<MultiPermissionGuardProps> = ({
  children,
  permissions,
  userProfile,
  fallback = null,
  requireAll = false
}) => {
  if (!userProfile) {
    return fallback;
  }

  const canAccess = requireAll ? 
    hasAllPermissions(userProfile.permissions || [], permissions) :
    hasAnyPermission(userProfile.permissions || [], permissions);

  if (!canAccess) {
    return fallback;
  }

  return children;
};

// === FUNCIONES DE UTILIDAD ===

// Función para obtener permisos requeridos para una acción específica
export const getRequiredPermissions = (action: string): Permission[] => {
  const permissionMap: Record<string, Permission[]> = {
    'view_users': ['users.view'],
    'create_user': ['users.create'],
    'edit_user': ['users.edit'],
    'delete_user': ['users.delete'],
    'activate_user': ['users.activate'],
    'deactivate_user': ['users.deactivate'],
    'view_registrations': ['registrations.view'],
    'approve_registration': ['registrations.approve'],
    'reject_registration': ['registrations.reject'],
    'view_security': ['security.view'],
    'monitor_security': ['security.monitor'],
    'view_reports': ['reports.view'],
    'export_reports': ['reports.export'],
    'view_analytics': ['analytics.view'],
    'view_logs': ['logs.view'],
    'export_logs': ['logs.export'],
    'delete_logs': ['logs.delete'],
    'configure_system': ['system.configure'],
    'view_community': ['community.view'],
    'edit_community': ['community.edit']
  };

  return permissionMap[action] || [];
};

// Función para verificar si un usuario puede acceder a una ruta específica
export const canAccessRoute = (
  route: string,
  userProfile: UserProfile | null
): boolean => {
  if (!userProfile) return false;

  const routePermissions: Record<string, Permission[]> = {
    '/admin': ['users.view', 'registrations.view', 'security.view'],
    '/admin/users': ['users.view'],
    '/admin/registrations': ['registrations.view'],
    '/admin/security': ['security.view'],
    '/admin/reports': ['reports.view'],
    '/admin/analytics': ['analytics.view'],
    '/admin/logs': ['logs.view'],
    '/admin/system': ['system.view'],
    '/admin/community': ['community.view']
  };

  const requiredPermissions = routePermissions[route] || [];
  if (requiredPermissions.length === 0) return true;

  return hasAnyPermission(userProfile.permissions || [], requiredPermissions);
};

// Función para obtener rutas accesibles para un usuario
export const getAccessibleRoutes = (userProfile: UserProfile | null): string[] => {
  if (!userProfile) return [];

  const allRoutes = [
    '/admin',
    '/admin/users',
    '/admin/registrations',
    '/admin/security',
    '/admin/reports',
    '/admin/analytics',
    '/admin/logs',
    '/admin/system',
    '/admin/community'
  ];

  return allRoutes.filter(route => canAccessRoute(route, userProfile));
};

// Función para generar mensaje de error de permisos
export const getPermissionErrorMessage = (
  requiredPermission: Permission,
  userProfile: UserProfile | null
): string => {
  if (!userProfile) {
    return 'Debes iniciar sesión para acceder a esta funcionalidad.';
  }

  if (userProfile.role === 'super_admin') {
    return 'Error inesperado: El super administrador debería tener acceso a todas las funcionalidades.';
  }

  return `No tienes permisos para realizar esta acción. Se requiere el permiso: ${requiredPermission}`;
};
