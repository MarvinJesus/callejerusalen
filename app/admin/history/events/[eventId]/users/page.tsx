'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Users, UserX, Ban, CheckCircle, Clock, AlertCircle, Search, Filter, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  userStatus?: string;
  userPhone?: string;
  userAddress?: string;
  registrationDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'blocked';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommunityEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  type: string;
  organizer: string;
  contact: string;
  image: string;
  maxParticipants?: number;
  requirements: string[];
  highlights: string[];
  isRecurring: boolean;
  recurringPattern?: string;
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: any[];
  places: any[];
  events: CommunityEvent[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const EventUsersManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const eventId = params.eventId as string;

  useEffect(() => {
    console.log('EventUsersManagementPage: eventId recibido:', eventId);
    console.log('EventUsersManagementPage: userProfile:', userProfile);
    loadEventData();
    loadRegistrations();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      console.log('Cargando datos del evento con ID:', eventId);
      const response = await fetch('/api/admin/history');
      if (response.ok) {
        const data = await response.json();
        const eventIndex = parseInt(eventId);
        console.log('Evento encontrado en índice:', eventIndex, data.historyData.events[eventIndex]);
        if (data.historyData.events && data.historyData.events[eventIndex]) {
          setEvent(data.historyData.events[eventIndex]);
        } else {
          console.error('Evento no encontrado en índice:', eventIndex);
          setError('Evento no encontrado');
        }
      } else {
        console.error('Error en respuesta de API:', response.status);
        setError('Error al cargar datos del evento');
      }
    } catch (error) {
      console.error('Error al cargar datos del evento:', error);
      setError('Error al cargar datos del evento');
    }
  };

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      console.log('Cargando registros del evento:', eventId);
      
      const response = await fetch(`/api/events/${eventId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        console.log('Registros obtenidos:', data.registrations);
        
        // Enriquecer los datos con información adicional del usuario
        const enrichedRegistrations = await Promise.all(
          (data.registrations || []).map(async (reg: any) => {
            try {
              // Obtener información adicional del usuario
              const userResponse = await fetch(`/api/admin/users/${reg.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...reg,
                  userRole: userData.user?.role || 'visitante',
                  userStatus: userData.user?.status || 'active',
                  userPhone: userData.user?.phone || '',
                  userAddress: userData.user?.address || ''
                };
              }
              return reg;
            } catch (error) {
              console.error('Error al obtener datos del usuario:', error);
              return reg;
            }
          })
        );
        
        setRegistrations(enrichedRegistrations);
      } else {
        console.error('Error al cargar registros:', response.statusText);
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterUser = async (registrationId: string, userId: string) => {
    try {
      setActionLoading(registrationId);
      
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success('Usuario desinscrito exitosamente');
        await loadRegistrations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al desinscribir usuario');
      }
    } catch (error) {
      console.error('Error al desinscribir usuario:', error);
      toast.error('Error al desinscribir usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (registrationId: string, userId: string) => {
    try {
      setActionLoading(registrationId);
      
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Usuario bloqueado exitosamente');
        await loadRegistrations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al bloquear usuario');
      }
    } catch (error) {
      console.error('Error al bloquear usuario:', error);
      toast.error('Error al bloquear usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (registrationId: string, userId: string) => {
    try {
      setActionLoading(registrationId);
      
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Usuario desbloqueado exitosamente');
        await loadRegistrations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al desbloquear usuario');
      }
    } catch (error) {
      console.error('Error al desbloquear usuario:', error);
      toast.error('Error al desbloquear usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReRegisterUser = async (registrationId: string, userId: string) => {
    try {
      setActionLoading(registrationId);
      
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Usuario re-inscrito exitosamente');
        await loadRegistrations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al re-inscribir usuario');
      }
    } catch (error) {
      console.error('Error al re-inscribir usuario:', error);
      toast.error('Error al re-inscribir usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (registrationId: string, userId: string) => {
    try {
      setActionLoading(registrationId);
      
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Registro de usuario eliminado permanentemente');
        await loadRegistrations();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al eliminar registro');
      }
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      toast.error('Error al eliminar registro');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(null);
    }
  };

  const confirmDelete = (registrationId: string, userId: string) => {
    setShowDeleteConfirm(registrationId);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <UserX className="w-4 h-4 text-gray-600" />;
      case 'blocked':
        return <Ban className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      case 'blocked':
        return 'Bloqueado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesRole = roleFilter === 'all' || reg.userRole === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

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

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Evento no encontrado'}</p>
            <Link
              href="/admin/history/events"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  console.log('Renderizando EventUsersManagementPage con eventId:', eventId, 'event:', event, 'loading:', loading, 'error:', error);

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/admin/history/events"
                  className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Volver a Eventos
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Usuarios</h1>
                  <p className="text-gray-600 mt-1">{event.title}</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Inscritos</p>
                  <p className="text-2xl font-semibold text-gray-900">{registrations.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Confirmados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Ban className="w-8 h-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Bloqueados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.status === 'blocked').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas por Rol */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Super Admins</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.userRole === 'super_admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.userRole === 'admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Comunidad</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.userRole === 'comunidad').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Visitantes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {registrations.filter(r => r.userRole === 'visitante').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Cancelados</option>
                  <option value="blocked">Bloqueados</option>
                </select>
              </div>
              <div className="sm:w-48">
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
            </div>
          </div>

          {/* Lista de Usuarios */}
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron usuarios' : 'No hay usuarios inscritos'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda' 
                  : 'Los usuarios aparecerán aquí cuando se inscriban al evento'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Usuarios Inscritos ({filteredRegistrations.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <div key={registration.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(registration.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {registration.userName}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                              {getStatusText(registration.status)}
                            </span>
                            {registration.userRole && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                registration.userRole === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                registration.userRole === 'admin' ? 'bg-blue-100 text-blue-800' :
                                registration.userRole === 'comunidad' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {registration.userRole}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {registration.userEmail}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>Inscrito el {formatDate(registration.registrationDate)}</span>
                            {registration.userPhone && (
                              <span>📞 {registration.userPhone}</span>
                            )}
                            {registration.userAddress && (
                              <span>📍 {registration.userAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {registration.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleUnregisterUser(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                              {actionLoading === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                              ) : (
                                <UserX className="w-3 h-3 mr-1" />
                              )}
                              Desinscribir
                            </button>
                            <button
                              onClick={() => handleBlockUser(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              {actionLoading === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                              ) : (
                                <Ban className="w-3 h-3 mr-1" />
                              )}
                              Bloquear
                            </button>
                            <button
                              onClick={() => confirmDelete(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-red-600 shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </button>
                          </>
                        )}
                        {registration.status === 'blocked' && (
                          <>
                            <button
                              onClick={() => handleUnblockUser(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {actionLoading === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Desbloquear
                            </button>
                            <button
                              onClick={() => confirmDelete(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-red-600 shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </button>
                          </>
                        )}
                        {registration.status === 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleReRegisterUser(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {actionLoading === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                              ) : (
                                <UserPlus className="w-3 h-3 mr-1" />
                              )}
                              Re-inscribir
                            </button>
                            <button
                              onClick={() => confirmDelete(registration.id, registration.userId)}
                              disabled={actionLoading === registration.id}
                              className="inline-flex items-center px-3 py-1.5 border border-red-600 shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar usuario */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                ¿Eliminar registro permanentemente?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Esta acción <strong>no se puede deshacer</strong>. El registro del usuario será eliminado 
                completamente del sistema y no podrá ser recuperado.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const registration = registrations.find(r => r.id === showDeleteConfirm);
                    if (registration) {
                      handleDeleteUser(registration.id, registration.userId);
                    }
                  }}
                  disabled={actionLoading === showDeleteConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === showDeleteConfirm ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </div>
                  ) : (
                    'Sí, eliminar permanentemente'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default EventUsersManagementPage;
