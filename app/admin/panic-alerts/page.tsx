'use client';

/**
 * Página de Gestión de Alertas de Pánico para Super Administradores
 * Panel completo con estadísticas, filtros avanzados y herramientas de análisis
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy, where, limit as limitQuery, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AlertTriangle, 
  Filter, 
  Search, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  RefreshCcw,
  ArrowLeft,
  Video,
  ChevronDown,
  ChevronUp,
  Settings,
  Info,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  Shield,
  Zap,
  Target,
  Timer,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PanicAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'expired';
  notifiedUsers: string[];
  emergencyContacts: string[];
  acknowledgedBy?: string[];
  activatedFrom?: string;
  extremeMode?: boolean;
  hasVideo?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  alertDurationMinutes?: number;
  expiresAt?: Date;
  autoResolved?: boolean;
}

const PanicAlertsPage: React.FC = () => {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  // Estados principales
  const [alerts, setAlerts] = useState<PanicAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<PanicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'expired'>('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
    enabled: boolean;
  }>(() => {
    // Por defecto filtrar por el mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      enabled: true
    };
  });
  
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'status' | 'user'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estadísticas avanzadas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    expired: 0,
    last24h: 0,
    last7d: 0,
    last30d: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    extremeModeCount: 0,
    videoAlertsCount: 0,
    topUsers: [] as { userName: string; count: number }[],
    responseEfficiency: 0,
    systemHealth: 'excellent' as 'excellent' | 'good' | 'warning' | 'critical'
  });

  // Cargar alertas
  useEffect(() => {
    loadAlerts();
  }, []);

  // Aplicar filtros y paginación
  useEffect(() => {
    applyFiltersAndPagination();
  }, [alerts, searchTerm, statusFilter, userFilter, dateFilter, sortBy, currentPage, itemsPerPage]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando alertas de pánico para admin...');
      
      const alertsRef = collection(db, 'panicReports');
      const q = query(alertsRef, orderBy('timestamp', 'desc'), limitQuery(500)); // Cargar más para análisis
      
      const snapshot = await getDocs(q);
      const loadedAlerts: PanicAlert[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedAlerts.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          location: data.location,
          description: data.description,
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status || 'active',
          notifiedUsers: data.notifiedUsers || [],
          emergencyContacts: data.emergencyContacts || [],
          acknowledgedBy: data.acknowledgedBy || [],
          activatedFrom: data.activatedFrom,
          extremeMode: data.extremeMode,
          hasVideo: data.hasVideo,
          resolvedAt: data.resolvedAt?.toDate(),
          resolvedBy: data.resolvedBy,
          alertDurationMinutes: data.alertDurationMinutes,
          expiresAt: data.expiresAt?.toDate(),
          autoResolved: data.autoResolved
        });
      });
      
      console.log(`📊 Cargadas ${loadedAlerts.length} alertas`);
      setAlerts(loadedAlerts);
      calculateAdvancedStats(loadedAlerts);
    } catch (error) {
      console.error('❌ Error al cargar alertas:', error);
      toast.error('Error al cargar alertas de pánico');
    } finally {
      setLoading(false);
    }
  };

  const calculateAdvancedStats = (alertsList: PanicAlert[]) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Estadísticas básicas
    const basicStats = {
      total: alertsList.length,
      active: alertsList.filter(a => a.status === 'active').length,
      resolved: alertsList.filter(a => a.status === 'resolved').length,
      expired: alertsList.filter(a => a.status === 'expired').length,
      last24h: alertsList.filter(a => a.timestamp >= oneDayAgo).length,
      last7d: alertsList.filter(a => a.timestamp >= oneWeekAgo).length,
      last30d: alertsList.filter(a => a.timestamp >= oneMonthAgo).length,
      extremeModeCount: alertsList.filter(a => a.extremeMode).length,
      videoAlertsCount: alertsList.filter(a => a.hasVideo).length,
      avgResponseTime: 0,
      avgResolutionTime: 0,
      topUsers: [] as { userName: string; count: number }[],
      responseEfficiency: 0,
      systemHealth: 'excellent' as 'excellent' | 'good' | 'warning' | 'critical'
    };
    
    // Calcular tiempos de respuesta y resolución
    const resolvedAlerts = alertsList.filter(a => a.status === 'resolved' && a.resolvedAt);
    if (resolvedAlerts.length > 0) {
      const totalResponseTime = resolvedAlerts.reduce((sum, alert) => {
        if (alert.resolvedAt) {
          return sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime());
        }
        return sum;
      }, 0);
      basicStats.avgResponseTime = Math.round(totalResponseTime / resolvedAlerts.length / 1000 / 60); // en minutos
      basicStats.avgResolutionTime = basicStats.avgResponseTime;
    }
    
    // Calcular top usuarios
    const userCounts: { [key: string]: number } = {};
    alertsList.forEach(alert => {
      userCounts[alert.userName] = (userCounts[alert.userName] || 0) + 1;
    });
    basicStats.topUsers = Object.entries(userCounts)
      .map(([userName, count]) => ({ userName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calcular eficiencia de respuesta
    const acknowledgedAlerts = alertsList.filter(a => a.acknowledgedBy && a.acknowledgedBy.length > 0);
    if (alertsList.length > 0) {
      basicStats.responseEfficiency = Math.round((acknowledgedAlerts.length / alertsList.length) * 100);
    }
    
    // Determinar salud del sistema
    const activeRatio = basicStats.active / basicStats.total;
    if (activeRatio > 0.2 || basicStats.responseEfficiency < 70) {
      basicStats.systemHealth = 'critical';
    } else if (activeRatio > 0.1 || basicStats.responseEfficiency < 85) {
      basicStats.systemHealth = 'warning';
    } else if (activeRatio > 0.05 || basicStats.responseEfficiency < 95) {
      basicStats.systemHealth = 'good';
    } else {
      basicStats.systemHealth = 'excellent';
    }
    
    setStats(basicStats);
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...alerts];
    
    // Filtro de búsqueda (nombre, email, ubicación, descripción)
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por usuario específico
    if (userFilter) {
      filtered = filtered.filter(alert => 
        alert.userName.toLowerCase().includes(userFilter.toLowerCase()) ||
        alert.userEmail.toLowerCase().includes(userFilter.toLowerCase())
      );
    }
    
    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }
    
    // Filtro de fechas
    if (dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate)) {
      filtered = filtered.filter(alert => {
        const alertDate = alert.timestamp.toISOString().split('T')[0];
        
        if (dateFilter.startDate && alertDate < dateFilter.startDate) {
          return false;
        }
        if (dateFilter.endDate && alertDate > dateFilter.endDate) {
          return false;
        }
        return true;
      });
    }
    
    // Ordenamiento
    switch (sortBy) {
      case 'recent':
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case 'oldest':
      filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        break;
      case 'status':
        filtered.sort((a, b) => {
          const statusOrder = { 'active': 0, 'expired': 1, 'resolved': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
      case 'user':
        filtered.sort((a, b) => a.userName.localeCompare(b.userName));
        break;
    }
    
    // Calcular paginación
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
    
    // Obtener elementos para la página actual
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAlerts = filtered.slice(startIndex, endIndex);
    
    setFilteredAlerts(paginatedAlerts);
    setTotalItems(totalFiltered);
    
    // Ajustar página si es necesario
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
    
    console.log(`📊 Filtros aplicados: ${totalFiltered} alertas, página ${validCurrentPage}/${totalPages}, mostrando ${paginatedAlerts.length} elementos`);
  };

  // Funciones de manejo de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    toast.success(`Página ${page}`, { duration: 1000 });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
    toast.success(`Mostrando ${newItemsPerPage} alertas por página`, {
      duration: 2000,
      icon: '📊'
    });
  };

  const handleDateFilterChange = (startDate: string, endDate: string, enabled: boolean) => {
    setDateFilter({ startDate, endDate, enabled });
    setCurrentPage(1); // Resetear a la primera página
  };

  // Funciones de acción administrativa
  const handleResolveAlert = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: userProfile?.email || 'admin'
      });
      
      toast.success('Alerta marcada como resuelta');
      loadAlerts(); // Recargar datos
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      toast.error('Error al resolver alerta');
    }
  };

  const handleDeactivateAlert = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'panicReports', alertId);
      await updateDoc(alertRef, {
        status: 'expired',
        resolvedAt: serverTimestamp(),
        resolvedBy: userProfile?.email || 'admin'
      });
      
      toast.success('Alerta desactivada');
      loadAlerts(); // Recargar datos
    } catch (error) {
      console.error('Error al desactivar alerta:', error);
      toast.error('Error al desactivar alerta');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace unos segundos';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  const getSystemHealthColor = () => {
    switch (stats.systemHealth) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemHealthIcon = () => {
    switch (stats.systemHealth) {
      case 'excellent': return <Shield className="w-5 h-5" />;
      case 'good': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <XCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Fecha', 'Usuario', 'Email', 'Ubicación', 'Descripción', 'Estado', 
      'Modo Extremo', 'Tiene Video', 'Notificados', 'Reconocidos', 
      'Duración Configurada', 'Resuelto Por', 'Tiempo de Resolución'
    ];
    
    const rows = alerts.map(alert => {
      const resolutionTime = alert.resolvedAt ? 
        Math.round((alert.resolvedAt.getTime() - alert.timestamp.getTime()) / 1000 / 60) : 0;
      
      return [
      formatDate(alert.timestamp),
      alert.userName,
      alert.userEmail,
      alert.location,
      alert.description,
        alert.status === 'active' ? 'Activa' : 
        alert.status === 'resolved' ? 'Resuelta' : 'Expirada',
        alert.extremeMode ? 'Sí' : 'No',
        alert.hasVideo ? 'Sí' : 'No',
        alert.notifiedUsers.length.toString(),
        alert.acknowledgedBy?.length?.toString() || '0',
        alert.alertDurationMinutes?.toString() || 'N/A',
        alert.resolvedBy || 'N/A',
        resolutionTime.toString()
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-alertas-panico-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Reporte completo exportado exitosamente');
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header con Indicador de Salud del Sistema */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/admin-dashboard')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Centro de Control de Alertas</h1>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getSystemHealthColor()}`}>
                      {getSystemHealthIcon()}
                      <span className="capitalize">{stats.systemHealth}</span>
                    </div>
                  </div>
                  <p className="text-gray-600">Panel de super administración - Monitoreo avanzado y gestión de emergencias</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadAlerts}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={loading}
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Panel de Estadísticas Avanzadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Estadísticas Principales */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Resumen General</h3>
                  </div>
                  <BarChart3 className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Alertas</span>
                    <span className="text-xl font-bold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Últimas 24h</span>
                    <span className="text-lg font-semibold text-blue-600">{stats.last24h}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Últimos 7 días</span>
                    <span className="text-lg font-semibold text-purple-600">{stats.last7d}</span>
                  </div>
                </div>
              </div>
              
              {/* Estado de Alertas */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Estado Actual</h3>
                  </div>
                  <PieChart className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Activas</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{stats.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Resueltas</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.resolved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Expiradas</span>
                    </div>
                    <span className="text-xl font-bold text-gray-600">{stats.expired}</span>
                  </div>
                </div>
              </div>
              
              {/* Métricas de Rendimiento */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Rendimiento</h3>
                  </div>
                  <Target className="w-6 h-6 text-gray-400" />
                  </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tiempo Promedio</span>
                    <span className="text-lg font-semibold text-purple-600">{stats.avgResponseTime}m</span>
                </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Eficiencia</span>
                    <span className="text-lg font-semibold text-blue-600">{stats.responseEfficiency}%</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Modo Extremo</span>
                    <span className="text-lg font-semibold text-orange-600">{stats.extremeModeCount}</span>
                  </div>
                </div>
              </div>
              
              {/* Top Usuarios */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Top Usuarios</h3>
                  </div>
                  <TrendingUp className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-2">
                  {stats.topUsers.slice(0, 3).map((user, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate max-w-24">{user.userName}</span>
                      <span className="text-sm font-semibold text-green-600">{user.count}</span>
                  </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Control y Filtros Avanzados */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Panel de Control Administrativo
              </h3>
              <p className="text-sm text-gray-600">
                Herramientas avanzadas de filtrado, búsqueda y gestión. Configura los parámetros para análisis detallado de alertas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Búsqueda General */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Búsqueda General</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                      placeholder="Nombre, email, ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                />
              </div>
              
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por usuario específico..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-green-300 rounded-lg text-sm text-gray-900 bg-white hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Filtros de Estado y Orden */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-green-900">Filtros y Orden</h4>
            </div>

                <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-green-800 mb-2">Estado de Alerta</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm text-gray-900 bg-white hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                    >
                      <option value="all">Todas las alertas</option>
                      <option value="active">Solo activas</option>
                      <option value="resolved">Solo resueltas</option>
                      <option value="expired">Solo expiradas</option>
                  </select>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-green-800 mb-2">Ordenar por</label>
                  <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm text-gray-900 bg-white hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                    >
                      <option value="recent">Más recientes primero</option>
                      <option value="oldest">Más antiguas primero</option>
                      <option value="status">Por estado</option>
                      <option value="user">Por usuario</option>
                  </select>
                </div>
                </div>
              </div>

              {/* Filtro de Fechas y Paginación */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Fechas y Visualización</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-2">Rango de Fechas</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => {
                          handleDateFilterChange(e.target.value, dateFilter.endDate, true);
                          toast.success('Filtro de fecha actualizado', { duration: 1500 });
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm text-gray-900 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors shadow-sm"
                      />
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => {
                          handleDateFilterChange(dateFilter.startDate, e.target.value, true);
                          toast.success('Filtro de fecha actualizado', { duration: 1500 });
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm text-gray-900 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors shadow-sm"
                      />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-2">Elementos por página</label>
                  <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        handleItemsPerPageChange(newValue);
                      }}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm text-gray-900 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors shadow-sm"
                    >
                      <option value={10}>10 alertas</option>
                      <option value={20}>20 alertas</option>
                      <option value={50}>50 alertas</option>
                      <option value={100}>100 alertas</option>
                  </select>
                </div>
              </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <strong>💡 Consejo:</strong> Los filtros se aplican automáticamente. Usa el filtro de fechas para análisis temporal y el filtro de usuario para seguimiento específico.
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Alertas con Acciones Administrativas */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando alertas del sistema...</p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron alertas</h3>
              <p className="text-gray-600">
                {searchTerm || userFilter || statusFilter !== 'all' || dateFilter.enabled
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar alertas específicas'
                  : 'No hay alertas de pánico registradas en el sistema'}
              </p>
            </div>
          ) : (
            <>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                    className={`bg-white rounded-lg shadow-sm p-6 border-l-4 hover:shadow-lg transition-all duration-200 ${
                      alert.status === 'active' ? 'border-red-500 bg-red-50' : 
                      alert.status === 'resolved' ? 'border-green-500 bg-green-50' : 
                      'border-gray-500 bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {/* Header de la alerta */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`p-3 rounded-full ${
                            alert.status === 'active' ? 'bg-red-100' : 
                            alert.status === 'resolved' ? 'bg-green-100' : 
                            'bg-gray-100'
                        }`}>
                          {alert.status === 'active' ? (
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            ) : alert.status === 'resolved' ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                              <XCircle className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">{alert.userName}</h3>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                alert.status === 'active' ? 'bg-red-200 text-red-800' : 
                                alert.status === 'resolved' ? 'bg-green-200 text-green-800' : 
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {alert.status === 'active' ? '🚨 ACTIVA' : 
                                 alert.status === 'resolved' ? '✅ RESUELTA' : 
                                 '⏰ EXPIRADA'}
                            </span>
                            {alert.extremeMode && (
                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-200 text-purple-800 flex items-center space-x-1">
                                  <Video className="w-3 h-3" />
                                  <span>MODO EXTREMO</span>
                                </span>
                              )}
                              {alert.hasVideo && (
                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-200 text-blue-800 flex items-center space-x-1">
                                <Video className="w-3 h-3" />
                                  <span>CON VIDEO</span>
                              </span>
                            )}
                          </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{alert.userEmail}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{alert.notifiedUsers.length} notificados</span>
                              </div>
                              {alert.acknowledgedBy && alert.acknowledgedBy.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span>{alert.acknowledgedBy.length} reconocidos</span>
                                </div>
                              )}
                            </div>
                        </div>
                      </div>

                        {/* Información detallada */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                          <div>
                              <p className="text-sm font-semibold text-gray-700">Ubicación</p>
                            <p className="text-sm text-gray-600">{alert.location}</p>
                          </div>
                        </div>

                          <div className="flex items-start space-x-3">
                            <Clock className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                              <p className="text-sm font-semibold text-gray-700">Fecha y Hora</p>
                            <p className="text-sm text-gray-600">{formatDate(alert.timestamp)}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</p>
                          </div>
                        </div>

                          <div className="flex items-start space-x-3">
                            <Zap className="w-5 h-5 text-orange-600 mt-1" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Activación</p>
                              <p className="text-sm text-gray-600">
                                {alert.activatedFrom === 'floating_button' ? '📱 Botón Flotante' : '💻 Página Web'}
                              </p>
                              {alert.alertDurationMinutes && (
                                <p className="text-xs text-gray-500">
                                  Duración: {alert.alertDurationMinutes} min
                                </p>
                              )}
                            </div>
                          </div>
                      </div>

                        {/* Descripción */}
                      {alert.description && (
                          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4 border border-gray-200">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-gray-600 mt-1" />
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">Descripción del Incidente</p>
                                <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                        </div>
                        </div>
                      )}

                        {/* Información de resolución */}
                        {alert.resolvedAt && (
                          <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-800">
                                Resuelta por: {alert.resolvedBy || 'Sistema automático'}
                            </span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              {formatDate(alert.resolvedAt)} - {formatTimeAgo(alert.resolvedAt)}
                          </p>
                          </div>
                        )}
                    </div>

                      {/* Acciones administrativas */}
                      <div className="ml-6 flex flex-col space-y-2">
                    <button
                          onClick={() => router.push(`/admin/panic-alerts/${alert.id}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Detalle</span>
                    </button>
                        
                        {alert.status === 'active' && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveAlert(alert.id);
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Resolver</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivateAlert(alert.id);
                              }}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Desactivar</span>
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              ))}
            </div>

              {/* Paginación */}
              {totalItems > itemsPerPage && (
                <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Mostrando <span className="font-bold text-blue-600">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                        <span className="font-bold text-blue-600">
                          {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{' '}
                        de <span className="font-bold text-gray-900">{totalItems}</span> alertas
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Botones de navegación rápida */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Números de página */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, Math.ceil(totalItems / itemsPerPage)) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(
                            Math.ceil(totalItems / itemsPerPage),
                            currentPage - 2 + i
                          ));
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.ceil(totalItems / itemsPerPage))}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PanicAlertsPage;


