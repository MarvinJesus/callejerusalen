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
  Unlock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Crown,
  Award,
  Star,
  Home,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Verificar permisos antes de cargar
    if (!userProfile) {
      console.log('⏳ Esperando perfil de usuario...');
      return;
    }

    console.log('👤 Perfil de usuario:', userProfile);
    console.log('🔑 Rol:', userProfile.role);

    // Verificar si el usuario tiene permisos de administrador
    if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      console.log('❌ Usuario sin permisos de administrador');
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }

    console.log('✅ Usuario autorizado, cargando datos...');
    loadUsers();
    loadTemplates();
  }, [userProfile]);

  // Detectar usuario preseleccionado desde la URL
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId);
      if (user) {
        handleUserSelect(user);
        // Expandir todos los grupos por defecto para mejor UX
        setExpandedGroups(new Set(Object.keys(PERMISSION_GROUPS)));
      }
    }
  }, [searchParams, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Cargando usuarios...');
      console.log('👤 Usuario autenticado:', user?.email);
      
      // Obtener token de autenticación
      if (!user) {
        console.log('❌ Usuario no autenticado');
        setError('Usuario no autenticado');
        return;
      }

      console.log('🔑 Obteniendo token...');
      const idToken = await user.getIdToken();
      console.log('✅ Token obtenido');
      
      console.log('📡 Enviando request a /api/admin/users...');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      console.log('📨 Respuesta recibida:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos de usuarios:', data);
        setUsers(data.users || []);
        setError('');
      } else {
        const errorData = await response.json();
        console.log('❌ Error en respuesta:', errorData);
        setError(errorData.error || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      setError(`Error al cargar usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
    
    // Si es el super admin principal, asignar todos los permisos disponibles
    if (user.email === 'mar90jesus@gmail.com') {
      const allPermissions = Object.values(PERMISSION_GROUPS).flat();
      setUserPermissions(allPermissions);
      setOriginalPermissions(allPermissions);
    } else {
      setUserPermissions([...user.permissions]);
      setOriginalPermissions([...user.permissions]);
    }
    
    setHasChanges(false);
    // Scroll suave hacia el panel de permisos en móvil
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('permissions-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    setUserPermissions(prev => {
      const newPerms = prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission];
      
      // Detectar si hay cambios comparando con los permisos originales
      const changed = JSON.stringify([...newPerms].sort()) !== JSON.stringify([...originalPermissions].sort());
      setHasChanges(changed);
      
      return newPerms;
    });
  };

  const handleGroupToggle = (groupPermissions: Permission[]) => {
    const hasAllGroupPermissions = groupPermissions.every(p => userPermissions.includes(p));
    
    setUserPermissions(prev => {
      let newPerms: Permission[];
      
      if (hasAllGroupPermissions) {
        // Remover todos los permisos del grupo
        newPerms = prev.filter(p => !groupPermissions.includes(p));
      } else {
        // Agregar todos los permisos del grupo
        newPerms = [...prev];
        groupPermissions.forEach(permission => {
          if (!newPerms.includes(permission)) {
            newPerms.push(permission);
          }
        });
      }
      
      // Detectar cambios
      const changed = JSON.stringify([...newPerms].sort()) !== JSON.stringify([...originalPermissions].sort());
      setHasChanges(changed);
      
      return newPerms;
    });
  };

  const handleTemplateApply = (template: PermissionTemplate) => {
    setUserPermissions([...template.permissions]);
    const changed = JSON.stringify([...template.permissions].sort()) !== JSON.stringify([...originalPermissions].sort());
    setHasChanges(changed);
    toast.success(`Plantilla "${template.name}" aplicada`);
  };

  const toggleGroupExpansion = (groupName: string) => {
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

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    if (!hasChanges) {
      toast('No hay cambios para guardar');
      return;
    }

    try {
      setSaving(true);
      
      // Obtener token de autenticación
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          permissions: userPermissions
        }),
      });

      if (response.ok) {
        toast.success('✅ Permisos actualizados exitosamente');
        // Actualizar el usuario en la lista
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, permissions: userPermissions, updatedAt: new Date() }
            : user
        ));
        setSelectedUser(prev => prev ? { ...prev, permissions: userPermissions, updatedAt: new Date() } : null);
        setOriginalPermissions([...userPermissions]);
        setHasChanges(false);
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
    setUserPermissions([...originalPermissions]);
    setHasChanges(false);
    toast.success('✅ Cambios descartados, permisos restaurados');
  };

  const handleResetToDefaults = () => {
    if (!selectedUser) return;
    const defaultPerms = DEFAULT_PERMISSIONS[selectedUser.role] || [];
    setUserPermissions([...defaultPerms]);
    const changed = JSON.stringify([...defaultPerms].sort()) !== JSON.stringify([...originalPermissions].sort());
    setHasChanges(changed);
    toast.success('✅ Permisos restaurados a valores por defecto del rol');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Mejorado */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/admin/admin-dashboard"
                  className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium group"
                >
                  <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Volver al Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Centro de Permisos
                    </h1>
                    <p className="text-gray-600 mt-1 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span>Gestión centralizada y unificada</span>
                    </p>
                  </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Usuarios Mejorada */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-blue-400">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-white" />
                    <h2 className="text-lg font-semibold text-white">Usuarios</h2>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">Selecciona para gestionar</p>
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

                {/* Lista Mejorada */}
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                      <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUser?.id === user.id;
                        const getRoleIcon = (role: string) => {
                          if (role === 'super_admin') return <Crown className="w-4 h-4" />;
                          if (role === 'admin') return <Award className="w-4 h-4" />;
                          return <Star className="w-4 h-4" />;
                        };
                        
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className={`px-6 py-4 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-md' 
                                : 'hover:bg-gray-50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  {getRoleIcon(user.role)}
                                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {user.name}
                                    {user.email === 'mar90jesus@gmail.com' && (
                                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                        PROTEGIDO
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {user.email}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(user.role)}`}>
                                    {user.role}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(user.status)}`}>
                                    {getStatusText(user.status)}
                                  </span>
                                  {user.email === 'mar90jesus@gmail.com' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Solo Lectura
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end ml-3">
                                {isSelected && (
                                  <Check className="w-5 h-5 text-blue-600 mb-1" />
                                )}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {user.email === 'mar90jesus@gmail.com' 
                                    ? `${Object.values(PERMISSION_GROUPS).flat().length} permisos (Todos)`
                                    : `${user.permissions.length} permisos`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de Permisos Mejorado */}
            <div className="lg:col-span-2" id="permissions-panel">
              {selectedUser ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                  {/* Header del Panel Optimizado */}
                  <div className={`px-6 py-4 border-b ${selectedUser.email === 'mar90jesus@gmail.com' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          {selectedUser.email === 'mar90jesus@gmail.com' ? (
                            <Crown className="w-5 h-5 text-white flex-shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-white flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-white truncate">
                              {selectedUser.name}
                              {selectedUser.email === 'mar90jesus@gmail.com' && (
                                <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                  SUPER ADMIN PRINCIPAL
                                </span>
                              )}
                            </h2>
                            <p className="text-blue-100 text-sm truncate">
                              {selectedUser.email} • {selectedUser.email === 'mar90jesus@gmail.com' 
                                ? `${Object.values(PERMISSION_GROUPS).flat().length} permisos (Todos)`
                                : `${userPermissions.length} permisos`
                              }
                            </p>
                          </div>
                          {hasChanges && selectedUser.email !== 'mar90jesus@gmail.com' && (
                            <span className="animate-pulse px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex-shrink-0">
                              ⚠ Sin guardar
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {selectedUser.email !== 'mar90jesus@gmail.com' ? (
                          <>
                            <button
                              onClick={() => setShowTemplates(!showTemplates)}
                              className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs font-medium rounded-md transition-all"
                              title="Plantillas de permisos"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Plantillas</span>
                            </button>
                            <button
                              onClick={handleSavePermissions}
                              disabled={saving || !hasChanges}
                              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Guardar cambios"
                            >
                              {saving ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  <span className="hidden sm:inline">Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  <span className="hidden sm:inline">Guardar</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-md">
                            <Lock className="w-3 h-3" />
                            <span className="hidden sm:inline">Solo Lectura</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nota especial para Super Admin Principal */}
                  {selectedUser.email === 'mar90jesus@gmail.com' && (
                    <div className="px-6 py-4 border-b border-red-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-purple-900">
                            Super Administrador Principal
                          </h3>
                          <p className="text-xs text-purple-700 mt-1">
                            Este usuario tiene acceso completo a todos los permisos del sistema. Los permisos no se pueden modificar por seguridad.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plantillas Mejoradas */}
                  {showTemplates && selectedUser.email !== 'mar90jesus@gmail.com' && (
                    <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Plantillas de Permisos</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleResetToDefaults}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                            title="Restaurar permisos por defecto del rol"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Por Defecto
                          </button>
                          <button
                            onClick={handleResetPermissions}
                            disabled={!hasChanges}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Descartar cambios pendientes"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Descartar
                          </button>
                          <button
                            onClick={() => setShowTemplates(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Aplica un conjunto predefinido de permisos con un solo clic
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className="group border-2 border-blue-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all hover:scale-105 bg-white"
                            onClick={() => handleTemplateApply(template)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {template.name}
                              </h4>
                              {template.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                  ⭐ Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-blue-600">{template.permissions.length} permisos</p>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-medium text-blue-600">Aplicar →</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grupos de Permisos Mejorados */}
                  <div className="px-6 py-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Permisos por Categoría</h3>
                      <button
                        onClick={() => {
                          const allGroups = Object.keys(PERMISSION_GROUPS);
                          if (expandedGroups.size === allGroups.length) {
                            setExpandedGroups(new Set());
                          } else {
                            setExpandedGroups(new Set(allGroups));
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedGroups.size === Object.keys(PERMISSION_GROUPS).length ? 'Colapsar Todos' : 'Expandir Todos'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
                        const hasAllGroupPermissions = groupPermissions.every(p => userPermissions.includes(p));
                        const hasSomeGroupPermissions = groupPermissions.some(p => userPermissions.includes(p));
                        const activeCount = groupPermissions.filter(p => userPermissions.includes(p)).length;
                        const isExpanded = expandedGroups.has(groupName);
                        
                        return (
                          <div key={groupName} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all">
                            {/* Header del Grupo */}
                            <div className={`px-5 py-4 cursor-pointer ${
                              hasAllGroupPermissions 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                                : hasSomeGroupPermissions 
                                ? 'bg-gradient-to-r from-yellow-50 to-amber-50' 
                                : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <button
                                    onClick={() => toggleGroupExpansion(groupName)}
                                    className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-5 h-5 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-600" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleGroupToggle(groupPermissions)}
                                    disabled={selectedUser.email === 'mar90jesus@gmail.com'}
                                    className={`flex items-center space-x-2 transition-transform ${
                                      selectedUser.email === 'mar90jesus@gmail.com' 
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'hover:scale-105'
                                    }`}
                                  >
                                    {selectedUser.email === 'mar90jesus@gmail.com' ? (
                                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-white" />
                                      </div>
                                    ) : hasAllGroupPermissions ? (
                                      <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                      </div>
                                    ) : hasSomeGroupPermissions ? (
                                      <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center">
                                        <Minus className="w-4 h-4 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 border-2 border-gray-400 rounded-lg"></div>
                                    )}
                                  </button>
                                  <div>
                                    <h4 className="font-bold text-gray-900 capitalize text-base">
                                      {groupName.replace(/_/g, ' ')}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      {activeCount > 0 ? `${activeCount} de ${groupPermissions.length} activos` : `${groupPermissions.length} permisos disponibles`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-gray-700">
                                      {activeCount} / {groupPermissions.length}
                                    </div>
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                      <div 
                                        className={`h-full transition-all ${
                                          hasAllGroupPermissions ? 'bg-green-500' : hasSomeGroupPermissions ? 'bg-yellow-400' : 'bg-gray-300'
                                        }`}
                                        style={{ width: `${(activeCount / groupPermissions.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Contenido del Grupo (Colapsable) */}
                            {isExpanded && (
                              <div className="p-5 bg-white">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {groupPermissions.map((permission) => {
                                    const isActive = userPermissions.includes(permission);
                                    return (
                                      <div
                                        key={permission}
                                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                          isActive 
                                            ? 'border-blue-300 bg-blue-50' 
                                            : 'border-gray-200 hover:border-blue-200'
                                        }`}
                                      >
                                        <button
                                          onClick={() => handlePermissionToggle(permission)}
                                          disabled={selectedUser.email === 'mar90jesus@gmail.com'}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                                            selectedUser.email === 'mar90jesus@gmail.com' 
                                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 cursor-not-allowed opacity-75'
                                              : isActive 
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                                                : 'bg-gray-300'
                                          }`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              selectedUser.email === 'mar90jesus@gmail.com' || isActive ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                          />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {permission}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-1">
                                            {getPermissionDescription(permission)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Selecciona un Usuario
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Elige un usuario de la lista de la izquierda para comenzar a gestionar sus permisos de forma centralizada
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Info className="w-4 h-4" />
                      <span>Los cambios se aplicarán inmediatamente al guardar</span>
                    </div>
                  </div>
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

