'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, 
  Clock, 
  CheckCircle, 
  X, 
  User, 
  MapPin, 
  Calendar,
  MessageSquare,
  Settings,
  RefreshCw,
  Search,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CameraRequestModal from '@/components/CameraRequestModal';

interface CameraAccessRequest {
  id: string;
  userId: string;
  cameraId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  userEmail: string;
  userName: string;
}

interface Camera {
  id: string;
  name: string;
  location: string;
  accessLevel: 'public' | 'restricted' | 'private';
}

const CameraRequestsPage: React.FC = () => {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [requests, setRequests] = useState<CameraAccessRequest[]>([]);
  const [cameras, setCameras] = useState<Record<string, Camera>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CameraAccessRequest | null>(null);
  const [showCameraRequestModal, setShowCameraRequestModal] = useState<CameraAccessRequest | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Verificar si la autenticación está completa
    if (user !== undefined && userProfile !== undefined) {
      setAuthLoading(false);
      
      if (user && (userProfile?.role === 'admin' || userProfile?.role === 'super_admin')) {
        loadData();
      }
    }
  }, [user, userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar solicitudes
      const requestsResponse = await fetch('/api/cameras/requests', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(requestsData.requests || []);
      }

      // Cargar información de cámaras
      const camerasResponse = await fetch('/api/cameras', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      
      if (camerasResponse.ok) {
        const camerasData = await camerasResponse.json();
        const camerasMap: Record<string, Camera> = {};
        camerasData.cameras.forEach((camera: Camera) => {
          camerasMap[camera.id] = camera;
        });
        setCameras(camerasMap);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraRequestAction = async (requestId: string, action: 'approve' | 'reject', modalData: any) => {
    try {
      console.log('🔍 Procesando solicitud:', { requestId, action, modalData });
      
      const token = await user?.getIdToken();
      if (!token) {
        console.log('❌ No hay token disponible');
        return;
      }

      console.log('📡 Enviando petición a la API...');
      const response = await fetch(`/api/cameras/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          reviewNotes: modalData.reviewNotes || null
        })
      });

      console.log('📡 Respuesta de la API:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta exitosa:', data);
        await loadData(); // Recargar solicitudes
        setShowCameraRequestModal(null);
        
        // Usar el mensaje de la API si está disponible
        const message = data.message || `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`;
        toast.success(message);
      } else {
        const error = await response.json();
        console.error('❌ Error en la respuesta:', error);
        toast.error(error.error || 'Error al procesar solicitud');
      }
    } catch (error) {
      console.error('❌ Error al procesar solicitud:', error);
      toast.error('Error al procesar solicitud');
      // Asegurar que el modal se cierre incluso si hay error
      setShowCameraRequestModal(null);
    }
  };

  const handleDeleteCameraRequest = async (requestId: string) => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch(`/api/cameras/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadData(); // Recargar solicitudes
        setShowCameraRequestModal(null);
        toast.success('Solicitud eliminada exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar solicitud');
      }
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      toast.error('Error al eliminar solicitud');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.cameraId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Verificar acceso solo después de que la autenticación esté completa
  if (!user || (userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">Se requieren permisos de administrador</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando solicitudes...</p>
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
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                Solicitudes de Acceso a Cámaras
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Gestiona las solicitudes de acceso a cámaras de seguridad
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/admin-dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 bg-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Solicitudes</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all" className="text-gray-900">Todas las solicitudes</option>
                <option value="pending" className="text-gray-900">Pendientes</option>
                <option value="approved" className="text-gray-900">Aprobadas</option>
                <option value="rejected" className="text-gray-900">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cámara
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Razón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const camera = cameras[request.cameraId];
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                            <div className="text-sm text-gray-500">{request.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Camera className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {camera?.name || request.cameraId}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {camera?.location || 'Ubicación no disponible'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                            onClick={() => setShowCameraRequestModal(request)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Gestionar
                            </button>
                          </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay solicitudes de acceso en este momento'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal para gestionar solicitud de acceso a cámara */}
      {showCameraRequestModal && (
        <CameraRequestModal
          request={showCameraRequestModal}
          onClose={() => setShowCameraRequestModal(null)}
          onApprove={(reviewNotes) => handleCameraRequestAction(showCameraRequestModal.id, 'approve', { reviewNotes })}
          onReject={(reviewNotes) => handleCameraRequestAction(showCameraRequestModal.id, 'reject', { reviewNotes })}
          onDelete={() => {
            handleDeleteCameraRequest(showCameraRequestModal.id);
            setShowCameraRequestModal(null);
          }}
        />
      )}
    </div>
  );
};

export default CameraRequestsPage;
