'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { 
  Shield, 
  Users, 
  Settings, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Save, 
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Permission, 
  ALL_PERMISSIONS, 
  PERMISSION_GROUPS, 
  PERMISSION_DESCRIPTIONS,
  DEFAULT_PERMISSIONS,
  getPermissionDescription,
  getPermissionGroup,
  getPermissionsByGroups
} from '@/lib/permissions';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}

const AdminPermissionsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);

  useEffect(() => {
    loadUsers();
    loadTemplates();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = () => {
    const defaultTemplates: PermissionTemplate[] = [
      {
        id: 'super_admin',
        name: 'Super Administrador',
        description: 'Acceso completo a todas las funcionalidades del sistema',
        permissions: ALL_PERMISSIONS,
        isDefault: true
      },
      {
        id: 'admin_full',
        name: 'Administrador Completo',
        description: 'Administrador con todos los permisos excepto configuración del sistema',
        permissions: ALL_PERMISSIONS.filter(p => !p.startsWith('system.')),
        isDefault: true
      },
      {
        id: 'admin_basic',
        name: 'Administrador Básico',
        description: 'Permisos básicos de administración',
        permissions: [
          'users.view',
          'registrations.view',
          'security.view',
          'reports.view',
          'community.view'
        ],
        isDefault: true
      },
      {
        id: 'moderator',
        name: 'Moderador',
        description: 'Permisos de moderación y gestión de contenido',
        permissions: [
          'users.view',
          'registrations.view',
          'registrations.approve',
          'registrations.reject',
          'community.view',
          'community.edit'
        ],
        isDefault: true
      },
      {
        id: 'viewer',
        name: 'Solo Lectura',
        description: 'Solo permisos de visualización',
        permissions: [
          'users.view',
          'registrations.view',
          'security.view',
          'reports.view',
          'analytics.view',
          'logs.view',
          'community.view'
        ],
        isDefault: true
      }
    ];
    setTemplates(defaultTemplates);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserPermissions([...user.permissions]);
  };

  const handlePermissionToggle = (permission: Permission) => {
    setUserPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleGroupToggle = (groupPermissions: Permission[]) => {
    const hasAllGroupPermissions = groupPermissions.every(p => userPermissions.includes(p));
    
    if (hasAllGroupPermissions) {
      // Remover todos los permisos del grupo
      setUserPermissions(prev => prev.filter(p => !groupPermissions.includes(p)));
    } else {
      // Agregar todos los permisos del grupo
      const newPermissions = [...userPermissions];
      groupPermissions.forEach(permission => {
        if (!newPermissions.includes(permission)) {
          newPermissions.push(permission);
        }
      });
      setUserPermissions(newPermissions);
    }
  };

  const handleTemplateApply = (template: PermissionTemplate) => {
    setUserPermissions([...template.permissions]);
    toast.success(`Plantilla "${template.name}" aplicada`);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: userPermissions
        }),
      });

      if (response.ok) {
        toast.success('Permisos actualizados exitosamente');
        // Actualizar el usuario en la lista
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, permissions: userPermissions, updatedAt: new Date() }
            : user
        ));
        setSelectedUser(prev => prev ? { ...prev, permissions: userPermissions, updatedAt: new Date() } : null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al actualizar permisos');
      }
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      toast.error('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPermissions = () => {
    if (!selectedUser) return;
    const defaultPerms = DEFAULT_PERMISSIONS[selectedUser.role] || [];
    setUserPermissions([...defaultPerms]);
    toast.success('Permisos restaurados a valores por defecto');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'comunidad': return 'bg-green-100 text-green-800';
      case 'visitante': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission="permissions.assign">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Panel de Administración
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Permisos</h1>
                  <p className="text-gray-600 mt-1">Asignar y gestionar permisos de usuarios</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Usuarios */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Usuarios</h2>
                </div>
                
                {/* Filtros */}
                <div className="px-6 py-4 border-b border-gray-200 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="comunidad">Comunidad</option>
                    <option value="visitante">Visitante</option>
                  </select>
                </div>

                {/* Lista */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedUser?.id === user.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                  {getStatusText(user.status)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                {user.permissions.length} permisos
                              </span>
                              {selectedUser?.id === user.id && (
                                <Check className="w-4 h-4 text-primary-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de Permisos */}
            <div className="lg:col-span-2">
              {selectedUser ? (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          Permisos de {selectedUser.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedUser.email} • {userPermissions.length} permisos asignados
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Plantillas
                        </button>
                        <button
                          onClick={handleResetPermissions}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Restaurar
                        </button>
                        <button
                          onClick={handleSavePermissions}
                          disabled={saving}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plantillas */}
                  {showTemplates && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Plantillas de Permisos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className="border border-gray-200 rounded-md p-3 hover:border-primary-300 cursor-pointer transition-colors"
                            onClick={() => handleTemplateApply(template)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                              {template.isDefault && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Por defecto
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                            <p className="text-xs text-gray-400">{template.permissions.length} permisos</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grupos de Permisos */}
                  <div className="px-6 py-4">
                    <div className="space-y-6">
                      {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
                        const hasAllGroupPermissions = groupPermissions.every(p => userPermissions.includes(p));
                        const hasSomeGroupPermissions = groupPermissions.some(p => userPermissions.includes(p));
                        
                        return (
                          <div key={groupName} className="border border-gray-200 rounded-lg">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => handleGroupToggle(groupPermissions)}
                                    className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-primary-600"
                                  >
                                    {hasAllGroupPermissions ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : hasSomeGroupPermissions ? (
                                      <div className="w-4 h-4 border-2 border-yellow-400 rounded"></div>
                                    ) : (
                                      <X className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="capitalize">
                                      {groupName.replace('_', ' ')}
                                    </span>
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {groupPermissions.filter(p => userPermissions.includes(p)).length} / {groupPermissions.length}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {groupPermissions.map((permission) => (
                                  <div
                                    key={permission}
                                    className="flex items-center space-x-3"
                                  >
                                    <button
                                      onClick={() => handlePermissionToggle(permission)}
                                      className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        userPermissions.includes(permission)
                                          ? 'bg-primary-600 border-primary-600 text-white'
                                          : 'border-gray-300 hover:border-primary-400'
                                      }`}
                                    >
                                      {userPermissions.includes(permission) && (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">
                                        {permission}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {getPermissionDescription(permission)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona un usuario
                  </h3>
                  <p className="text-gray-500">
                    Elige un usuario de la lista para gestionar sus permisos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPermissionsPage;

