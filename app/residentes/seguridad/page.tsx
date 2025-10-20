'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, 
  Shield, 
  Eye, 
  Lock, 
  CheckCircle, 
  Clock, 
  X, 
  AlertTriangle,
  Play,
  Pause,
  Maximize2,
  Settings,
  User,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Bell,
  BellOff
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// Tipos para el sistema de cámaras
interface Camera {
  id: string;
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  accessLevel: 'public' | 'restricted' | 'private';
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastSeen?: Date;
  thumbnail?: string;
}

interface CameraAccessRequest {
  id: string;
  userId: string;
  cameraId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
  reviewNotes?: string;
}

interface UserCameraAccess {
  cameraId: string;
  accessLevel: 'view' | 'control';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

const SecurityPanelPage: React.FC = () => {
  const { user, userProfile, securityPlan } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [userAccess, setUserAccess] = useState<UserCameraAccess[]>([]);
  const [accessRequests, setAccessRequests] = useState<CameraAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');

  // Verificar si el usuario tiene acceso al plan de seguridad
  const hasSecurityAccess = securityPlan?.status === 'active';

  useEffect(() => {
    if (user && hasSecurityAccess) {
      loadSecurityData();
    } else {
      setLoading(false);
    }
  }, [user, hasSecurityAccess]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Cargar acceso del usuario primero
      const accessResponse = await fetch(`/api/cameras/access/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        setUserAccess(accessData.access || []);
        
        // Solo cargar las cámaras a las que el usuario tiene acceso
        const cameraIds = accessData.access?.map((access: any) => access.cameraId) || [];
        if (cameraIds.length > 0) {
          const camerasResponse = await fetch('/api/cameras', {
            headers: {
              'Authorization': `Bearer ${await user?.getIdToken()}`
            }
          });
          if (camerasResponse.ok) {
            const camerasData = await camerasResponse.json();
            // Filtrar solo las cámaras con acceso
            const accessibleCameras = camerasData.cameras?.filter((camera: Camera) => 
              cameraIds.includes(camera.id)
            ) || [];
            setCameras(accessibleCameras);
          }
        } else {
          // Si no tiene acceso a ninguna cámara, mostrar lista vacía
          setCameras([]);
        }
      }

      // Cargar solicitudes del usuario (solo para estadísticas)
      const requestsResponse = await fetch(`/api/cameras/requests/user/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setAccessRequests(requestsData.requests || []);
      }

    } catch (error) {
      console.error('Error al cargar datos de seguridad:', error);
      toast.error('Error al cargar el panel de seguridad');
    } finally {
      setLoading(false);
    }
  };

  // Función removida - las solicitudes se manejan en /residentes/seguridad/solicitar-camaras

  const getCameraStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCameraStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'maintenance':
        return <Settings className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Funciones removidas - ya no se necesitan para esta página

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || camera.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al panel de seguridad</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (!hasSecurityAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan de Seguridad Requerido</h2>
          <p className="text-gray-600 mb-6">
            Para acceder al panel de seguridad personalizado, debes estar inscrito en el Plan de Seguridad de la Comunidad.
          </p>
          <Link
            href="/residentes"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Panel de Residentes
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/residentes"
                className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <X className="w-5 h-5 mr-2 rotate-45" />
                Volver
              </Link>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                  Mis Cámaras de Seguridad
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Cámaras con acceso aprobado para monitoreo personal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Conectado</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {userProfile?.displayName || user?.displayName}
                </p>
                <p className="text-xs text-gray-500">Residente Verificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Mis Cámaras</p>
                <p className="text-2xl font-bold text-gray-900">{cameras.length}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cámaras Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {cameras.filter(c => c.status === 'online').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {accessRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cámaras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todas las cámaras</option>
                <option value="online">En línea</option>
                <option value="offline">Desconectadas</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                href="/residentes/seguridad/solicitar-camaras"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Solicitar Acceso a Cámaras
              </Link>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Cameras Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCameras.map((camera) => {
              return (
                <div key={camera.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {camera.thumbnail ? (
                        <img 
                          src={camera.thumbnail} 
                          alt={camera.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCameraStatusColor(camera.status)}`}>
                        {getCameraStatusIcon(camera.status)}
                        <span className="ml-1 capitalize">{camera.status}</span>
                      </span>
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Acceso
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{camera.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {camera.location}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">{camera.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/residentes/seguridad/camara/${camera.id}`}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Transmisión
                      </Link>
                      
                      <span className="text-xs text-gray-500 capitalize">
                        {camera.accessLevel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cámara
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCameras.map((camera) => {
                    return (
                      <tr key={camera.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Camera className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{camera.name}</div>
                              <div className="text-sm text-gray-500">{camera.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {camera.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCameraStatusColor(camera.status)}`}>
                            {getCameraStatusIcon(camera.status)}
                            <span className="ml-1 capitalize">{camera.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Con Acceso
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/residentes/seguridad/camara/${camera.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Ver Transmisión
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredCameras.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'No se encontraron cámaras' 
                : 'No tienes acceso a ninguna cámara'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Solicita acceso a las cámaras que necesites desde el panel de solicitudes'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                href="/residentes/seguridad/solicitar-camaras"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Solicitar Acceso a Cámaras
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default SecurityPanelPage;
