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
import { getServerLogs, getSystemMetrics, ServerLog } from '@/lib/server-logging';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<RegistrationRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<ServerLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersData, registrationsData, logsData, metricsData] = await Promise.all([
        getAllUsers(),
        getPendingRegistrations(),
        getServerLogs(50),
        getSystemMetrics()
      ]);
      
      setUsers(usersData);
      setPendingRegistrations(registrationsData);
      setSystemLogs(logsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
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
                        user.role === 'residente' ? 'bg-green-100 text-green-800' :
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
