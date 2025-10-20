// Sistema de Permisos - Calle Jerusalén Community
// Define los permisos específicos que pueden ser asignados a usuarios administradores

export type Permission = 
  // Gestión de usuarios
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_status'
  
  // Gestión de roles y permisos
  | 'roles.view'
  | 'roles.assign'
  | 'permissions.view'
  | 'permissions.assign'
  
  // Gestión de solicitudes
  | 'registrations.view'
  | 'registrations.approve'
  | 'registrations.reject'
  
  // Sistema y configuración
  | 'system.view'
  | 'system.configure'
  | 'system.backup'
  | 'system.restore'
  
  // Seguridad y monitoreo
  | 'security.view'
  | 'security.monitor'
  | 'security.alerts'
  | 'security.cameras'
  | 'security.camera_requests'
  | 'security.camera_approve'
  | 'security.camera_reject'
  
  // Reportes y analytics
  | 'reports.view'
  | 'reports.export'
  | 'analytics.view'
  | 'analytics.export'
  
  // Logs del sistema
  | 'logs.view'
  | 'logs.export'
  | 'logs.delete'
  
  // Configuración de la comunidad
  | 'community.view'
  | 'community.edit'
  | 'community.events'
  | 'community.services'
  | 'community.places';

// Lista de todos los permisos disponibles
export const ALL_PERMISSIONS: Permission[] = [
  // Gestión de usuarios
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'users.manage_status',
  
  // Gestión de roles y permisos
  'roles.view',
  'roles.assign',
  'permissions.view',
  'permissions.assign',
  
  // Gestión de solicitudes
  'registrations.view',
  'registrations.approve',
  'registrations.reject',
  
  // Sistema y configuración
  'system.view',
  'system.configure',
  'system.backup',
  'system.restore',
  
  // Seguridad y monitoreo
  'security.view',
  'security.monitor',
  'security.alerts',
  'security.cameras',
  'security.camera_requests',
  'security.camera_approve',
  'security.camera_reject',
  
  // Reportes y analytics
  'reports.view',
  'reports.export',
  'analytics.view',
  'analytics.export',
  
  // Logs del sistema
  'logs.view',
  'logs.export',
  'logs.delete',
  
  // Configuración de la comunidad
  'community.view',
  'community.edit',
  'community.events',
  'community.services',
  'community.places'
];

// Grupos de permisos para facilitar la gestión
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.manage_status'
  ] as Permission[],
  
  ROLE_MANAGEMENT: [
    'roles.view',
    'roles.assign',
    'permissions.view',
    'permissions.assign'
  ] as Permission[],
  
  REGISTRATION_MANAGEMENT: [
    'registrations.view',
    'registrations.approve',
    'registrations.reject'
  ] as Permission[],
  
  SYSTEM_MANAGEMENT: [
    'system.view',
    'system.configure',
    'system.backup',
    'system.restore'
  ] as Permission[],
  
  SECURITY_MANAGEMENT: [
    'security.view',
    'security.monitor',
    'security.alerts',
    'security.cameras',
    'security.camera_requests',
    'security.camera_approve',
    'security.camera_reject'
  ] as Permission[],
  
  REPORTS_ANALYTICS: [
    'reports.view',
    'reports.export',
    'analytics.view',
    'analytics.export'
  ] as Permission[],
  
  LOGS_MANAGEMENT: [
    'logs.view',
    'logs.export',
    'logs.delete'
  ] as Permission[],
  
  COMMUNITY_MANAGEMENT: [
    'community.view',
    'community.edit',
    'community.events',
    'community.services',
    'community.places'
  ] as Permission[]
};

// Descripciones de permisos para la interfaz de usuario
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Gestión de usuarios
  'users.view': 'Ver lista de usuarios y sus perfiles',
  'users.create': 'Crear nuevos usuarios en el sistema',
  'users.edit': 'Editar información de usuarios existentes',
  'users.delete': 'Eliminar usuarios del sistema',
  'users.manage_status': 'Activar y desactivar usuarios',
  
  // Gestión de roles y permisos
  'roles.view': 'Ver roles disponibles en el sistema',
  'roles.assign': 'Asignar roles a usuarios',
  'permissions.view': 'Ver permisos disponibles y asignados',
  'permissions.assign': 'Asignar permisos específicos a usuarios',
  
  // Gestión de solicitudes
  'registrations.view': 'Ver solicitudes de registro pendientes',
  'registrations.approve': 'Aprobar solicitudes de registro',
  'registrations.reject': 'Rechazar solicitudes de registro',
  
  // Sistema y configuración
  'system.view': 'Ver configuración del sistema',
  'system.configure': 'Modificar configuración del sistema',
  'system.backup': 'Crear copias de seguridad del sistema',
  'system.restore': 'Restaurar desde copias de seguridad',
  
  // Seguridad y monitoreo
  'security.view': 'Ver panel de seguridad',
  'security.monitor': 'Monitorear actividad de seguridad',
  'security.alerts': 'Gestionar alertas de seguridad',
  'security.cameras': 'Acceder a cámaras de seguridad',
  'security.camera_requests': 'Ver solicitudes de acceso a cámaras',
  'security.camera_approve': 'Aprobar solicitudes de acceso a cámaras',
  'security.camera_reject': 'Rechazar solicitudes de acceso a cámaras',
  
  // Reportes y analytics
  'reports.view': 'Ver reportes del sistema',
  'reports.export': 'Exportar reportes',
  'analytics.view': 'Ver analytics y estadísticas',
  'analytics.export': 'Exportar datos de analytics',
  
  // Logs del sistema
  'logs.view': 'Ver logs del sistema',
  'logs.export': 'Exportar logs del sistema',
  'logs.delete': 'Eliminar logs del sistema',
  
  // Configuración de la comunidad
  'community.view': 'Ver configuración de la comunidad',
  'community.edit': 'Editar configuración de la comunidad',
  'community.events': 'Gestionar eventos comunitarios',
  'community.services': 'Gestionar servicios comunitarios',
  'community.places': 'Gestionar lugares de la comunidad'
};

// Permisos por defecto para cada rol
export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(PERMISSION_GROUPS).flat(), // Todos los permisos
  admin: [
    'users.view',
    'registrations.view',
    'security.view',
    'security.camera_requests',
    'security.camera_approve',
    'security.camera_reject',
    'reports.view',
    'analytics.view',
    'logs.view',
    'community.view'
  ],
  comunidad: [],
  visitante: []
};

// Función para verificar si un usuario tiene un permiso específico
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Función para verificar si un usuario tiene al menos uno de los permisos requeridos
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Función para verificar si un usuario tiene todos los permisos requeridos
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

// Función para obtener permisos de un grupo específico
export const getPermissionsByGroup = (groupName: keyof typeof PERMISSION_GROUPS): Permission[] => {
  return PERMISSION_GROUPS[groupName];
};

// Función para verificar si un usuario puede realizar una acción específica
export const canPerformAction = (
  userRole: string,
  userPermissions: Permission[],
  action: Permission
): boolean => {
  // Super admin siempre puede realizar cualquier acción
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Verificar si el usuario tiene el permiso específico
  return hasPermission(userPermissions, action);
};

// Función para obtener permisos faltantes
export const getMissingPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): Permission[] => {
  return requiredPermissions.filter(permission => !userPermissions.includes(permission));
};

// Función para validar permisos
export const validatePermissions = (permissions: string[]): Permission[] => {
  const validPermissions: Permission[] = [];
  const allValidPermissions = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[];
  
  permissions.forEach(permission => {
    if (allValidPermissions.includes(permission as Permission)) {
      validPermissions.push(permission as Permission);
    } else {
      console.warn(`Permiso inválido: ${permission}`);
    }
  });
  
  return validPermissions;
};

// Función para obtener descripción de un permiso
export const getPermissionDescription = (permission: Permission): string => {
  return PERMISSION_DESCRIPTIONS[permission] || 'Permiso no descrito';
};

// Función para obtener el grupo de un permiso
export const getPermissionGroup = (permission: Permission): string | null => {
  for (const [groupName, groupPermissions] of Object.entries(PERMISSION_GROUPS)) {
    if (groupPermissions.includes(permission)) {
      return groupName;
    }
  }
  return null;
};

// Función para obtener permisos organizados por grupo
export const getPermissionsByGroups = (permissions: Permission[]): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};
  
  permissions.forEach(permission => {
    const group = getPermissionGroup(permission);
    if (group) {
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(permission);
    }
  });
  
  return grouped;
};
