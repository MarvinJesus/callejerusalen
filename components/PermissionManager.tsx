'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Save, 
  RefreshCw, 
  Users, 
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  Permission, 
  PERMISSION_GROUPS, 
  PERMISSION_DESCRIPTIONS,
  ALL_PERMISSIONS,
  getPermissionsByGroups,
  getPermissionGroup
} from '@/lib/permissions';
import { 
  assignPermissions, 
  revokePermissions, 
  getUserPermissions,
  UserProfile 
} from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface PermissionManagerProps {
  targetUser: UserProfile;
  onPermissionsUpdated?: () => void;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({
  targetUser,
  onPermissionsUpdated
}) => {
  const { userProfile } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [permissionStates, setPermissionStates] = useState<Record<Permission, boolean>>({} as Record<Permission, boolean>);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar permisos del usuario
  useEffect(() => {
    loadUserPermissions();
  }, [targetUser.uid]);

  const loadUserPermissions = async () => {
    setLoading(true);
    try {
      const permissions = await getUserPermissions(targetUser.uid);
      setUserPermissions(permissions);
      
      // Inicializar estados de TODOS los permisos disponibles
      const initialStates: Record<Permission, boolean> = {} as Record<Permission, boolean>;
      
      // Inicializar todos los permisos como false primero
      ALL_PERMISSIONS.forEach(permission => {
        initialStates[permission] = false;
      });
      
      // Luego marcar como true solo los que el usuario ya tiene
      permissions.forEach(permission => {
        initialStates[permission] = true;
      });
      
      setPermissionStates(initialStates);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error('Error al cargar permisos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar un permiso
  const togglePermission = (permission: Permission) => {
    setPermissionStates(prev => {
      const newStates = { ...prev, [permission]: !prev[permission] };
      
      // Verificar si hay cambios
      const hasChanges = Object.keys(newStates).some(key => {
        const perm = key as Permission;
        const wasActive = userPermissions.includes(perm);
        const isNowActive = newStates[perm];
        return wasActive !== isNowActive;
      });
      
      setHasChanges(hasChanges);
      return newStates;
    });
  };

  // Función para guardar cambios
  const saveChanges = async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
      // Calcular cambios
      const toAdd: Permission[] = [];
      const toRemove: Permission[] = [];

      Object.entries(permissionStates).forEach(([permission, isActive]) => {
        const perm = permission as Permission;
        const wasActive = userPermissions.includes(perm);
        
        if (wasActive && !isActive) {
          toRemove.push(perm);
        } else if (!wasActive && isActive) {
          toAdd.push(perm);
        }
      });

      // Aplicar cambios solo si hay algo que cambiar
      if (toAdd.length > 0) {
        await assignPermissions(targetUser.uid, toAdd, userProfile.uid);
      }

      if (toRemove.length > 0) {
        await revokePermissions(targetUser.uid, toRemove, userProfile.uid);
      }

      // Recargar permisos
      await loadUserPermissions();
      
      toast.success('Permisos actualizados correctamente');
      onPermissionsUpdated?.();
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      toast.error('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  // Función para alternar grupo
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Función para obtener el estado visual de un permiso
  const getPermissionState = (permission: Permission) => {
    const isActive = permissionStates[permission] || false;
    const wasActive = userPermissions.includes(permission);
    
    if (isActive && wasActive) return 'active'; // Ya tenía el permiso y sigue activo
    if (isActive && !wasActive) return 'adding'; // Se va a agregar
    if (!isActive && wasActive) return 'removing'; // Se va a remover
    return 'inactive'; // No tiene el permiso y no se va a agregar
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando permisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información del usuario */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gestión de Permisos
            </h3>
            <p className="text-sm text-gray-600">
              Usuario: {targetUser.displayName} ({targetUser.email})
            </p>
            <p className="text-sm text-gray-500">
              Rol: {targetUser.role} | Estado: {targetUser.isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-sm text-orange-600 font-medium">
                Cambios pendientes
              </span>
            )}
            <button
              onClick={saveChanges}
              disabled={saving || !hasChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grupos de permisos */}
      <div className="space-y-4">
        {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
          const isExpanded = expandedGroups.has(groupName);
          // Mostrar todos los permisos del grupo, no solo los que el usuario tiene
          const groupPermissions = permissions;
          
          return (
            <div key={groupName} className="border border-gray-200 rounded-lg">
              {/* Header del grupo */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{groupName}</h4>
                  <span className="text-sm text-gray-500">
                    ({groupPermissions.length} permisos)
                  </span>
                </div>
              </button>

              {/* Contenido del grupo */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {permissions.map((permission) => {
                    const state = getPermissionState(permission);
                    const isActive = permissionStates[permission] || false;
                    
                    return (
                      <div key={permission} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h5 className="font-medium text-gray-900">{permission}</h5>
                            {state === 'adding' && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                + Agregar
                              </span>
                            )}
                            {state === 'removing' && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                - Remover
                              </span>
                            )}
                            {state === 'active' && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {PERMISSION_DESCRIPTIONS[permission] || 'Sin descripción disponible'}
                          </p>
                        </div>
                        
                        {/* Toggle */}
                        <button
                          onClick={() => togglePermission(permission)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isActive ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Información sobre Permisos</h4>
            <p className="text-sm text-blue-700 mt-1">
              Los cambios se aplicarán de forma incremental. Solo se modificarán los permisos que hayas cambiado.
              Los toggles verdes indican permisos activos, los grises indican permisos inactivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;