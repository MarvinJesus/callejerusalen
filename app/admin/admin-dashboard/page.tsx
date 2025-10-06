'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
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
  Activity,
  Key,
  Settings,
  Menu,
  X,
  EyeOff,
  UserX,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  BookOpen,
  Calendar,
  Map,
  Store,
  Navigation
} from 'lucide-react';
import { 
  getAllUsers, 
  getPendingRegistrations,
  UserProfile,
  RegistrationRequest,
  getUserPermissions,
  createUserAsAdmin, 
  deleteUserAsAdmin, 
  updateUserAsAdmin,
  approveRegistration,
  rejectRegistration,
  isMainSuperAdmin,
  canDeleteUser,
  canModifyUserRole,
  changeUserStatus,
  reactivateUser,
  recoverUser,
  getUsersByStatus,
  UserRole,
  UserStatus,
  checkEmailExists
} from '@/lib/auth';
import { Permission, hasPermission, hasAnyPermission } from '@/lib/permissions';
import PermissionManager from '@/components/PermissionManager';
import { PermissionList } from '@/components/PermissionBadge';
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
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState<UserProfile | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ requestId: string; reason: string } | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all');
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'deactivate' | 'activate' | 'delete' | 'recover';
    user: UserProfile;
    action: string;
    description: string;
    icon: React.ReactNode;
    confirmText: string;
    confirmClass: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [eventStats, setEventStats] = useState<{[key: string]: any}>({});
  const [mapPlaces, setMapPlaces] = useState<any[]>([]);

  // Función para verificar si el usuario es super admin
  const isSuperAdmin = () => {
    // Verificar múltiples fuentes para determinar si es super admin
    if (userProfile?.role === 'super_admin') return true;
    if (userProfile?.email === 'mar90jesus@gmail.com') return true; // Email del super admin principal
    return false;
  };

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: BarChart3, required: ['analytics.view', 'reports.view', 'logs.view', 'users.view', 'security.view'] as Permission[], any: true },
    { id: 'users', label: 'Usuarios', icon: Users, required: ['users.view'] as Permission[] },
    { id: 'registrations', label: 'Solicitudes', icon: Clock, required: ['registrations.view'] as Permission[] },
    { id: 'logs', label: 'Logs', icon: FileText, required: ['logs.view'] as Permission[] },
    ...(isSuperAdmin() 
      ? [{ id: 'permissions', label: 'Permisos', icon: Key, required: [] as Permission[] }]
      : [{ id: 'permissions', label: 'Permisos', icon: Key, required: ['permissions.view'] as Permission[] }]
    ),
    { id: 'security', label: 'Seguridad', icon: Shield, required: ['security.view'] as Permission[] },
    { id: 'history', label: 'Historias', icon: BookOpen, required: ['community.view'] as Permission[] },
    { id: 'events', label: 'Eventos', icon: Calendar, required: ['community.events'] as Permission[] },
    { id: 'places', label: 'Lugares', icon: Map, required: ['community.places'] as Permission[] },
    { id: 'services', label: 'Servicios', icon: Store, required: ['community.services'] as Permission[] },
    { id: 'settings', label: 'Configuración', icon: Settings, required: ['settings.view'] as any[] },
  ];

  const canSeeItem = (item: { required?: Permission[]; any?: boolean; id: string }) => {
    if (isSuperAdmin()) return true;
    const userPerms = (userProfile?.permissions || []) as Permission[];
    if (!item.required || item.required.length === 0) return true;
    return item.any ? hasAnyPermission(userPerms, item.required) : hasPermission(userPerms, item.required[0] as Permission);
  };

  const visibleNavItems = navItems.filter(canSeeItem);

  // Garantizar que la pestaña activa sea accesible; si no, cambiar a la primera visible
  useEffect(() => {
    const currentItem = navItems.find(i => i.id === activeTab);
    if (currentItem && !canSeeItem(currentItem)) {
      setActiveTab(visibleNavItems[0]?.id || 'overview');
    }
  }, [userProfile, activeTab]);

  // Función para cargar datos de historia
  const loadHistoryData = async () => {
    try {
      const response = await fetch('/api/admin/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data.historyData);
      }
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
    }
  };

  // Función para cargar estadísticas de eventos
  const loadEventStats = async () => {
    try {
      if (!historyData?.events) return;
      
      const stats: {[key: string]: any} = {};
      
      // Cargar estadísticas reales para cada evento
      for (let i = 0; i < historyData.events.length; i++) {
        try {
          const response = await fetch(`/api/events/${i}/stats`);
          if (response.ok) {
            const data = await response.json();
            stats[i] = {
              confirmedRegistrations: data.confirmedRegistrations || 0,
              totalRegistrations: data.totalRegistrations || 0,
              pendingRegistrations: data.pendingRegistrations || 0,
              cancelledRegistrations: data.cancelledRegistrations || 0,
              blockedRegistrations: data.blockedRegistrations || 0
            };
          } else {
            stats[i] = {
              confirmedRegistrations: 0,
              totalRegistrations: 0,
              pendingRegistrations: 0,
              cancelledRegistrations: 0,
              blockedRegistrations: 0
            };
          }
        } catch (error) {
          console.error(`Error al cargar estadísticas del evento ${i}:`, error);
          stats[i] = {
            confirmedRegistrations: 0,
            totalRegistrations: 0,
            pendingRegistrations: 0,
            cancelledRegistrations: 0,
            blockedRegistrations: 0
          };
        }
      }
      
      setEventStats(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas de eventos:', error);
    }
  };

  // Función para cargar lugares del mapa
  const loadMapPlaces = async () => {
    try {
      const response = await fetch('/api/admin/places');
      if (response.ok) {
        const data = await response.json();
        setMapPlaces(data.places || []);
      }
    } catch (error) {
      console.error('Error al cargar lugares del mapa:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || isSuperAdmin()) {
      loadDashboardData();
      loadHistoryData();
      loadMapPlaces();
    }
  }, [userProfile, userStatusFilter]);

  // Cargar estadísticas de eventos cuando se carguen los datos de historia
  useEffect(() => {
    if (historyData?.events) {
      loadEventStats();
    }
  }, [historyData]);

  // Abrir sidebar por defecto en pantallas medianas+ y cerrarlo en mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      setSidebarOpen(isDesktop);
      setSidebarCollapsed(!isDesktop);
    }
  }, []);

  // Función para alternar el sidebar con animación
  const toggleSidebar = () => {
    // Agregar efecto de bounce al botón
    const button = document.querySelector('[aria-label*="menú"]') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      // En desktop, alternar entre colapsado y expandido
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      // En mobile, alternar entre abierto y cerrado
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Función para cerrar sidebar en mobile al navegar
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    // Cerrar sidebar en mobile después de navegar
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };



  const loadDashboardData = async () => {
    setLoading(true);
    setConnectionStatus('connected');
    
    try {
      // Obtener métricas desde la API del servidor (más confiable)
      console.log('🔍 Obteniendo métricas desde la API...');
      const metricsResponse = await fetch('/api/metrics');
      let serverMetrics = null;
      
      if (metricsResponse.ok) {
        serverMetrics = await metricsResponse.json();
        console.log('✅ Métricas del servidor obtenidas:', serverMetrics);
      } else {
        console.warn('⚠️ Error al obtener métricas del servidor:', metricsResponse.status);
      }
      
      // Obtener datos de usuarios para la tabla según el filtro de estado
      console.log('🔍 Obteniendo usuarios para la tabla...');
      let usersData: UserProfile[];
      
      if (userStatusFilter === 'all') {
        usersData = await getAllUsers(true); // Incluir usuarios eliminados para vista completa
      } else {
        usersData = await getUsersByStatus(userStatusFilter as UserStatus);
      }
      
      console.log('📊 Usuarios obtenidos para tabla:', usersData.length, `(filtro: ${userStatusFilter})`);
      
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
      
      // Usar métricas del servidor si están disponibles, sino calcular localmente
      const finalMetrics = serverMetrics || {
        users: {
          total: usersData.length,
          active: usersData.filter(user => user.status === 'active').length,
          inactive: usersData.filter(user => user.status === 'inactive').length,
          deleted: usersData.filter(user => user.status === 'deleted').length,
          byRole: {
            visitante: usersData.filter(user => user.role === 'visitante').length,
            comunidad: usersData.filter(user => user.role === 'comunidad').length,
            admin: usersData.filter(user => user.role === 'admin').length,
            super_admin: usersData.filter(user => user.role === 'super_admin').length
          }
        },
        activity: {
          actionsToday: logsData.filter(log => {
            const logDate = new Date(log.timestamp).toDateString();
            return logDate === new Date().toDateString();
          }).length,
          lastUpdated: new Date().toISOString()
        },
        system: {
          uptime: process.uptime ? process.uptime() : 0,
          memoryUsage: process.memoryUsage ? process.memoryUsage() : {},
          nodeVersion: process.version || 'unknown'
        }
      };
      
      setUsers(usersData);
      setPendingRegistrations(registrationsData);
      setSystemLogs(logsData);
      setMetrics(finalMetrics);
      
      console.log('✅ Métricas finales establecidas:', finalMetrics);
      console.log('✅ Usuarios establecidos en estado:', usersData.length);
      console.log('✅ Métricas establecidas en estado:', finalMetrics.users.total);
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

  const loadUserPermissions = async (user: UserProfile) => {
    try {
      const permissions = await getUserPermissions(user.uid);
      setUserPermissions(permissions);
      setSelectedUser(user);
      // Cambiar automáticamente a la pestaña de permisos
      setActiveTab('permissions');
    } catch (error) {
      console.error('Error al cargar permisos del usuario:', error);
    }
  };

  const handlePermissionsUpdated = () => {
    // Recargar datos del dashboard
    loadDashboardData();
    // Recargar permisos del usuario seleccionado
    if (selectedUser) {
      loadUserPermissions(selectedUser);
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

  const handleDeleteUser = (user: UserProfile) => {
    showConfirmationModal(user, 'delete');
  };

  const showConfirmationModal = (user: UserProfile, action: 'deactivate' | 'activate' | 'delete' | 'recover') => {
    const confirmations = {
      deactivate: {
        action: 'Desactivar Usuario',
        description: `¿Estás seguro de que quieres desactivar a ${user.displayName || user.email}?\n\nEl usuario no podrá acceder al sistema hasta que sea reactivado.`,
        icon: <UserX className="w-8 h-8 text-yellow-600" />,
        confirmText: 'Desactivar Usuario',
        confirmClass: 'bg-yellow-600 hover:bg-yellow-700'
      },
      activate: {
        action: 'Activar Usuario',
        description: `¿Estás seguro de que quieres activar a ${user.displayName || user.email}?\n\nEl usuario podrá acceder nuevamente al sistema.`,
        icon: <UserCheck className="w-8 h-8 text-green-600" />,
        confirmText: 'Activar Usuario',
        confirmClass: 'bg-green-600 hover:bg-green-700'
      },
      delete: {
        action: 'Eliminar Usuario',
        description: `¿Estás seguro de que quieres eliminar permanentemente a ${user.displayName || user.email}?\n\nEsta acción es irreversible y el usuario no podrá acceder al sistema.`,
        icon: <Trash2 className="w-8 h-8 text-red-600" />,
        confirmText: 'Eliminar Permanentemente',
        confirmClass: 'bg-red-600 hover:bg-red-700'
      },
      recover: {
        action: 'Recuperar Usuario',
        description: `¿Estás seguro de que quieres recuperar a ${user.displayName || user.email}?\n\nEl usuario será reactivado y podrá acceder nuevamente al sistema.`,
        icon: <RotateCcw className="w-8 h-8 text-blue-600" />,
        confirmText: 'Recuperar Usuario',
        confirmClass: 'bg-blue-600 hover:bg-blue-700'
      }
    };

    setShowConfirmModal({
      type: action,
      user,
      ...confirmations[action]
    });
  };

  const handleConfirmAction = async () => {
    if (!showConfirmModal || !userProfile?.uid) return;

    const { type, user } = showConfirmModal;
    const reason = prompt('¿Cuál es la razón para esta acción? (opcional)');
    if (reason === null) return; // Usuario canceló

    // Verificar si se puede modificar el usuario
    if (!canDeleteUser(user.email)) {
      alert('No se puede modificar al super administrador principal');
      setShowConfirmModal(null);
      return;
    }

    try {
      let newStatus: UserStatus;
      let successMessage: string;

      switch (type) {
        case 'deactivate':
          newStatus = 'inactive';
          successMessage = '✅ Usuario desactivado exitosamente';
          await changeUserStatus(user.uid, newStatus, userProfile.uid, reason || undefined);
          break;
        case 'activate':
          newStatus = 'active';
          successMessage = '✅ Usuario activado exitosamente';
          await changeUserStatus(user.uid, newStatus, userProfile.uid, reason || undefined);
          break;
        case 'delete':
          newStatus = 'deleted';
          successMessage = '🗑️ Usuario eliminado exitosamente';
          await changeUserStatus(user.uid, newStatus, userProfile.uid, reason || undefined);
          break;
        case 'recover':
          await recoverUser(user.uid, userProfile.uid, reason || undefined);
          successMessage = '✅ Usuario recuperado exitosamente';
          break;
      }

      await loadDashboardData();
      setShowConfirmModal(null);
      alert(successMessage);
    } catch (error) {
      console.error('Error al ejecutar acción:', error);
      alert(error instanceof Error ? error.message : 'Error al ejecutar la acción');
      setShowConfirmModal(null);
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

  const handleReactivateUser = (user: UserProfile) => {
    showConfirmationModal(user, 'activate');
  };

  const handleRecoverUser = (user: UserProfile) => {
    showConfirmationModal(user, 'recover');
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

  // Calcular estadísticas usando las métricas del servidor (más confiables)
  const calculateStats = () => {
    // Usar métricas del servidor si están disponibles
    if (metrics?.users) {
      return {
        totalUsers: metrics.users.total || 0,
        activeUsers: metrics.users.active || 0,
        inactiveUsers: metrics.users.inactive || 0,
        deletedUsers: metrics.users.deleted || 0,
        usersByRole: {
          super_admin: metrics.users.byRole?.super_admin || 0,
          admin: metrics.users.byRole?.admin || 0,
          comunidad: metrics.users.byRole?.comunidad || 0,
          visitante: metrics.users.byRole?.visitante || 0
        },
        actionsToday: metrics.activity?.actionsToday || 0,
        lastUpdated: metrics.activity?.lastUpdated || new Date().toISOString()
      };
    }
    
    // Fallback: calcular desde usuarios locales si no hay métricas del servidor
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
 
  // UI helpers for sidebar avatar
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  };
  const pendingCount = pendingRegistrations.length;
  
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

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resumen del Sistema</h2>

        {/* Mensaje de estado de conexión */}
        {connectionStatus === 'error' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="card border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 leading-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick action: Área Segura de Reunión */}
        <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Área Segura de Reunión</h3>
                <p className="text-sm text-gray-600">Administra la información pública de emergencia (punto de reunión, indicaciones, mapa e imagen).</p>
              </div>
            </div>
            <Link
              href="/admin/emergency"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Gestionar
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {getRecentActivities().map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
  };

   const renderUsers = () => {
     const categorizeUsers = (users: UserProfile[]) => {
       const categories = {
         superAdmins: users.filter(user => user.role === 'super_admin'),
         admins: users.filter(user => user.role === 'admin'),
         community: users.filter(user => user.role === 'comunidad' || user.role === 'visitante')
       };
       return categories;
     };

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
       <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
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
                               onClick={() => showConfirmationModal(user, 'deactivate')}
                               className="text-yellow-600 hover:text-yellow-900 transition-colors"
                               title="Desactivar usuario"
                             >
                               <UserX className="w-4 h-4" />
                             </button>
                           )}
                           {user.status === 'inactive' && (
                             <button
                               onClick={() => handleReactivateUser(user)}
                               className="text-green-600 hover:text-green-900 transition-colors"
                               title="Reactivar usuario"
                             >
                               <UserCheck className="w-4 h-4" />
                             </button>
                           )}
                           {user.status === 'deleted' && (
                             <button
                               onClick={() => handleRecoverUser(user)}
                               className="text-blue-600 hover:text-blue-900 transition-colors"
                               title="Recuperar usuario"
                             >
                               <RotateCcw className="w-4 h-4" />
                             </button>
                           )}
                           {user.status !== 'deleted' && (
                             <button
                               onClick={() => handleDeleteUser(user)}
                               className="text-red-600 hover:text-red-900 transition-colors"
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

     const categorizedUsers = categorizeUsers(users);
     
     return (
       <div className="space-y-6">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
           {isSuperAdmin() && (
             <button
               onClick={() => setShowCreateUser(true)}
               className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
             >
               <Plus className="w-4 h-4" />
               <span>Crear Usuario</span>
             </button>
           )}
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
       <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
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
              <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                  {isSuperAdmin() ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRegistration(request.id, request.requestedRole)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Aprobar</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal({ requestId: request.id, reason: '' })}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Pendiente de aprobación por Super Administrador
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      {selectedUser ? (
        <div className="space-y-6">
          {/* Header con información del usuario */}
          <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gestión de Permisos
                </h3>
                <p className="text-sm text-gray-600">
                  Usuario: {selectedUser.displayName} ({selectedUser.email})
                </p>
                <p className="text-sm text-gray-500">
                  Rol: {selectedUser.role} | Estado: {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-200"
              >
                Volver a Lista
              </button>
            </div>
          </div>

          {/* Gestor de permisos */}
          <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
            <PermissionManager
              targetUser={selectedUser}
              onPermissionsUpdated={handlePermissionsUpdated}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gestión de Permisos de Usuarios
            </h3>
            <p className="text-gray-600 mb-6">
              Selecciona un usuario administrador de la lista para gestionar sus permisos específicos.
            </p>

            {/* Lista de usuarios administradores */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Usuarios Administradores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users
                  .filter(user => user.role === 'admin' && user.isActive)
                  .map((user) => (
                    <div key={user.uid} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{user.displayName}</h5>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="mt-2">
                            <PermissionList 
                              permissions={user.permissions || []} 
                              size="sm" 
                              maxVisible={3}
                            />
                          </div>
                        </div>
                         <button
                           onClick={() => loadUserPermissions(user)}
                           className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                         >
                           <Key className="w-3 h-3" />
                           <span>Gestionar</span>
                         </button>
                      </div>
                    </div>
                  ))}
              </div>
              
              {users.filter(user => user.role === 'admin' && user.isActive).length === 0 && (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay usuarios administradores activos</p>
                </div>
              )}
            </div>
          </div>

          {/* Información sobre permisos */}
          <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
            <h4 className="font-medium text-gray-900 mb-4">Información sobre Permisos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Tipos de Permisos</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Gestión de Usuarios:</strong> Crear, editar, eliminar usuarios</li>
                  <li>• <strong>Gestión de Roles:</strong> Asignar roles y permisos</li>
                  <li>• <strong>Gestión de Registros:</strong> Aprobar/rechazar solicitudes</li>
                  <li>• <strong>Seguridad:</strong> Acceso a cámaras y alertas</li>
                  <li>• <strong>Reportes:</strong> Ver y exportar reportes</li>
                  <li>• <strong>Logs:</strong> Ver y gestionar logs del sistema</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Niveles de Acceso</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Super Admin:</strong> Todos los permisos</li>
                  <li>• <strong>Admin:</strong> Permisos específicos asignados</li>
                  <li>• <strong>Comunidad:</strong> Acceso básico a funcionalidades</li>
                  <li>• <strong>Visitante:</strong> Solo lectura de información pública</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

   const renderLogs = () => (
     <div className="space-y-6">
       <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
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
       <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
         <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoreo de Seguridad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Historias</h3>
          <Link 
            href="/admin/history"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ir a Gestión de Historias</span>
          </Link>
        </div>
        <p className="text-gray-600 mb-6">
          Administra el contenido histórico de la comunidad, incluyendo tradiciones, eventos pasados y patrimonio cultural.
        </p>
        
        {/* Indicadores de Contenido */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.periods?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Períodos</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.traditions?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Tradiciones</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.events?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Eventos</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.places?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Lugares</p>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.gallery?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Imágenes</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {historyData?.services?.length || 0}
            </div>
            <p className="text-xs text-gray-600">Servicios</p>
          </div>
        </div>

        {/* Secciones de Gestión */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Historias</h4>
            </div>
            <p className="text-sm text-blue-700">Gestiona historias y tradiciones</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Map className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Lugares Históricos</h4>
            </div>
            <p className="text-sm text-green-700">Administra lugares con valor histórico</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-purple-900">Períodos</h4>
            </div>
            <p className="text-sm text-purple-700">Organiza eventos por períodos</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => {
    // Calcular totales de estadísticas
    const totalEvents = historyData?.events?.length || 0;
    const totalConfirmed = Object.values(eventStats).reduce((sum: number, stats: any) => sum + (stats.confirmedRegistrations || 0), 0);
    const totalPending = Object.values(eventStats).reduce((sum: number, stats: any) => sum + (stats.pendingRegistrations || 0), 0);
    const totalCancelled = Object.values(eventStats).reduce((sum: number, stats: any) => sum + (stats.cancelledRegistrations || 0), 0);
    const totalRegistrations = Object.values(eventStats).reduce((sum: number, stats: any) => sum + (stats.totalRegistrations || 0), 0);

    return (
      <div className="space-y-6">
        <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Eventos y Actividades</h3>
            <Link 
              href="/admin/history/events"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Ir a Gestión de Eventos</span>
            </Link>
          </div>
          <p className="text-gray-600 mb-6">
            Administra eventos comunitarios, actividades culturales y celebraciones de la comunidad.
          </p>
          
          {/* Indicadores de Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {totalEvents}
              </div>
              <p className="text-xs text-gray-600">Eventos</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {totalConfirmed}
              </div>
              <p className="text-xs text-gray-600">Confirmados</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {totalPending}
              </div>
              <p className="text-xs text-gray-600">Pendientes</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {totalCancelled}
              </div>
              <p className="text-xs text-gray-600">Cancelados</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {totalRegistrations}
              </div>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>

          {/* Secciones de Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Eventos</h4>
              </div>
              <p className="text-sm text-blue-700">Gestiona eventos comunitarios</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Actividades</h4>
              </div>
              <p className="text-sm text-green-700">Organiza actividades culturales</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Galería</h4>
              </div>
              <p className="text-sm text-purple-700">Administra imágenes de eventos</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaces = () => {
    // Agrupar lugares históricos por categoría
    const placesByCategory = historyData?.places?.reduce((acc: any, place: any) => {
      const category = place.category || 'Sin Categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};

    // Agrupar por nivel de importancia
    const placesBySignificance = historyData?.places?.reduce((acc: any, place: any) => {
      const significance = place.significance || 'Sin Clasificar';
      acc[significance] = (acc[significance] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalHistoricalPlaces = historyData?.places?.length || 0;

    // Estadísticas de lugares del mapa
    const mapPlacesStats = {
      total: mapPlaces.length,
      active: mapPlaces.filter(p => p.isActive).length,
      inactive: mapPlaces.filter(p => !p.isActive).length,
      categories: Array.from(new Set(mapPlaces.map(p => p.category))).length,
    };

    // Agrupar lugares del mapa por categoría
    const mapPlacesByCategory = mapPlaces.reduce((acc: any, place: any) => {
      const category = place.category || 'Sin Categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Lugares</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link 
                href="/admin/history/places"
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>Ir a Gestión de Lugares Históricos</span>
              </Link>
              <Link 
                href="/admin/places"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Map className="w-4 h-4" />
                <span>Ir a Lugares del Mapa</span>
              </Link>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Administra lugares de interés, puntos de referencia y ubicaciones importantes de la comunidad. 
            Incluye tanto lugares históricos como lugares actuales mostrados en el mapa interactivo.
          </p>
          
          {/* Indicadores de Lugares Históricos */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Lugares Históricos por Categoría</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {Object.entries(placesByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xl font-bold text-primary-600 mb-1">
                    {count as number}
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">{category}</p>
                </div>
              ))}
              {totalHistoricalPlaces > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xl font-bold text-gray-600 mb-1">
                    {totalHistoricalPlaces}
                  </div>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              )}
            </div>
          </div>

          {/* Indicadores por Nivel de Importancia */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Por Nivel de Importancia</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(placesBySignificance).map(([significance, count]) => {
                const colorClass = significance === 'Muy Importante' ? 'bg-red-50 border-red-200 text-red-600' :
                                 significance === 'Importante' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                 significance === 'Moderada' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                                 'bg-green-50 border-green-200 text-green-600';
                
                return (
                  <div key={significance} className={`text-center p-3 rounded-lg border ${colorClass}`}>
                    <div className="text-xl font-bold mb-1">
                      {count as number}
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">{significance}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores de Lugares del Mapa */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Lugares del Mapa por Categoría</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {Object.entries(mapPlacesByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xl font-bold text-green-600 mb-1">
                    {count as number}
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">{category}</p>
                </div>
              ))}
              {mapPlacesStats.total > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xl font-bold text-gray-600 mb-1">
                    {mapPlacesStats.total}
                  </div>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas Generales de Lugares del Mapa */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Estado de Lugares del Mapa</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl font-bold text-green-600 mb-1">
                  {mapPlacesStats.active}
                </div>
                <p className="text-xs text-gray-600">Activos</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600 mb-1">
                  {mapPlacesStats.inactive}
                </div>
                <p className="text-xs text-gray-600">Inactivos</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xl font-bold text-purple-600 mb-1">
                  {mapPlacesStats.categories}
                </div>
                <p className="text-xs text-gray-600">Categorías</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xl font-bold text-gray-600 mb-1">
                  {mapPlacesStats.total}
                </div>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </div>

          {/* Secciones de Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Lugares Históricos</h4>
              </div>
              <p className="text-sm text-blue-700">Gestiona lugares con valor histórico</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Map className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Lugares del Mapa</h4>
              </div>
              <p className="text-sm text-green-700">Administra lugares mostrados en el mapa</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Puntos de Referencia</h4>
              </div>
              <p className="text-sm text-purple-700">Administra puntos importantes</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Navigation className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">Mapa Interactivo</h4>
              </div>
              <p className="text-sm text-orange-700">Visualiza y gestiona el mapa</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServices = () => {
    // Estadísticas de servicios históricos
    const servicesStats = {
      total: historyData?.services?.length || 0,
      active: historyData?.services?.filter((s: any) => s.isActive).length || 0,
      inactive: historyData?.services?.filter((s: any) => !s.isActive).length || 0,
      categories: new Set(historyData?.services?.map((s: any) => s.category)).size || 0,
    };

    // Agrupar servicios por categoría
    const servicesByCategory = historyData?.services?.reduce((acc: any, service: any) => {
      const category = service.category || 'Sin Categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};

    return (
      <div className="space-y-6">
        <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Servicios Locales</h3>
            <Link 
              href="/admin/history/services"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Ir a Gestión de Servicios</span>
            </Link>
          </div>
          <p className="text-gray-600 mb-6">
            Administra servicios locales, comercios, restaurantes y establecimientos de la comunidad.
          </p>
          
          {/* Indicadores de Servicios por Categoría */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Servicios Locales por Categoría</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {Object.entries(servicesByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xl font-bold text-primary-600 mb-1">
                    {count as number}
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">{category}</p>
                </div>
              ))}
              {servicesStats.total > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xl font-bold text-gray-600 mb-1">
                    {servicesStats.total}
                  </div>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas Generales de Servicios */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Estado de Servicios Locales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl font-bold text-green-600 mb-1">
                  {servicesStats.active}
                </div>
                <p className="text-xs text-gray-600">Activos</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600 mb-1">
                  {servicesStats.inactive}
                </div>
                <p className="text-xs text-gray-600">Inactivos</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xl font-bold text-purple-600 mb-1">
                  {servicesStats.categories}
                </div>
                <p className="text-xs text-gray-600">Categorías</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xl font-bold text-gray-600 mb-1">
                  {servicesStats.total}
                </div>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </div>

          {/* Secciones de Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Store className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Comercios</h4>
              </div>
              <p className="text-sm text-blue-700">Gestiona tiendas y comercios</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Restaurantes</h4>
              </div>
              <p className="text-sm text-green-700">Administra restaurantes locales</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Servicios</h4>
              </div>
              <p className="text-sm text-purple-700">Gestiona servicios comunitarios</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="card border border-gray-100 rounded-xl shadow-sm bg-white">
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
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Administración</h1>
                <p className="text-gray-600">Administrador - Calle Jerusalén</p>
              </div>
               <div className="flex items-center space-x-4">
                {/* Toggle sidebar button with rotation animation */}
                <button
                  className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    sidebarOpen || !sidebarCollapsed 
                      ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 shadow-lg shadow-indigo-200/50' 
                      : 'text-gray-600 hover:bg-gray-100 shadow-sm hover:shadow-md'
                  }`}
                  aria-label={sidebarOpen || !sidebarCollapsed ? "Cerrar menú" : "Abrir menú"}
                  onClick={toggleSidebar}
                >
                  <div className="relative w-6 h-6">
                    <X className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                      sidebarOpen || !sidebarCollapsed 
                        ? 'opacity-100 rotate-0 scale-100' 
                        : 'opacity-0 rotate-45 scale-75'
                    }`} />
                    <Menu className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                      sidebarOpen || !sidebarCollapsed 
                        ? 'opacity-0 -rotate-45 scale-75' 
                        : 'opacity-100 rotate-0 scale-100'
                    }`} />
                  </div>
                </button>
                 {/* User Menu */}
                 <UserMenu />
                 
                 {/* Indicador de estado de conexión */}
                 <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
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
                 
                 <span className="hidden sm:inline px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                   {userProfile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                 </span>
               </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex gap-6">
            {/* Sidebar - desktop collapsible */}
            <aside className={`${sidebarCollapsed ? '-translate-x-full opacity-0 w-0' : 'translate-x-0 opacity-100 w-64'} transition-all duration-500 ease-in-out shrink-0 hidden md:block`}> 
              <div className="sticky top-6">
                <div className={`${sidebarCollapsed ? 'p-2' : 'p-3'} transform transition-all duration-500 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden`}>
                  {/* User mini card */}
                  <div className={`${sidebarCollapsed ? 'flex justify-center opacity-0' : 'flex opacity-100'} items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 transition-all duration-500 delay-75`}>
                    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold">
                      {getInitials(userProfile?.displayName || userProfile?.email || '')}
                    </div>
                    <div className={`min-w-0 transition-all duration-500 delay-150 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden scale-0' : 'opacity-100 scale-100'}`}>
                      <p className="text-sm font-semibold text-gray-900 truncate">{userProfile?.displayName || userProfile?.email}</p>
                      <p className="text-xs text-gray-600 truncate">{userProfile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}</p>
                    </div>
                  </div>

                  <div className={`${sidebarCollapsed ? 'px-1 py-2 opacity-0' : 'px-2 py-3 opacity-100'} transition-all duration-500 delay-100`}> 
                    <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-500 delay-200 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden scale-0' : 'opacity-100 scale-100'}`}>Navegación</p>
                  </div>
                  <nav className="mt-1 space-y-1">
                    {visibleNavItems.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`group w-full flex items-center gap-3 ${sidebarCollapsed ? 'px-2 justify-center opacity-0' : 'px-3 opacity-100'} py-2 rounded-xl text-sm font-medium transition-all border relative overflow-hidden ${
                          activeTab === item.id
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                            : 'text-gray-700 border-transparent hover:bg-gray-50 hover:border-gray-200'
                        }`}
                        style={{ transitionDelay: `${200 + (index * 50)}ms` }}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span className={`absolute left-0 top-0 h-full w-1 rounded-r-xl transition-colors ${activeTab === item.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-gray-200'}`}></span>
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'} ${sidebarCollapsed ? 'flex-shrink-0' : ''}`} />
                        <span className={`${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden scale-0' : 'opacity-100 scale-100 flex-1'} text-left transition-all duration-500`}>{item.label}</span>
                        {item.id === 'registrations' && pendingCount > 0 && (
                          <span className={`ml-auto inline-flex items-center justify-center text-[10px] h-5 min-w-[20px] px-1.5 rounded-full bg-red-100 text-red-700 transition-all duration-500 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden scale-0' : 'opacity-100 scale-100'}`}>
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Sidebar - mobile drawer */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
                <div 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-500 animate-in fade-in" 
                  onClick={() => setSidebarOpen(false)}
                ></div>
                <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl p-4 transform transition-transform duration-500 ease-out animate-in slide-in-from-left">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Menú</h2>
                    <button
                      className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                      aria-label="Cerrar menú"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* User mini card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 mb-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-semibold">
                      {getInitials(userProfile?.displayName || userProfile?.email || '')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userProfile?.displayName || userProfile?.email}</p>
                      <p className="text-xs text-gray-600 truncate">{userProfile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}</p>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2">
                    <nav className="space-y-1">
                      {visibleNavItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all border relative overflow-hidden ${
                            activeTab === item.id
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
                              : 'text-gray-700 border-transparent hover:bg-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <span className={`absolute left-0 top-0 h-full w-1 rounded-r-xl transition-colors ${activeTab === item.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-gray-200'}`}></span>
                          <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.id === 'registrations' && pendingCount > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center text-[10px] h-5 min-w-[20px] px-1.5 rounded-full bg-red-100 text-red-700">
                              {pendingCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {/* Guardas de permisos por sección */}
              {activeTab === 'overview' && (
                isSuperAdmin() || hasAnyPermission((userProfile?.permissions || []) as Permission[], ['analytics.view', 'reports.view', 'logs.view', 'users.view', 'security.view'] as Permission[])
                  ? renderOverview()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver el resumen.</p></div>
              )}
              {activeTab === 'users' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'users.view')
                  ? renderUsers()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver usuarios.</p></div>
              )}
              {activeTab === 'registrations' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'registrations.view')
                  ? renderRegistrations()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver solicitudes.</p></div>
              )}
              {activeTab === 'logs' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'logs.view')
                  ? renderLogs()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver logs.</p></div>
              )}
              {activeTab === 'permissions' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'permissions.view')
                  ? renderPermissions()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para gestionar permisos.</p></div>
              )}
              {activeTab === 'security' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'security.view')
                  ? renderSecurity()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver seguridad.</p></div>
              )}
              {activeTab === 'history' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'community.view')
                  ? renderHistory()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver historias.</p></div>
              )}
              {activeTab === 'events' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'community.events')
                  ? renderEvents()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver eventos.</p></div>
              )}
              {activeTab === 'places' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'community.places')
                  ? renderPlaces()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver lugares.</p></div>
              )}
              {activeTab === 'services' && (
                isSuperAdmin() || hasPermission((userProfile?.permissions || []) as Permission[], 'community.services')
                  ? renderServices()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver servicios.</p></div>
              )}
              {activeTab === 'settings' && (
                isSuperAdmin() || hasAnyPermission((userProfile?.permissions || []) as Permission[], ['settings.view'] as any[])
                  ? renderSettings()
                  : <div className="card"><p className="text-gray-700">No tienes permiso para ver configuración.</p></div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Modal de confirmación elegante */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={!!showConfirmModal}
          onClose={() => setShowConfirmModal(null)}
          onConfirm={handleConfirmAction}
          title={showConfirmModal.action}
          description={showConfirmModal.description}
          icon={showConfirmModal.icon}
          confirmText={showConfirmModal.confirmText}
          confirmClass={showConfirmModal.confirmClass}
          user={showConfirmModal.user}
        />
      )}

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

// Componente de confirmación elegante
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  confirmText: string;
  confirmClass: string;
  user: UserProfile;
}> = ({ isOpen, onClose, onConfirm, title, description, icon, confirmText, confirmClass, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-t-2xl border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Confirmación de acción</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          {/* Información del usuario */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-indigo-600">
                  {(user.displayName || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'Sin nombre'}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'comunidad' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {description}
            </p>
          </div>

          {/* Advertencia para acciones críticas */}
          {(title.includes('Eliminar') || title.includes('Desactivar')) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Acción crítica</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Esta acción tendrá un impacto inmediato en el acceso del usuario al sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
