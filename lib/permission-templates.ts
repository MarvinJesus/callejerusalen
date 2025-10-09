// Plantillas de Permisos Predefinidas - Calle Jerusalén Community
// Define conjuntos de permisos comunes para facilitar la asignación

import { Permission } from './permissions';

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  icon?: string;
  color?: string;
  category: 'basic' | 'advanced' | 'specialized' | 'complete';
}

// Plantillas de Permisos
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'admin_full',
    name: 'Administrador Completo',
    description: 'Acceso completo excepto gestión de sistema crítico',
    category: 'complete',
    icon: '👑',
    color: 'purple',
    permissions: [
      // Usuarios
      'users.view',
      'users.create',
      'users.edit',
      'users.manage_status',
      
      // Roles y permisos
      'roles.view',
      'permissions.view',
      
      // Registros
      'registrations.view',
      'registrations.approve',
      'registrations.reject',
      
      // Seguridad
      'security.view',
      'security.monitor',
      'security.alerts',
      
      // Reportes
      'reports.view',
      'reports.export',
      'analytics.view',
      'analytics.export',
      
      // Logs
      'logs.view',
      'logs.export',
      
      // Comunidad
      'community.view',
      'community.edit',
      'community.events',
      'community.services',
      'community.places'
    ]
  },
  {
    id: 'content_manager',
    name: 'Gestor de Contenido',
    description: 'Gestión completa de contenido de la comunidad',
    category: 'advanced',
    icon: '📝',
    color: 'blue',
    permissions: [
      'community.view',
      'community.edit',
      'community.events',
      'community.services',
      'community.places',
      'reports.view'
    ]
  },
  {
    id: 'user_manager',
    name: 'Gestor de Usuarios',
    description: 'Gestión de usuarios y solicitudes de registro',
    category: 'advanced',
    icon: '👥',
    color: 'green',
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'users.manage_status',
      'registrations.view',
      'registrations.approve',
      'registrations.reject',
      'roles.view'
    ]
  },
  {
    id: 'security_manager',
    name: 'Gestor de Seguridad',
    description: 'Monitoreo y gestión de seguridad',
    category: 'specialized',
    icon: '🔒',
    color: 'red',
    permissions: [
      'security.view',
      'security.monitor',
      'security.alerts',
      'security.cameras',
      'logs.view',
      'reports.view',
      'users.view'
    ]
  },
  {
    id: 'moderator',
    name: 'Moderador',
    description: 'Gestión de registros y contenido básico',
    category: 'advanced',
    icon: '⚖️',
    color: 'orange',
    permissions: [
      'users.view',
      'registrations.view',
      'registrations.approve',
      'registrations.reject',
      'community.view',
      'community.edit',
      'community.events'
    ]
  },
  {
    id: 'read_only_admin',
    name: 'Administrador de Solo Lectura',
    description: 'Visualización de toda la información sin modificación',
    category: 'basic',
    icon: '👁️',
    color: 'gray',
    permissions: [
      'users.view',
      'registrations.view',
      'security.view',
      'reports.view',
      'analytics.view',
      'logs.view',
      'community.view',
      'roles.view',
      'permissions.view'
    ]
  },
  {
    id: 'reports_analyst',
    name: 'Analista de Reportes',
    description: 'Visualización y exportación de reportes y analytics',
    category: 'specialized',
    icon: '📊',
    color: 'indigo',
    permissions: [
      'reports.view',
      'reports.export',
      'analytics.view',
      'analytics.export',
      'logs.view',
      'users.view'
    ]
  },
  {
    id: 'events_coordinator',
    name: 'Coordinador de Eventos',
    description: 'Gestión de eventos y actividades comunitarias',
    category: 'specialized',
    icon: '🎉',
    color: 'pink',
    permissions: [
      'community.view',
      'community.events',
      'community.places',
      'users.view'
    ]
  },
  {
    id: 'services_manager',
    name: 'Gestor de Servicios',
    description: 'Gestión de servicios locales',
    category: 'specialized',
    icon: '🏪',
    color: 'teal',
    permissions: [
      'community.view',
      'community.services',
      'community.places'
    ]
  },
  {
    id: 'basic_admin',
    name: 'Administrador Básico',
    description: 'Permisos mínimos de administración',
    category: 'basic',
    icon: '🔰',
    color: 'cyan',
    permissions: [
      'users.view',
      'registrations.view',
      'community.view',
      'reports.view'
    ]
  }
];

// Función para obtener una plantilla por ID
export const getTemplateById = (id: string): PermissionTemplate | undefined => {
  return PERMISSION_TEMPLATES.find(template => template.id === id);
};

// Función para obtener plantillas por categoría
export const getTemplatesByCategory = (category: PermissionTemplate['category']): PermissionTemplate[] => {
  return PERMISSION_TEMPLATES.filter(template => template.category === category);
};

// Función para buscar plantillas por nombre
export const searchTemplates = (searchTerm: string): PermissionTemplate[] => {
  const term = searchTerm.toLowerCase();
  return PERMISSION_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(term) ||
    template.description.toLowerCase().includes(term)
  );
};

// Función para obtener el color de una categoría
export const getCategoryColor = (category: PermissionTemplate['category']): string => {
  const colors = {
    basic: 'bg-gray-100 text-gray-800 border-gray-300',
    advanced: 'bg-blue-100 text-blue-800 border-blue-300',
    specialized: 'bg-purple-100 text-purple-800 border-purple-300',
    complete: 'bg-green-100 text-green-800 border-green-300'
  };
  return colors[category] || colors.basic;
};

// Función para obtener el nombre de una categoría
export const getCategoryName = (category: PermissionTemplate['category']): string => {
  const names = {
    basic: 'Básico',
    advanced: 'Avanzado',
    specialized: 'Especializado',
    complete: 'Completo'
  };
  return names[category] || 'Desconocido';
};

// Función para combinar permisos de múltiples plantillas
export const combineTemplates = (templateIds: string[]): Permission[] => {
  const permissions = new Set<Permission>();
  
  templateIds.forEach(id => {
    const template = getTemplateById(id);
    if (template) {
      template.permissions.forEach(permission => permissions.add(permission));
    }
  });
  
  return Array.from(permissions);
};

// Función para encontrar la plantilla más cercana a un conjunto de permisos
export const findClosestTemplate = (permissions: Permission[]): PermissionTemplate | null => {
  if (!permissions || permissions.length === 0) return null;
  
  let bestMatch: PermissionTemplate | null = null;
  let bestMatchScore = 0;
  
  PERMISSION_TEMPLATES.forEach(template => {
    const matchingPermissions = template.permissions.filter(p => permissions.includes(p));
    const score = matchingPermissions.length / Math.max(template.permissions.length, permissions.length);
    
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatch = template;
    }
  });
  
  return bestMatchScore >= 0.7 ? bestMatch : null;
};

