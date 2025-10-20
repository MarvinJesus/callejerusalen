'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  Plus, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Wifi,
  WifiOff,
  Settings,
  Search,
  Filter,
  RefreshCw,
  List
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Camera {
  id: string;
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  accessLevel: 'public' | 'restricted' | 'private';
  coordinates: {
    lat: number;
    lng: number;
  };
  lastSeen?: Date;
  thumbnail?: string;
  resolution?: string;
  fps?: number;
  recordingEnabled?: boolean;
}

interface UserCameraAccess {
  cameraId: string;
  accessLevel: 'view' | 'control';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
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

const RequestCamerasPage: React.FC = () => {
  const { user, userProfile, securityPlan } = useAuth();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [userAccess, setUserAccess] = useState<UserCameraAccess[]>([]);
  const [accessRequests, setAccessRequests] = useState<CameraAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>('Vista de lista de cámaras (modo por defecto)');
  const [showMap, setShowMap] = useState(false);

  // Verificar si el usuario tiene acceso al plan de seguridad
  const hasSecurityAccess = securityPlan?.status === 'active';

  useEffect(() => {
    if (user && hasSecurityAccess) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, hasSecurityAccess]);

  // Cargar Google Maps después de cargar los datos
  useEffect(() => {
    if (cameras.length > 0 && showMap) {
      console.log('🔄 Cargando Google Maps después de obtener datos de cámaras...');
      loadGoogleMaps();
    }
  }, [cameras, showMap]);

  useEffect(() => {
    // No cargar Google Maps automáticamente
    // loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (map && cameras.length > 0) {
      createMapMarkers();
    }
  }, [map, cameras, userAccess, accessRequests]);

  const loadGoogleMaps = () => {
    console.log('🔄 Cargando Google Maps...');
    
    // Verificar si hay API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('⚠️ No hay API key de Google Maps configurada - usando vista alternativa');
      setMapError('Vista de lista de cámaras (Google Maps no configurado)');
      setMapLoading(false);
      return;
    }
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps ya está cargado');
      initializeMap();
      return;
    }

    console.log('📡 Cargando script de Google Maps...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Script de Google Maps cargado exitosamente');
      setMapError(null);
      initializeMap();
    };
    script.onerror = (error) => {
      console.error('❌ Error al cargar Google Maps:', error);
      setMapError('Error al cargar Google Maps. Verifica tu API key y conexión a internet.');
      setMapLoading(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    console.log('🗺️ Inicializando mapa...');
    console.log('mapRef.current:', mapRef.current);
    
    if (!mapRef.current) {
      console.error('❌ mapRef.current es null');
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error('❌ Google Maps no está disponible');
      return;
    }

    try {
      console.log('📍 Creando instancia del mapa...');
      
      // Usar coordenadas de la primera cámara como centro, o coordenadas por defecto
      const defaultCenter = cameras.length > 0 
        ? { lat: cameras[0].coordinates.lat, lng: cameras[0].coordinates.lng }
        : { lat: 10.022344634470162, lng: -84.07817958904717 };
      
      console.log('🎯 Centro del mapa:', defaultCenter);
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'road',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ],
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
      });

      console.log('✅ Mapa inicializado exitosamente');
      setMap(mapInstance);
      setMapLoading(false);
    } catch (error) {
      console.error('❌ Error al inicializar el mapa:', error);
      setMapError('Error al inicializar el mapa');
      setMapLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos de cámaras...');
      
      // Cargar cámaras disponibles
      const camerasResponse = await fetch('/api/cameras', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      console.log('📡 Respuesta de cámaras:', camerasResponse.status);
      
      if (camerasResponse.ok) {
        const camerasData = await camerasResponse.json();
        console.log('📹 Cámaras cargadas:', camerasData.cameras?.length || 0);
        console.log('📷 Detalles de cámaras:', camerasData.cameras?.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          coordinates: c.coordinates
        })));
        setCameras(camerasData.cameras || []);
      } else {
        console.error('❌ Error al cargar cámaras:', camerasResponse.status);
        const errorData = await camerasResponse.json().catch(() => ({}));
        console.error('❌ Detalles del error:', errorData);
      }

      // Cargar acceso del usuario
      const accessResponse = await fetch(`/api/cameras/access/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      console.log('📡 Respuesta de acceso:', accessResponse.status);
      
      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        console.log('🔑 Accesos cargados:', accessData.access?.length || 0);
        setUserAccess(accessData.access || []);
      } else {
        console.error('❌ Error al cargar acceso:', accessResponse.status);
      }

      // Cargar solicitudes del usuario
      const requestsResponse = await fetch(`/api/cameras/requests/user/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      console.log('📡 Respuesta de solicitudes:', requestsResponse.status);
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        console.log('📝 Solicitudes cargadas:', requestsData.requests?.length || 0);
        setAccessRequests(requestsData.requests || []);
      } else {
        console.error('❌ Error al cargar solicitudes:', requestsResponse.status);
      }

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      toast.error('Error al cargar datos de cámaras');
    } finally {
      setLoading(false);
    }
  };

  const createMapMarkers = () => {
    if (!map) return;

    console.log('🗺️ Creando marcadores para el mapa...');
    console.log('📹 Cámaras disponibles:', cameras.length);

    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const filteredCameras = getFilteredCameras();

    console.log('🔍 Cámaras filtradas:', filteredCameras.length);

    filteredCameras.forEach(camera => {
      console.log(`📍 Creando marcador para: ${camera.name} en ${camera.coordinates.lat}, ${camera.coordinates.lng}`);
      
      const userAccessToCamera = userAccess.find(access => access.cameraId === camera.id);
      const pendingRequest = accessRequests.find(request => request.cameraId === camera.id && request.status === 'pending');

      const marker = new google.maps.Marker({
        position: { lat: camera.coordinates.lat, lng: camera.coordinates.lng },
        map: map,
        title: camera.name,
        icon: getMarkerIcon(camera.status, userAccessToCamera, pendingRequest)
      });

      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(camera, userAccessToCamera, pendingRequest)
      });

      marker.addListener('click', () => {
        console.log(`🎯 Marcador clickeado: ${camera.name}`);
        infoWindow.open(map, marker);
        setSelectedCamera(camera);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
    console.log(`✅ ${newMarkers.length} marcadores creados`);

    // Ajustar vista para mostrar todos los marcadores
    if (filteredCameras.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredCameras.forEach(camera => {
        bounds.extend({ lat: camera.coordinates.lat, lng: camera.coordinates.lng });
      });
      map.fitBounds(bounds);
      console.log('🎯 Vista ajustada para mostrar todos los marcadores');
    }
  };

  const getMarkerIcon = (status: string, userAccess?: UserCameraAccess, pendingRequest?: CameraAccessRequest) => {
    let color = '#6B7280'; // gray por defecto
    
    if (userAccess) {
      color = '#10B981'; // green - tiene acceso
    } else if (pendingRequest) {
      color = '#F59E0B'; // yellow - solicitud pendiente
    } else {
      switch (status) {
        case 'online':
          color = '#3B82F6'; // blue
          break;
        case 'offline':
          color = '#EF4444'; // red
          break;
        case 'maintenance':
          color = '#F59E0B'; // yellow
          break;
      }
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 10
    };
  };

  const createInfoWindowContent = (camera: Camera, userAccess?: UserCameraAccess, pendingRequest?: CameraAccessRequest) => {
    const statusIcon = (() => {
      switch (camera.status) {
        case 'online':
          return '<div class="w-4 h-4 text-green-600">📹</div>';
        case 'offline':
          return '<div class="w-4 h-4 text-red-600">📹</div>';
        case 'maintenance':
          return '<div class="w-4 h-4 text-yellow-600">🔧</div>';
        default:
          return '<div class="w-4 h-4 text-gray-600">📹</div>';
      }
    })();

    const accessButton = (() => {
      if (userAccess) {
        return `
          <button onclick="window.requestCameraAccess('${camera.id}', 'view')" 
                  class="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
            ✅ Tienes Acceso
          </button>
        `;
      } else if (pendingRequest) {
        return `
          <button disabled 
                  class="w-full bg-yellow-100 text-yellow-700 px-3 py-2 rounded text-sm cursor-not-allowed">
            ⏳ Solicitud Pendiente
          </button>
        `;
      } else {
        return `
          <button onclick="window.requestCameraAccess('${camera.id}', 'request')" 
                  class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
            📝 Solicitar Acceso
          </button>
        `;
      }
    })();

    return `
      <div class="p-4 min-w-[280px] max-w-[320px]">
        <div class="flex items-center space-x-2 mb-3">
          ${statusIcon}
          <h3 class="font-semibold text-gray-900 text-sm">${camera.name}</h3>
        </div>
        
        <p class="text-xs text-gray-600 mb-2">
          📍 ${camera.location}
        </p>
        
        <p class="text-xs text-gray-500 mb-3">
          ${camera.description}
        </p>
        
        <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Estado: ${camera.status === 'online' ? 'En línea' : 
                        camera.status === 'offline' ? 'Desconectada' : 'Mantenimiento'}</span>
          <span>Nivel: ${camera.accessLevel}</span>
        </div>
        
        ${accessButton}
      </div>
    `;
  };

  const getFilteredCameras = () => {
    const filtered = cameras.filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || camera.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
    
    console.log(`🔍 Filtrado: ${filtered.length} de ${cameras.length} cámaras mostradas`);
    console.log('📹 Cámaras filtradas:', filtered.map(c => ({ name: c.name, status: c.status })));
    
    return filtered;
  };

  const requestCameraAccess = async (cameraId: string, action: string) => {
    if (action === 'request') {
      const camera = cameras.find(c => c.id === cameraId);
      if (camera) {
        setSelectedCamera(camera);
        setShowRequestModal(true);
      }
    } else if (action === 'view') {
      router.push(`/residentes/seguridad/camara/${cameraId}`);
    }
  };

  const handleRequestSubmit = async () => {
    if (!selectedCamera || !requestReason.trim()) {
      toast.error('Por favor proporciona una razón para la solicitud');
      return;
    }

    try {
      const response = await fetch('/api/cameras/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user?.uid,
          cameraId: selectedCamera.id,
          reason: requestReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Solicitud enviada exitosamente');
        setShowRequestModal(false);
        setSelectedCamera(null);
        setRequestReason('');
        loadData(); // Recargar datos
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al enviar solicitud');
      }
    } catch (error) {
      console.error('Error al solicitar acceso:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  // Configurar funciones globales para los botones del mapa
  useEffect(() => {
    (window as any).requestCameraAccess = requestCameraAccess;
  }, [cameras, userAccess, accessRequests]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para solicitar acceso a cámaras</p>
        </div>
      </div>
    );
  }

  if (!hasSecurityAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Camera className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan de Seguridad Requerido</h2>
          <p className="text-gray-600 mb-6">
            Para solicitar acceso a cámaras, debes estar inscrito en el Plan de Seguridad de la Comunidad.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando mapa de cámaras...</p>
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
              <button
                onClick={() => router.push('/residentes/seguridad')}
                className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                  Solicitar Acceso a Cámaras
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Selecciona cámaras en el mapa para solicitar acceso
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
        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cámaras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">Todas las cámaras</option>
                <option value="online">En línea</option>
                <option value="offline">Desconectadas</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowMap(!showMap);
                  if (!showMap) {
                    setMapError(null);
                    setMapLoading(true);
                    loadGoogleMaps();
                  } else {
                    setMapError('Vista de lista de cámaras (modo por defecto)');
                    setMapLoading(false);
                  }
                }}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showMap 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showMap ? (
                  <>
                    <List className="w-4 h-4 mr-2" />
                    Ver Lista
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Ver Mapa
                  </>
                )}
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

        {/* Vista de Lista (por defecto) */}
        {!showMap && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Cámaras de Seguridad Disponibles</h2>
              <p className="text-sm text-gray-600">
                Haz clic en "Solicitar" para solicitar acceso a cualquier cámara
              </p>
            </div>
            
            <div className="p-6">
              {cameras.length > 0 ? (
                <>
                  {/* Información de estado */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Cámaras de Seguridad Disponibles</h3>
                        <p className="text-sm text-blue-700">
                          {cameras.length} cámaras encontradas en el sistema
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{cameras.length}</div>
                        <div className="text-xs text-blue-500">Total</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {cameras.filter(c => c.status === 'online').length}
                        </div>
                        <div className="text-xs text-gray-600">En línea</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">
                          {cameras.filter(c => c.status === 'offline').length}
                        </div>
                        <div className="text-xs text-gray-600">Desconectadas</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-yellow-600">
                          {cameras.filter(c => c.status === 'maintenance').length}
                        </div>
                        <div className="text-xs text-gray-600">Mantenimiento</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredCameras().map(camera => {
                    const userAccessToCamera = userAccess.find(access => access.cameraId === camera.id);
                    const pendingRequest = accessRequests.find(request => request.cameraId === camera.id && request.status === 'pending');
                    
                    return (
                      <div key={camera.id} className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Camera className="w-6 h-6 text-blue-600" />
                            <div>
                              <h5 className="font-semibold text-gray-900">{camera.name}</h5>
                              <p className="text-sm text-gray-600">{camera.location}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full ${
                            camera.status === 'online' ? 'bg-green-500' : 
                            camera.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{camera.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{camera.coordinates.lat.toFixed(6)}, {camera.coordinates.lng.toFixed(6)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <div className={`w-2 h-2 rounded-full ${
                              camera.status === 'online' ? 'bg-green-500' : 
                              camera.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span>
                              {camera.status === 'online' ? 'En línea' : 
                               camera.status === 'offline' ? 'Desconectada' : 'Mantenimiento'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (userAccessToCamera) {
                              router.push(`/residentes/seguridad/camara/${camera.id}`);
                            } else if (pendingRequest) {
                              // Ya tiene solicitud pendiente
                            } else {
                              setSelectedCamera(camera);
                              setShowRequestModal(true);
                            }
                          }}
                          disabled={!!pendingRequest}
                          className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            userAccessToCamera 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : pendingRequest
                              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {userAccessToCamera ? 'Ver Cámara' : 
                           pendingRequest ? 'Solicitud Pendiente' : 'Solicitar Acceso'}
                        </button>
                      </div>
                    );
                  })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cámaras disponibles</h3>
                  <p className="text-gray-600 mb-4">
                    {loading ? 'Cargando cámaras...' : 'No se encontraron cámaras en este momento.'}
                  </p>
                  {!loading && (
                    <button
                      onClick={loadData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Actualizar Lista
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista de Mapa (opcional) */}
        {showMap && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Mapa de Cámaras de Seguridad</h2>
              <p className="text-sm text-gray-600">
                Haz clic en los marcadores para ver información de cada cámara y solicitar acceso
              </p>
            </div>
            
            <div className="relative w-full h-[70vh] min-h-[500px]">
              <div 
                ref={mapRef} 
                className="w-full h-full"
              />
              
              {/* Loading overlay */}
              {mapLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
              
              {/* Error overlay */}
              {mapError && (
                <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
                  <div className="text-center p-6">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-medium mb-2">Error al cargar el mapa</p>
                    <p className="text-red-500 text-sm mb-4">{mapError}</p>
                    <button
                      onClick={() => {
                        setMapError(null);
                        setMapLoading(true);
                        loadGoogleMaps();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Leyenda de Marcadores</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">En línea</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">Desconectada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">Mantenimiento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">Con acceso</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cámaras</p>
                <p className="text-2xl font-bold text-gray-900">{cameras.length}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Con Acceso</p>
                <p className="text-2xl font-bold text-green-600">{userAccess.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
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
        </div>
      </div>

      {/* Modal de Solicitud de Acceso */}
      {showRequestModal && selectedCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Solicitar Acceso a Cámara
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedCamera(null);
                  setRequestReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedCamera.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{selectedCamera.location}</p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón para solicitar acceso:
              </label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explica por qué necesitas acceso a esta cámara..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedCamera(null);
                  setRequestReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCamerasPage;
