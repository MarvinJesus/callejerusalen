'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  AlertTriangle, 
  UserCheck, 
  UserX,
  Eye,
  EyeOff,
  Camera,
  MapPin,
  Bell,
  Plus,
  Edit,
  Trash2,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import { 
  getAllUsers, 
  createUserAsAdmin, 
  deleteUserAsAdmin, 
  updateUserAsAdmin,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  isMainSuperAdmin,
  canDeleteUser,
  canModifyUserRole,
  changeUserStatus,
  reactivateUser,
  recoverUser,
  getUsersByStatus,
  UserProfile,
  RegistrationRequest,
  UserRole,
  UserStatus
} from '@/lib/auth';
import { getServerLogs, getSystemMetrics, ServerLog } from '@/lib/server-logging';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<ServerLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState<UserProfile | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ requestId: string; reason: string } | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [showStatusModal, setShowStatusModal] = useState<{ user: UserProfile; action: 'activate' | 'deactivate' | 'delete' } | null>(null);

  // Función para separar usuarios por categorías
  const categorizeUsers = (users: UserProfile[]) => {
    const categories = {
      superAdmins: users.filter(user => user.role === 'super_admin'),
      admins: users.filter(user => user.role === 'admin'),
      community: users.filter(user => user.role === 'comunidad' || user.role === 'visitante')
    };
    return categories;
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'registrations', label: 'Solicitudes', icon: Clock },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  // Cargar datos al montar el componente
  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
      loadDashboardData();
    }
  }, [userProfile, userStatusFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando datos del dashboard...');
      
      // Cargar usuarios según el filtro de estado
      console.log('👥 Cargando usuarios...');
      let usersData: UserProfile[];
      
      if (userStatusFilter === 'all') {
        usersData = await getAllUsers(true); // Incluir eliminados para vista completa
      } else {
        usersData = await getUsersByStatus(userStatusFilter as UserStatus);
      }
      
      console.log(`✅ Usuarios cargados: ${usersData.length} (filtro: ${userStatusFilter})`, usersData);
      setUsers(usersData);
      
      // Cargar el resto de datos
      console.log('📋 Cargando logs...');
      const [registrationsData, logsData, metricsData] = await Promise.all([
        getPendingRegistrations(),
        getServerLogs(50),
        getSystemMetrics()
      ]);
      
      console.log('📋 Logs obtenidos:', logsData);
      setPendingRegistrations(registrationsData);
      setSystemLogs(logsData);
      setMetrics(metricsData);
      
      console.log('✅ Todos los datos cargados exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
      
      // Mostrar error específico
      if (error instanceof Error) {
        console.error('Detalles del error:', error.message);
        console.error('Stack trace:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (requestId: string, role: UserRole = 'comunidad') => {
    if (!userProfile?.uid) return;
    
    try {
      await approveRegistration(requestId, userProfile.uid, role);
      await loadDashboardData();
    } catch (error) {
      console.error('Error al aprobar registro:', error);
    }
  };

  const handleRejectRegistration = async (requestId: string, reason: string) => {
    if (!userProfile?.uid) return;
    
    try {
      await rejectRegistration(requestId, userProfile.uid, reason);
      await loadDashboardData();
    } catch (error) {
      console.error('Error al rechazar registro:', error);
    }
  };

  const handleDeleteUser = async (uid: string, userEmail: string) => {
    if (!userProfile?.uid) return;
    
    // Verificar si se puede eliminar el usuario
    if (!canDeleteUser(userEmail)) {
      alert('No se puede eliminar al super administrador principal');
      return;
    }
    
    const reason = prompt('¿Cuál es la razón para eliminar este usuario? (opcional)');
    if (reason === null) return; // Usuario canceló
    
    try {
      await deleteUserAsAdmin(uid, userProfile.uid, reason || undefined);
      await loadDashboardData();
      alert('✅ Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar usuario');
    }
  };

  const handleChangeUserStatus = async (uid: string, newStatus: UserStatus, userEmail: string, reason?: string) => {
    if (!userProfile?.uid) return;
    
    // Verificar si se puede modificar el usuario
    if (!canDeleteUser(userEmail)) {
      alert('No se puede modificar al super administrador principal');
      return;
    }
    
    try {
      await changeUserStatus(uid, newStatus, userProfile.uid, reason);
      await loadDashboardData();
      
      const statusMessages = {
        'active': '✅ Usuario activado exitosamente',
        'inactive': '⚠️ Usuario desactivado exitosamente',
        'deleted': '🗑️ Usuario eliminado exitosamente'
      };
      
      alert(statusMessages[newStatus]);
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al cambiar estado del usuario');
    }
  };

  const handleReactivateUser = async (uid: string, userEmail: string) => {
    const reason = prompt('¿Cuál es la razón para reactivar este usuario? (opcional)');
    if (reason === null) return; // Usuario canceló
    
    await handleChangeUserStatus(uid, 'active', userEmail, reason || undefined);
  };

  const handleRecoverUser = async (uid: string, userEmail: string) => {
    const reason = prompt('¿Cuál es la razón para recuperar este usuario? (opcional)');
    if (reason === null) return; // Usuario canceló
    
    if (!confirm(`¿Estás seguro de que quieres recuperar al usuario ${userEmail}?\n\nEsto cambiará su estado de "eliminado" a "activo" y podrá acceder nuevamente al sistema.`)) {
      return;
    }
    
    try {
      await recoverUser(uid, userProfile?.uid || '', reason || undefined);
      await loadDashboardData();
      alert('✅ Usuario recuperado exitosamente');
    } catch (error) {
      console.error('Error al recuperar usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al recuperar usuario');
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<UserProfile>, userEmail: string) => {
    if (!userProfile?.uid) return;
    
    // Verificar si se puede modificar el rol del usuario
    if (updates.role && !canModifyUserRole(userEmail)) {
      alert('No se puede cambiar el rol del super administrador principal');
      return;
    }
    
    try {
      await updateUserAsAdmin(uid, updates, userProfile.uid);
      await loadDashboardData();
      setShowEditUser(null);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar usuario');
    }
  };

  const handleCreateUser = async (userData: { email: string; password: string; displayName: string; role: UserRole }) => {
    if (!userProfile?.uid) return;
    
    try {
      await createUserAsAdmin(userData.email, userData.password, userData.displayName, userData.role, userProfile.uid);
      await loadDashboardData();
      setShowCreateUser(false);
      alert('✅ Usuario creado exitosamente');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Mostrar mensaje de error específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario';
      alert(`❌ ${errorMessage}`);
    }
  };

  const stats = metrics ? [
    { label: 'Usuarios Totales', value: metrics.users.total.toString(), icon: Users, color: 'text-blue-600' },
    { label: 'Usuarios Activos', value: metrics.users.active.toString(), icon: UserCheck, color: 'text-green-600' },
    { label: 'Solicitudes Pendientes', value: pendingRegistrations.length.toString(), icon: Clock, color: 'text-yellow-600' },
    { label: 'Acciones Hoy', value: metrics.activity.actionsToday.toString(), icon: Activity, color: 'text-red-600' },
  ] : [
    { label: 'Usuarios Totales', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Usuarios Activos', value: '0', icon: UserCheck, color: 'text-green-600' },
    { label: 'Solicitudes Pendientes', value: '0', icon: Clock, color: 'text-yellow-600' },
    { label: 'Acciones Hoy', value: '0', icon: Activity, color: 'text-red-600' },
  ];

  const getRecentActivities = () => {
    if (!systemLogs.length) return [];
    
    return systemLogs.slice(0, 5).map(log => {
      const timeAgo = getTimeAgo(new Date(log.timestamp));
      const actionMap: Record<string, string> = {
        'user_created': 'Usuario creado',
        'user_updated': 'Usuario actualizado',
        'user_deleted': 'Usuario eliminado',
        'registration_approved': 'Registro aprobado',
        'registration_rejected': 'Registro rechazado'
      };
      
      return {
        action: actionMap[log.details?.action] || log.message,
        user: log.details?.userEmail || 'Sistema',
        time: timeAgo,
        type: log.details?.action?.includes('user') ? 'user' : 'request'
      };
    });
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace unos segundos';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {getRecentActivities().map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-100' :
                  activity.type === 'alert' ? 'bg-red-100' :
                  activity.type === 'security' ? 'bg-green-100' :
                  'bg-yellow-100'
                }`}>
                  {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  {activity.type === 'security' && <Shield className="w-4 h-4 text-green-600" />}
                  {activity.type === 'request' && <UserCheck className="w-4 h-4 text-yellow-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
          {getRecentActivities().length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const categorizedUsers = categorizeUsers(users);
    
    const getStatusBadge = (status: UserStatus) => {
      const statusConfig = {
        'active': { color: 'bg-green-100 text-green-800', text: 'Activo' },
        'inactive': { color: 'bg-yellow-100 text-yellow-800', text: 'Inactivo' },
        'deleted': { color: 'bg-red-100 text-red-800', text: 'Eliminado' }
      };
      const config = statusConfig[status];
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      );
    };

    const getDeletedUserInfo = (user: UserProfile) => {
      if (user.status !== 'deleted') return null;
      
      return (
        <div className="text-xs text-gray-500 mt-1">
          {user.statusChangedAt && (
            <div>Eliminado: {new Date(user.statusChangedAt).toLocaleDateString()}</div>
          )}
          {user.statusChangedBy && (
            <div>Por: {user.statusChangedBy}</div>
          )}
          {user.statusReason && (
            <div>Razón: {user.statusReason}</div>
          )}
        </div>
      );
    };

    const renderUserTable = (categoryUsers: UserProfile[], title: string, icon: React.ReactNode, bgColor: string) => (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {categoryUsers.length}
          </span>
        </div>
        
        {categoryUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay usuarios en esta categoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryUsers.map((user) => (
                  <tr key={user.uid} className={isMainSuperAdmin(user.email) ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.displayName?.charAt(0) || user.email.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sin nombre'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {isMainSuperAdmin(user.email) && (
                            <div className="text-xs text-yellow-600 font-medium">⭐ Super Admin Principal</div>
                          )}
                          {getDeletedUserInfo(user)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'comunidad' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' :
                         user.role === 'admin' ? 'Admin' :
                         user.role === 'comunidad' ? 'Comunidad' :
                         'Visitante'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setShowEditUser(user)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDeleteUser(user.email) && (
                        <>
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleChangeUserStatus(user.uid, 'inactive', user.email)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Desactivar usuario"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          {user.status === 'inactive' && (
                            <button
                              onClick={() => handleReactivateUser(user.uid, user.email)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivar usuario"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {user.status === 'deleted' && (
                            <button
                              onClick={() => handleRecoverUser(user.uid, user.email)}
                              className="text-green-600 hover:text-green-900"
                              title="Recuperar usuario"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {user.status !== 'deleted' && (
                            <button
                              onClick={() => handleDeleteUser(user.uid, user.email)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="all">Todos los usuarios</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
              <option value="deleted">Solo eliminados</option>
            </select>
            <span className="text-sm text-gray-500">
              {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {userStatusFilter === 'deleted' && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <Trash2 className="w-4 h-4" />
              <span>Usuarios eliminados pueden ser recuperados</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No se encontraron usuarios</p>
            <p className="text-sm text-gray-400">Verifica la consola para más detalles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Super Administradores */}
            {renderUserTable(
              categorizedUsers.superAdmins,
              'Super Administradores',
              <Shield className="w-5 h-5 text-purple-600" />,
              'bg-purple-100'
            )}
            
            {/* Administradores */}
            {renderUserTable(
              categorizedUsers.admins,
              'Administradores',
              <Settings className="w-5 h-5 text-blue-600" />,
              'bg-blue-100'
            )}
            
            {/* Comunidad */}
            {renderUserTable(
              categorizedUsers.community,
              'Comunidad',
              <Users className="w-5 h-5 text-green-600" />,
              'bg-green-100'
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRegistrations = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de Registro Pendientes</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando solicitudes...</p>
          </div>
        ) : pendingRegistrations.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRegistrations.map((request) => (
              <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{request.displayName}</h4>
                    <p className="text-sm text-gray-500">{request.email}</p>
                    <p className="text-sm text-gray-500">
                      Solicitó rol: <span className="font-medium">{request.requestedRole}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {getTimeAgo(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveRegistration(request.id, request.requestedRole)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => setShowRejectModal({ requestId: request.id, reason: '' })}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Logs del Sistema</h3>
          <button
            onClick={async () => {
              try {
                console.log('🔄 Recargando logs manualmente...');
                const logsData = await getServerLogs(50);
                console.log('📋 Logs recargados:', logsData);
                setSystemLogs(logsData);
              } catch (error) {
                console.error('❌ Error al recargar logs:', error);
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            🔄 Recargar
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando logs...</p>
          </div>
        ) : systemLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay logs del sistema</p>
            <p className="text-sm text-gray-400">Los logs aparecerán aquí cuando se realicen acciones en el sistema</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {systemLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                        log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                        log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.details?.userEmail || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{log.message}</div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(new Date(log.timestamp))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoreo de Seguridad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Camera className="w-6 h-6 text-green-600" />
              <h4 className="font-medium text-gray-900">Cámaras de Seguridad</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">12 cámaras activas</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Estado del sistema</span>
                <span className="text-green-600">Operativo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Última verificación</span>
                <span>Hace 2 minutos</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Bell className="w-6 h-6 text-red-600" />
              <h4 className="font-medium text-gray-900">Alertas de Pánico</h4>
            </div>
            <p className="text-sm text-gray-600 mb-2">3 alertas en las últimas 24h</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Tiempo promedio respuesta</span>
                <span>2.3 minutos</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Última alerta</span>
                <span>Hace 15 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Registro de Nuevos Usuarios</h4>
              <p className="text-sm text-gray-600">Permitir registro automático</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
              <p className="text-sm text-gray-600">Enviar alertas por correo</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Super Administrador - Calle Jerusalén</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'registrations' && renderRegistrations()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Modal para crear usuario */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Modal para editar usuario */}
      {showEditUser && (
        <EditUserModal
          user={showEditUser}
          onClose={() => setShowEditUser(null)}
          onSubmit={(updates) => handleUpdateUser(showEditUser.uid, updates, showEditUser.email)}
        />
      )}

      {/* Modal para rechazar solicitud */}
      {showRejectModal && (
        <RejectModal
          requestId={showRejectModal.requestId}
          onClose={() => setShowRejectModal(null)}
          onSubmit={(reason) => {
            handleRejectRegistration(showRejectModal.requestId, reason);
            setShowRejectModal(null);
          }}
        />
      )}
    </div>
    </ProtectedRoute>
  );
};

// Componente para crear usuario
const CreateUserModal: React.FC<{
  onClose: () => void;
  onSubmit: (userData: { email: string; password: string; displayName: string; role: UserRole }) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'comunidad' as UserRole
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Función para verificar email con debounce
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailError(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailError(null);

    try {
      // Importar la función dinámicamente
      const { checkEmailExists } = await import('@/lib/auth');
      const exists = await checkEmailExists(email);
      
      if (exists) {
        setEmailError('Este email ya está registrado en el sistema');
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error('Error al verificar email:', error);
      setEmailError(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounce para verificar email
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup del timeout al desmontar el componente
  React.useEffect(() => {
    return () => {
      if (emailTimeout) {
        clearTimeout(emailTimeout);
      }
    };
  }, [emailTimeout]);
  
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    
    // Limpiar timeout anterior
    if (emailTimeout) {
      clearTimeout(emailTimeout);
    }
    
    // Establecer nuevo timeout
    const timeout = setTimeout(() => {
      checkEmailAvailability(email);
    }, 500);
    
    setEmailTimeout(timeout);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si hay errores de email
    if (emailError) {
      alert('❌ Por favor, corrige el error del email antes de continuar');
      return;
    }
    
    // Verificar si se está validando el email
    if (isCheckingEmail) {
      alert('⏳ Por favor, espera a que termine la validación del email');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                  emailError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-primary-500'
                }`}
                placeholder="usuario@ejemplo.com"
              />
              {isCheckingEmail && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {!isCheckingEmail && formData.email && !emailError && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {!isCheckingEmail && emailError && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
            {isCheckingEmail && (
              <p className="mt-1 text-sm text-blue-600">Verificando disponibilidad...</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="comunidad">Residente</option>
              <option value="admin">Administrador</option>
              <option value="super_admin">Super Administrador</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente para editar usuario
const EditUserModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onSubmit: (updates: Partial<UserProfile>) => void;
}> = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Usuario</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (solo lectura)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={isMainSuperAdmin(user.email)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                isMainSuperAdmin(user.email) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="comunidad">Residente</option>
              <option value="admin">Administrador</option>
              <option value="super_admin">Super Administrador</option>
            </select>
            {isMainSuperAdmin(user.email) && (
              <p className="text-xs text-yellow-600 mt-1">⭐ El rol del super administrador principal no puede ser modificado</p>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Usuario activo
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Actualizar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente para rechazar solicitud
const RejectModal: React.FC<{
  requestId: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechazar Solicitud</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del rechazo
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              rows={4}
              placeholder="Explica por qué se rechaza esta solicitud..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rechazar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
