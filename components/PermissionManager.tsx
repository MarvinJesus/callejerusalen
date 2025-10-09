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
  ChevronRight,
  Info,
  Plus,
  Minus
} from 'lucide-react';
import { 
  Permission, 
  PERMISSION_GROUPS, 
  PERMISSION_DESCRIPTIONS,
  ALL_PERMISSIONS,
  getPermissionsByGroups,
  getPermissionGroup,
  getPermissionDescription
} from '@/lib/permissions';
import { 
  PERMISSION_TEMPLATES,
  PermissionTemplate,
  getCategoryColor,
  getCategoryName
} from '@/lib/permission-templates';
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    toAdd: Permission[];
    toRemove: Permission[];
  } | null>(null);

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

  // Función para calcular cambios pendientes
  const calculatePendingChanges = () => {
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

    return { toAdd, toRemove };
  };

  // Función para mostrar modal de confirmación
  const showConfirmationModal = () => {
    const changes = calculatePendingChanges();
    
    if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
      toast('No hay cambios para guardar');
      return;
    }

    setPendingChanges(changes);
    setShowConfirmModal(true);
  };

  // Función para guardar cambios (ejecutada después de confirmar)
  const saveChanges = async () => {
    if (!userProfile || !pendingChanges) return;

    setSaving(true);
    try {
      // Aplicar cambios solo si hay algo que cambiar
      if (pendingChanges.toAdd.length > 0) {
        await assignPermissions(targetUser.uid, pendingChanges.toAdd, userProfile.uid);
      }

      if (pendingChanges.toRemove.length > 0) {
        await revokePermissions(targetUser.uid, pendingChanges.toRemove, userProfile.uid);
      }

      // Recargar permisos
      await loadUserPermissions();
      
      const totalChanges = pendingChanges.toAdd.length + pendingChanges.toRemove.length;
      toast.success(`Permisos actualizados correctamente (${totalChanges} cambios aplicados)`);
      onPermissionsUpdated?.();
      
      // Cerrar modal y limpiar estado
      setShowConfirmModal(false);
      setPendingChanges(null);
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      toast.error('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  // Función para aplicar una plantilla
  const applyTemplate = (template: PermissionTemplate) => {
    const newStates: Record<Permission, boolean> = {} as Record<Permission, boolean>;
    
    // Establecer todos los permisos como false primero
    ALL_PERMISSIONS.forEach(permission => {
      newStates[permission] = false;
    });
    
    // Activar solo los permisos de la plantilla
    template.permissions.forEach(permission => {
      newStates[permission] = true;
    });
    
    setPermissionStates(newStates);
    setSelectedTemplate(template);
    setHasChanges(true);
    toast.success(`Plantilla "${template.name}" aplicada`);
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
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Plantillas</span>
            </button>
            <button
              onClick={showConfirmationModal}
              disabled={saving || !hasChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plantillas de Permisos */}
      {showTemplates && (
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Plantillas de Permisos</h4>
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona una plantilla predefinida para aplicar un conjunto de permisos comunes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERMISSION_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className={`text-left p-4 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
                    {getCategoryName(template.category)}
                  </span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">{template.name}</h5>
                <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                <p className="text-xs text-gray-500">{template.permissions.length} permisos</p>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Modal de Confirmación */}
      {showConfirmModal && pendingChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Cambios de Permisos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Revisa los cambios antes de aplicar
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingChanges(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Usuario */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{targetUser.displayName}</h4>
                    <p className="text-sm text-gray-600">{targetUser.email}</p>
                    <p className="text-sm text-gray-500">Rol: {targetUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Resumen de Cambios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Permisos a Agregar */}
                {pendingChanges.toAdd.length > 0 && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <Plus className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-900">
                        Permisos a Agregar ({pendingChanges.toAdd.length})
                      </h4>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {pendingChanges.toAdd.map((permission) => (
                        <div key={permission} className="flex items-start space-x-3 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-green-800 font-medium block">{permission}</span>
                            <span className="text-green-600 text-xs">{getPermissionDescription(permission)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permisos a Remover */}
                {pendingChanges.toRemove.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <Minus className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-red-900">
                        Permisos a Remover ({pendingChanges.toRemove.length})
                      </h4>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {pendingChanges.toRemove.map((permission) => (
                        <div key={permission} className="flex items-start space-x-3 text-sm">
                          <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-red-800 font-medium block">{permission}</span>
                            <span className="text-red-600 text-xs">{getPermissionDescription(permission)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Estado Actual vs Nuevo */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Resumen de Cambios</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-medium text-blue-800 mb-2">Estado Actual:</p>
                    <p className="text-blue-700 mb-3">{userPermissions.length} permisos activos</p>
                    {userPermissions.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {userPermissions.map((permission) => (
                          <div key={permission} className="text-xs">
                            <span className="text-blue-700 font-medium">{permission}</span>
                            <span className="text-blue-500 ml-2">{getPermissionDescription(permission)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 mb-2">Después del Cambio:</p>
                    <p className="text-blue-700 mb-3">
                      {userPermissions.length + pendingChanges.toAdd.length - pendingChanges.toRemove.length} permisos activos
                    </p>
                    <div className="text-xs text-blue-600">
                      <p>• Se agregarán: {pendingChanges.toAdd.length} permisos</p>
                      <p>• Se removerán: {pendingChanges.toRemove.length} permisos</p>
                      <p>• Cambio neto: {pendingChanges.toAdd.length - pendingChanges.toRemove.length > 0 ? '+' : ''}{pendingChanges.toAdd.length - pendingChanges.toRemove.length} permisos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Importante</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Los cambios se aplicarán inmediatamente. El usuario verá los nuevos permisos 
                      la próxima vez que acceda al sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingChanges(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Confirmar y Aplicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;