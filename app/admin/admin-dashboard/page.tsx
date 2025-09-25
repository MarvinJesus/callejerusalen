'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  UserCheck, 
  Eye,
  Camera,
  MapPin,
  Bell,
  Clock,
  FileText,
  Activity
} from 'lucide-react';
import { 
  getAllUsers, 
  getPendingRegistrations,
  UserProfile,
  RegistrationRequest
} from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { getServerLogs, getSystemMetrics, ServerLog } from '@/lib/server-logging';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<ServerLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'error'>('connected');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'registrations', label: 'Solicitudes', icon: Clock },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  // Cargar datos al montar el componente
  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadDashboardData();
    }
  }, [userProfile]);

  // Debug: Verificar cuando cambian las métricas
  useEffect(() => {
    if (metrics) {
      console.log('🔄 Métricas actualizadas en estado:', metrics.users.total);
    }
  }, [metrics]);

  // Debug: Verificar cuando cambian los usuarios
  useEffect(() => {
    console.log('🔄 Usuarios actualizados en estado:', users.length);
    if (users.length > 0) {
      console.log('🔄 Detalles de usuarios en estado:', users.map(u => ({ email: u.email, role: u.role, status: u.status })));
    }
  }, [users]);

  const loadDashboardData = async () => {
    setLoading(true);
    setConnectionStatus('connected');
    
    try {
      // Obtener datos de usuarios primero (incluyendo todos los estados)
      console.log('🔍 Iniciando obtención de usuarios...');
      const usersData = await getAllUsers(true); // Incluir usuarios eliminados para conteo completo
      console.log('📊 Usuarios obtenidos:', usersData.length);
      console.log('📋 Detalles de usuarios:', usersData.map(u => ({ 
        email: u.email, 
        role: u.role, 
        status: u.status, 
        isActive: u.isActive,
        uid: u.uid
      })));
      
      // Verificación adicional
      if (usersData.length === 0) {
        console.warn('⚠️ No se encontraron usuarios. Verificando conexión...');
      } else if (usersData.length === 1) {
        console.warn('⚠️ Solo se encontró 1 usuario. Esto podría indicar un problema de permisos o filtrado.');
      }
      
      // Calcular métricas reales basadas en los datos de usuarios
      const activeUsers = usersData.filter(user => user.status === 'active');
      const inactiveUsers = usersData.filter(user => user.status === 'inactive');
      const deletedUsers = usersData.filter(user => user.status === 'deleted');
      
      console.log('📊 Conteo de usuarios:', {
        total: usersData.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        deleted: deletedUsers.length
      });
      
      const realMetrics = {
        users: {
          total: usersData.length,
          active: activeUsers.length,
          inactive: inactiveUsers.length,
          deleted: deletedUsers.length,
          byRole: {
            visitante: usersData.filter(user => user.role === 'visitante').length,
            comunidad: usersData.filter(user => user.role === 'comunidad').length,
            admin: usersData.filter(user => user.role === 'admin').length,
            super_admin: usersData.filter(user => user.role === 'super_admin').length
          }
        },
        activity: {
          actionsToday: 0, // Se calculará desde los logs
          lastUpdated: new Date().toISOString()
        },
        system: {
          uptime: process.uptime ? process.uptime() : 0,
          memoryUsage: process.memoryUsage ? process.memoryUsage() : {},
          nodeVersion: process.version || 'unknown'
        }
      };

      // Obtener datos de forma individual para mejor manejo de errores
      let registrationsData: RegistrationRequest[] = [];
      let logsData: ServerLog[] = [];
      
      try {
        registrationsData = await getPendingRegistrations();
        console.log('📋 Solicitudes pendientes obtenidas:', registrationsData.length);
      } catch (error) {
        console.warn('⚠️ Error al obtener solicitudes pendientes, continuando sin ellas:', error);
        registrationsData = [];
        setConnectionStatus('error');
      }
      
      try {
        logsData = await getServerLogs(50);
        console.log('📝 Logs obtenidos:', logsData.length);
      } catch (error) {
        console.warn('⚠️ Error al obtener logs, continuando sin ellos:', error);
        logsData = [];
        setConnectionStatus('error');
      }
      
      // Calcular acciones de hoy desde los logs
      const today = new Date().toDateString();
      const actionsToday = logsData.filter(log => {
        const logDate = new Date(log.timestamp).toDateString();
        return logDate === today;
      }).length;
      
      realMetrics.activity.actionsToday = actionsToday;
      
      setUsers(usersData);
      setPendingRegistrations(registrationsData);
      setSystemLogs(logsData);
      setMetrics(realMetrics);
      
      console.log('✅ Métricas calculadas:', realMetrics);
      console.log('✅ Usuarios establecidos en estado:', usersData.length);
      console.log('✅ Métricas establecidas en estado:', realMetrics.users.total);
      console.log('✅ Usuarios detallados:', usersData.map(u => ({ email: u.email, role: u.role, status: u.status })));
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      // En caso de error, establecer métricas por defecto
      setMetrics({
        users: { 
          total: 0, 
          active: 0, 
          inactive: 0, 
          deleted: 0, 
          byRole: { visitante: 0, comunidad: 0, admin: 0, super_admin: 0 } 
        },
        activity: { actionsToday: 0, lastUpdated: new Date().toISOString() },
        system: { uptime: 0, memoryUsage: {}, nodeVersion: 'unknown' }
      });
    } finally {
      setLoading(false);
    }
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

  // Calcular estadísticas directamente desde los datos de usuarios
  const calculateStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    const deletedUsers = users.filter(user => user.status === 'deleted').length;
    
    const usersByRole = {
      super_admin: users.filter(user => user.role === 'super_admin').length,
      admin: users.filter(user => user.role === 'admin').length,
      comunidad: users.filter(user => user.role === 'comunidad').length,
      visitante: users.filter(user => user.role === 'visitante').length
    };
    
    const actionsToday = metrics?.activity?.actionsToday || 0;
    const lastUpdated = metrics?.activity?.lastUpdated || new Date().toISOString();
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      usersByRole,
      actionsToday,
      lastUpdated
    };
  };

  const statsData = calculateStats();
  
  const stats = [
    { 
      label: 'Usuarios Totales', 
      value: statsData.totalUsers.toString(), 
      icon: Users, 
      color: 'text-blue-600',
      subtitle: `Activos: ${statsData.activeUsers} | Inactivos: ${statsData.inactiveUsers} | Eliminados: ${statsData.deletedUsers}`
    },
    { 
      label: 'Usuarios Activos', 
      value: statsData.activeUsers.toString(), 
      icon: UserCheck, 
      color: 'text-green-600',
      subtitle: `Super Admin: ${statsData.usersByRole.super_admin} | Admin: ${statsData.usersByRole.admin} | Comunidad: ${statsData.usersByRole.comunidad} | Visitantes: ${statsData.usersByRole.visitante}`
    },
    { 
      label: 'Solicitudes Pendientes', 
      value: pendingRegistrations.length.toString(), 
      icon: Clock, 
      color: 'text-yellow-600',
      subtitle: pendingRegistrations.length > 0 ? 'Requieren aprobación' : 'Sin solicitudes'
    },
    { 
      label: 'Acciones Hoy', 
      value: statsData.actionsToday.toString(), 
      icon: Activity, 
      color: 'text-red-600',
      subtitle: `Última actualización: ${new Date(statsData.lastUpdated).toLocaleTimeString()}`
    },
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

      // Extraer la acción del mensaje o detalles
      const action = log.details?.action || 'system_action';
      const userEmail = log.details?.userEmail || 'Sistema';

      return {
        action: actionMap[action] || log.message,
        user: userEmail,
        time: timeAgo,
        type: action.includes('user') ? 'user' : 'request'
      };
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header con botón de actualización */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Resumen del Sistema</h2>
        <div className="flex space-x-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          
          <button
            onClick={async () => {
              console.log('🔄 FORZANDO ACTUALIZACIÓN COMPLETA...');
              setMetrics(null); // Limpiar métricas
              setUsers([]); // Limpiar usuarios
              await loadDashboardData(); // Recargar datos
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Forzar Recarga</span>
          </button>
          
          <button
            onClick={async () => {
              console.log('🔍 DEBUG: Verificando usuarios directamente...');
              try {
                // Verificar autenticación actual
                const currentUser = auth?.currentUser;
                console.log('🔍 DEBUG - Usuario autenticado:', currentUser?.email);
                console.log('🔍 DEBUG - UID del usuario:', currentUser?.uid);
                
                // Verificar conexión directa con Firestore
                const { db } = await import('@/lib/firebase');
                const { collection, getDocs } = await import('firebase/firestore');
                
                console.log('🔍 DEBUG - Verificando conexión directa con Firestore...');
                const directSnapshot = await getDocs(collection(db, 'users'));
                console.log('🔍 DEBUG - Documentos encontrados directamente:', directSnapshot.size);
                
                const directUsers: any[] = [];
                directSnapshot.forEach((doc) => {
                  const data = doc.data();
                  directUsers.push({
                    id: doc.id,
                    email: data.email,
                    role: data.role,
                    status: data.status,
                    isActive: data.isActive
                  });
                  console.log('🔍 DEBUG - Documento directo:', doc.id, data);
                });
                
                // Ahora usar la función getAllUsers
                const debugUsers = await getAllUsers(true);
                console.log('🔍 DEBUG - Usuarios encontrados por getAllUsers:', debugUsers.length);
                console.log('🔍 DEBUG - Detalles completos:', debugUsers);
                
                // Mostrar información detallada
                const userSummary = debugUsers.map(u => 
                  `${u.email} (${u.role}) - ${u.status}`
                ).join('\n');
                
                const directSummary = directUsers.map(u => 
                  `${u.email} (${u.role}) - ${u.status}`
                ).join('\n');
                
                alert(`Comparación de resultados:\n\nDirecto desde Firestore: ${directUsers.length} usuarios\n\nPor getAllUsers: ${debugUsers.length} usuarios\n\nDirecto:\n${directSummary}\n\nPor función:\n${userSummary}\n\nRevisa la consola para más información.`);
              } catch (error) {
                console.error('🔍 DEBUG - Error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                alert(`Error al obtener usuarios: ${errorMessage}\nRevisa la consola para más detalles.`);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
            <span>Debug</span>
          </button>
        </div>
      </div>

      {/* Mensaje de estado de conexión */}
      {connectionStatus === 'error' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Datos parciales disponibles</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Algunos datos no pudieron cargarse debido a problemas de conectividad. 
                Los indicadores principales están actualizados con la información disponible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug: Mostrar estado actual de métricas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Estado de Datos (Debug)</h3>
            <p className="text-sm text-blue-700 mt-1">
              Usuarios en estado: {users.length} | 
              Usuarios activos: {statsData.activeUsers} | 
              Total calculado: {statsData.totalUsers} |
              Última actualización: {new Date(statsData.lastUpdated).toLocaleTimeString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Desglose: Super Admin: {statsData.usersByRole.super_admin}, Admin: {statsData.usersByRole.admin}, Comunidad: {statsData.usersByRole.comunidad}, Visitantes: {statsData.usersByRole.visitante}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
            )}
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

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Usuarios (Solo Lectura)</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando usuarios...</p>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'comunidad' ? 'bg-green-100 text-green-800' :
                        user.role === 'visitante' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? getTimeAgo(user.lastLogin) : 'Nunca'}
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

  const renderRegistrations = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de Registro (Solo Lectura)</h3>
        
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
                  <div className="text-sm text-gray-500">
                    Pendiente de aprobación por Super Administrador
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoreo de Seguridad (Solo Lectura)</h3>
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

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-600">Administrador - Calle Jerusalén</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Indicador de estado de conexión */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'error' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'error' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span>
                    {connectionStatus === 'connected' ? 'Conectado' :
                     connectionStatus === 'error' ? 'Datos parciales' :
                     'Sin conexión'}
                  </span>
                </div>
                
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  Administrador
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
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
