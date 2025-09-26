/**
 * Ejemplos de uso del Sistema de Permisos
 * Este archivo muestra cómo implementar el sistema de permisos en diferentes escenarios
 */

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/lib/permission-middleware';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PermissionGuard, MultiPermissionGuard } from '@/lib/permission-middleware';
import { PermissionList } from '@/components/PermissionBadge';

// ===== EJEMPLO 1: Protección de Rutas con Permisos =====

const UserManagementPage = () => {
  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <p>Esta página requiere permisos específicos para gestionar usuarios.</p>
    </div>
  );
};

// Proteger la ruta con permisos específicos
const ProtectedUserManagement = () => (
  <ProtectedRoute 
    requiredPermissions={['users.view', 'users.create', 'users.edit']}
    requireAllPermissions={false} // Requiere al menos uno de los permisos
  >
    <UserManagementPage />
  </ProtectedRoute>
);

// ===== EJEMPLO 2: Uso del Hook usePermissions =====

const UserActions = () => {
  const { userProfile } = useAuth();
  const { hasPermission, hasAnyPermission, canPerformAction } = usePermissions(userProfile);

  return (
    <div className="space-y-4">
      <h2>Acciones de Usuario</h2>
      
      {/* Botón de crear usuario - requiere permiso específico */}
      {hasPermission('users.create') && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Crear Usuario
        </button>
      )}
      
      {/* Botón de editar usuario - requiere permiso específico */}
      {hasPermission('users.edit') && (
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Editar Usuario
        </button>
      )}
      
      {/* Botón de eliminar usuario - requiere permiso específico */}
      {hasPermission('users.delete') && (
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Eliminar Usuario
        </button>
      )}
      
      {/* Sección de reportes - requiere cualquiera de los permisos */}
      {hasAnyPermission(['reports.view', 'analytics.view']) && (
        <div className="border p-4 rounded">
          <h3>Reportes y Analytics</h3>
          <p>Puedes ver reportes o analytics</p>
        </div>
      )}
      
      {/* Mensaje si no tiene permisos */}
      {!hasAnyPermission(['users.view', 'users.create', 'users.edit', 'users.delete']) && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No tienes permisos para gestionar usuarios.
        </div>
      )}
    </div>
  );
};

// ===== EJEMPLO 3: Componentes de Protección Granular =====

const UserCard = ({ user }: { user: any }) => {
  const { userProfile } = useAuth();

  return (
    <div className="border p-4 rounded-lg">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      
      {/* Botón de editar - solo visible si tiene permiso */}
      <PermissionGuard 
        permission="users.edit" 
        userProfile={userProfile}
        fallback={<span className="text-gray-400">Sin permisos para editar</span>}
      >
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Editar
        </button>
      </PermissionGuard>
      
      {/* Botón de eliminar - solo visible si tiene permiso */}
      <PermissionGuard 
        permission="users.delete" 
        userProfile={userProfile}
        fallback={null} // No mostrar nada si no tiene permiso
      >
        <button className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-2">
          Eliminar
        </button>
      </PermissionGuard>
    </div>
  );
};

// ===== EJEMPLO 4: Protección con Múltiples Permisos =====

const AdminPanel = () => {
  const { userProfile } = useAuth();

  return (
    <div>
      <h1>Panel de Administración</h1>
      
      {/* Sección de usuarios - requiere permisos de gestión de usuarios */}
      <MultiPermissionGuard
        permissions={['users.view', 'users.create', 'users.edit']}
        userProfile={userProfile}
        requireAll={false} // Requiere al menos uno
        fallback={<div>No tienes permisos para gestionar usuarios</div>}
      >
        <div className="border p-4 rounded mb-4">
          <h2>Gestión de Usuarios</h2>
          <p>Puedes gestionar usuarios aquí</p>
        </div>
      </MultiPermissionGuard>
      
      {/* Sección de reportes - requiere TODOS los permisos */}
      <MultiPermissionGuard
        permissions={['reports.view', 'reports.export']}
        userProfile={userProfile}
        requireAll={true} // Requiere todos los permisos
        fallback={<div>Necesitas permisos de visualización y exportación de reportes</div>}
      >
        <div className="border p-4 rounded mb-4">
          <h2>Reportes Avanzados</h2>
          <p>Puedes ver y exportar reportes</p>
        </div>
      </MultiPermissionGuard>
    </div>
  );
};

// ===== EJEMPLO 5: Mostrar Permisos del Usuario =====

const UserProfile = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div>No hay usuario autenticado</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Perfil de Usuario</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Información Básica</h2>
          <p><strong>Nombre:</strong> {userProfile.displayName}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Rol:</strong> {userProfile.role}</p>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Permisos Asignados</h2>
          {userProfile.permissions && userProfile.permissions.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Tienes {userProfile.permissions.length} permisos asignados:
              </p>
              <PermissionList 
                permissions={userProfile.permissions}
                size="sm"
                groupBy={true}
                showDescription={false}
              />
            </div>
          ) : (
            <p className="text-gray-500">No tienes permisos específicos asignados</p>
          )}
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Capacidades</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`p-2 rounded ${userProfile.permissions?.includes('users.view') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Ver Usuarios
            </div>
            <div className={`p-2 rounded ${userProfile.permissions?.includes('users.create') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Crear Usuarios
            </div>
            <div className={`p-2 rounded ${userProfile.permissions?.includes('users.edit') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Editar Usuarios
            </div>
            <div className={`p-2 rounded ${userProfile.permissions?.includes('users.delete') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Eliminar Usuarios
            </div>
            <div className={`p-2 rounded ${userProfile.permissions?.includes('reports.view') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Ver Reportes
            </div>
            <div className={`p-2 rounded ${userProfile.permissions?.includes('security.view') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              Ver Seguridad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== EJEMPLO 6: Dashboard Condicional =====

const ConditionalDashboard = () => {
  const { userProfile } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions(userProfile);

  if (!userProfile) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard - {userProfile.displayName}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta de Usuarios */}
          {hasPermission('users.view') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Gestión de Usuarios</h2>
              <p className="text-gray-600 mb-4">Administra usuarios del sistema</p>
              <div className="space-y-2">
                {hasPermission('users.create') && (
                  <button className="w-full bg-blue-500 text-white py-2 px-4 rounded">
                    Crear Usuario
                  </button>
                )}
                {hasPermission('users.edit') && (
                  <button className="w-full bg-green-500 text-white py-2 px-4 rounded">
                    Editar Usuarios
                  </button>
                )}
                {hasPermission('users.delete') && (
                  <button className="w-full bg-red-500 text-white py-2 px-4 rounded">
                    Eliminar Usuarios
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Tarjeta de Reportes */}
          {hasAnyPermission(['reports.view', 'analytics.view']) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Reportes y Analytics</h2>
              <p className="text-gray-600 mb-4">Visualiza datos y estadísticas</p>
              <div className="space-y-2">
                {hasPermission('reports.view') && (
                  <button className="w-full bg-purple-500 text-white py-2 px-4 rounded">
                    Ver Reportes
                  </button>
                )}
                {hasPermission('analytics.view') && (
                  <button className="w-full bg-indigo-500 text-white py-2 px-4 rounded">
                    Ver Analytics
                  </button>
                )}
                {hasPermission('reports.export') && (
                  <button className="w-full bg-orange-500 text-white py-2 px-4 rounded">
                    Exportar Datos
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Tarjeta de Seguridad */}
          {hasPermission('security.view') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Seguridad</h2>
              <p className="text-gray-600 mb-4">Monitorea la seguridad del sistema</p>
              <div className="space-y-2">
                {hasPermission('security.monitor') && (
                  <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded">
                    Monitorear
                  </button>
                )}
                {hasPermission('security.cameras') && (
                  <button className="w-full bg-gray-500 text-white py-2 px-4 rounded">
                    Ver Cámaras
                  </button>
                )}
                {hasPermission('security.alerts') && (
                  <button className="w-full bg-red-500 text-white py-2 px-4 rounded">
                    Gestionar Alertas
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Mensaje si no tiene permisos */}
          {!hasAnyPermission(['users.view', 'reports.view', 'analytics.view', 'security.view']) && (
            <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Sin Permisos Específicos
              </h2>
              <p className="text-yellow-700">
                No tienes permisos específicos asignados. Contacta al super administrador 
                para obtener acceso a las funcionalidades del sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== EXPORTAR EJEMPLOS =====

export {
  ProtectedUserManagement,
  UserActions,
  UserCard,
  AdminPanel,
  UserProfile,
  ConditionalDashboard
};

// ===== NOTAS DE USO =====

/*
INSTRUCCIONES DE USO:

1. Protección de Rutas:
   - Usa ProtectedRoute con requiredPermission o requiredPermissions
   - Especifica si requiere todos los permisos (requireAllPermissions=true) o cualquiera (false)

2. Hook usePermissions:
   - Proporciona funciones para verificar permisos en componentes
   - hasPermission(permission) - verifica un permiso específico
   - hasAnyPermission(permissions) - verifica si tiene al menos uno
   - hasAllPermissions(permissions) - verifica si tiene todos

3. Componentes de Protección:
   - PermissionGuard - protege un elemento con un permiso específico
   - MultiPermissionGuard - protege con múltiples permisos
   - Especifica fallback para mostrar cuando no tiene permisos

4. Mejores Prácticas:
   - Siempre verifica permisos tanto en cliente como servidor
   - Usa mensajes informativos cuando no se tienen permisos
   - Agrupa permisos relacionados para mejor UX
   - Documenta qué permisos requiere cada funcionalidad

5. Seguridad:
   - Los permisos se validan en el servidor
   - Los super admins siempre tienen todos los permisos
   - Los permisos se almacenan en la base de datos
   - Se registran todas las asignaciones/revocaciones de permisos
*/
