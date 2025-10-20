'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Eye, 
  Maximize2, 
  Minimize2,
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Camera,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  MapPin,
  Download,
  Monitor
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
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastSeen?: Date;
  thumbnail?: string;
  fps?: number;
  resolution?: string;
  recordingEnabled?: boolean;
}

interface UserCameraAccess {
  cameraId: string;
  accessLevel: 'view' | 'control';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

const CameraStreamPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, securityPlan } = useAuth();
  const cameraId = params.id as string;
  
  const [camera, setCamera] = useState<Camera | null>(null);
  const [userAccess, setUserAccess] = useState<UserCameraAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [streamError, setStreamError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenRecorder, setScreenRecorder] = useState<MediaRecorder | null>(null);

  // Verificar si el usuario tiene acceso al plan de seguridad
  const hasSecurityAccess = securityPlan?.status === 'active';

  // Actualizar tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos de la cámara y verificar acceso
  useEffect(() => {
    if (user && hasSecurityAccess && cameraId) {
      loadCameraData();
    } else if (!hasSecurityAccess) {
      setError('No tienes acceso al plan de seguridad');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user, hasSecurityAccess, cameraId]);

  const loadCameraData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar información de la cámara
      const camerasResponse = await fetch('/api/cameras', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!camerasResponse.ok) {
        throw new Error('Error al cargar las cámaras');
      }

      const camerasData = await camerasResponse.json();
      const foundCamera = camerasData.cameras?.find((c: Camera) => c.id === cameraId);

      if (!foundCamera) {
        throw new Error('Cámara no encontrada');
      }

      // Verificar acceso del usuario a esta cámara específica
      const accessResponse = await fetch(`/api/cameras/access/${user?.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (accessResponse.ok) {
        const accessData = await accessResponse.json();
        const userAccessToCamera = accessData.access?.find((access: UserCameraAccess) => 
          access.cameraId === cameraId
        );

        if (!userAccessToCamera) {
        throw new Error('No tienes acceso a esta cámara');
      }

        setUserAccess(userAccessToCamera);
      } else {
        throw new Error('Error al verificar acceso');
      }

      setCamera(foundCamera);
    } catch (error) {
      console.error('Error al cargar datos de la cámara:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para validar URL de stream
  const validateStreamUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && 
             urlObj.hostname.length > 0;
    } catch {
      return false;
    }
  };

  // Función para generar URL de stream con parámetros de cache-busting
  const generateStreamUrl = (baseUrl: string, useStableTimestamp: boolean = false): string => {
    if (!validateStreamUrl(baseUrl)) {
      console.warn(`[STREAM] URL inválida: ${baseUrl}`);
      return baseUrl;
    }

    // Detectar si estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

    // Aplicar proxy solo en producción para URLs HTTP
    let proxiedUrl = baseUrl;
    if (isProduction && baseUrl.startsWith('http://')) {
      const encodedUrl = encodeURIComponent(baseUrl);
      proxiedUrl = `/api/stream-proxy?url=${encodedUrl}`;
    }

    const timestamp = useStableTimestamp 
      ? Math.floor(Date.now() / 30000) * 30000  // Actualizar cada 30 segundos
      : Date.now();  // Timestamp único

    const separator = proxiedUrl.includes('?') ? '&' : '?';
    return `${proxiedUrl}${separator}t=${timestamp}`;
  };

  // Función para manejar errores del stream
  const handleStreamError = () => {
    setStreamError(true);
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setStreamError(false);
        toast.error(`Error en el stream. Reintentando... (${retryCount + 1}/3)`);
      }, 2000 * (retryCount + 1));
    } else {
      toast.error('No se pudo conectar con el stream de la cámara');
    }
  };

  // Función para maximizar la cámara
  const maximizeCamera = () => {
    if (!camera) return;

      setIsFullscreen(true);
    // Crear elemento de video para pantalla completa
    const videoElement = document.createElement('div');
    videoElement.id = 'fullscreen-camera-container';
    videoElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: black;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Crear imagen del stream
    const imgElement = document.createElement('img');
    imgElement.id = 'fullscreen-camera-stream';
    imgElement.src = generateStreamUrl(camera.streamUrl, true);
    imgElement.alt = camera.name;
    imgElement.style.cssText = `
      width: 90vw;
      height: 90vh;
      object-fit: contain;
      aspect-ratio: 16/9;
    `;
    
    // Crear overlay de controles
    const controlsOverlay = document.createElement('div');
    controlsOverlay.id = 'fullscreen-camera-controls';
    controlsOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      padding: 20px;
      z-index: 10000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    // Información de la cámara
    const cameraInfo = document.createElement('div');
    cameraInfo.style.cssText = `
      color: white;
      display: flex;
      align-items: center;
      gap: 15px;
    `;
    cameraInfo.innerHTML = `
      <div>
        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${camera.name}</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${camera.location}</p>
      </div>
      <div style="
        background: ${camera.status === 'online' ? '#10b981' : camera.status === 'offline' ? '#ef4444' : '#f59e0b'};
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        text-transform: capitalize;
      ">
        ${camera.status}
      </div>
    `;
    
    // Controles
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;
    
    // Botón de grabación de pantalla
    const recordButton = document.createElement('button');
    recordButton.id = 'fullscreen-record-button';
    recordButton.style.cssText = `
      background: ${isScreenRecording ? '#dc2626' : '#374151'};
      color: white;
      border: none;
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      ${isScreenRecording ? 'animation: pulse 2s infinite;' : ''}
    `;
    recordButton.innerHTML = isScreenRecording ? 
      '<svg width="20" height="20" fill="currentColor"><rect width="12" height="12" x="4" y="4" rx="2"/></svg>' :
      '<svg width="20" height="20" fill="currentColor"><circle cx="10" cy="10" r="8"/></svg>';
    recordButton.title = isScreenRecording ? 'Detener grabación de pantalla' : 'Iniciar grabación de pantalla';
    
    // Botón de salir
    const exitButton = document.createElement('button');
    exitButton.style.cssText = `
      background: #374151;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    exitButton.innerHTML = '<svg width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    exitButton.title = 'Salir de pantalla completa (ESC)';
    
    // Event listeners
    recordButton.addEventListener('click', () => {
      if (isScreenRecording) {
        stopScreenRecording();
    } else {
        startScreenRecording();
      }
    });
    
    exitButton.addEventListener('click', closeFullscreenCamera);
    
    // Ensamblar elementos
    controls.appendChild(recordButton);
    controls.appendChild(exitButton);
    controlsOverlay.appendChild(cameraInfo);
    controlsOverlay.appendChild(controls);
    videoElement.appendChild(imgElement);
    videoElement.appendChild(controlsOverlay);
    document.body.appendChild(videoElement);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    console.log('[MAXIMIZE] ✓ Cámara en pantalla completa');
  };

  const closeFullscreenCamera = () => {
    console.log('[MAXIMIZE] Cerrando pantalla completa');
    
    // Remover elemento de pantalla completa
    const fullscreenElement = document.getElementById('fullscreen-camera-container');
    if (fullscreenElement) {
      document.body.removeChild(fullscreenElement);
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
    
      setIsFullscreen(false);
  };

  // Funciones para grabación de pantalla
  const startScreenRecording = async () => {
    try {
      console.log('[SCREEN_RECORD] Iniciando grabación de pantalla...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('Tu navegador no soporta la grabación de pantalla');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
          const a = document.createElement('a');
          a.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `recording_${camera?.name}_${timestamp}.webm`;
        
        a.style.display = 'none';
        document.body.appendChild(a);
          a.click();
        document.body.removeChild(a);
        
          URL.revokeObjectURL(url);
        toast.success('Grabación descargada exitosamente');
      };

      mediaRecorder.onerror = (event) => {
        console.error('[SCREEN_RECORD] Error en grabación:', event);
        toast.error('Error durante la grabación de pantalla');
        setIsScreenRecording(false);
        setScreenRecorder(null);
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
        }
        setIsScreenRecording(false);
        setScreenRecorder(null);
      };

      mediaRecorder.start(1000);
      
      setScreenRecorder(mediaRecorder);
      setIsScreenRecording(true);
      toast.success('Grabación de pantalla iniciada');
      
    } catch (error) {
      console.error('[SCREEN_RECORD] Error iniciando grabación:', error);
      toast.error('Error al iniciar la grabación de pantalla');
    }
  };

  const stopScreenRecording = () => {
    if (screenRecorder && screenRecorder.state === 'recording') {
      console.log('[SCREEN_RECORD] Deteniendo grabación...');
      screenRecorder.stop();
      screenRecorder.stream.getTracks().forEach(track => track.stop());
      setIsScreenRecording(false);
      setScreenRecorder(null);
    }
  };

  // Función para manejar tecla ESC para cerrar vista maximizada
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        closeFullscreenCamera();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4" />;
      case 'offline':
        return <XCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Settings className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para ver el stream de la cámara</p>
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
          <Eye className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan de Seguridad Requerido</h2>
          <p className="text-gray-600 mb-6">
            Para acceder al stream de la cámara, debes estar inscrito en el Plan de Seguridad de la Comunidad.
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
          <RotateCcw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando stream de la cámara...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={loadCameraData}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </button>
            <Link
              href="/residentes/seguridad"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!camera || !userAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cámara no disponible</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información de la cámara</p>
          <Link
            href="/residentes/seguridad"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Panel de Seguridad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Banner de grabación de pantalla */}
      {isScreenRecording && (
        <div className="bg-red-600 text-white py-2 px-4 text-center animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-semibold">GRABACIÓN DE PANTALLA ACTIVA</span>
            <span className="text-sm opacity-90">- Presiona el botón de stop para finalizar</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Link
                href="/residentes/seguridad"
                className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                  {camera.name}
                </h1>
                <p className="text-sm text-gray-600 mt-0.5 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {camera.location}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Conectado</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-semibold text-gray-900">{formatTime(currentTime)}</p>
                <p className="text-xs text-gray-500">{formatDate(currentTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información de la cámara */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Cámara</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(camera.status)}`}>
                    {getStatusIcon(camera.status)}
                    <span className="ml-1 capitalize">{camera.status}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ubicación:</span>
                  <span className="text-sm font-medium text-gray-900">{camera.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nivel de Acceso:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{camera.accessLevel}</span>
                      </div>
                {camera.resolution && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolución:</span>
                    <span className="text-sm font-medium text-gray-900">{camera.resolution}</span>
                    </div>
                  )}
                {camera.fps && (
                        <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">FPS:</span>
                    <span className="text-sm font-medium text-gray-900">{camera.fps}</span>
                    </div>
                  )}
                </div>
              </div>
              
                  <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Acceso</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permisos:</span>
                  <span className="text-sm font-medium text-green-600 capitalize">{userAccess.accessLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Otorgado:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(userAccess.grantedAt).toLocaleDateString()}
                  </span>
                </div>
                {userAccess.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expira:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(userAccess.expiresAt).toLocaleDateString()}
                      </span>
                  </div>
                      )}
                    </div>
                  </div>
                  
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles</h3>
              <div className="space-y-3">
                    <button
                  onClick={maximizeCamera}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Pantalla Completa
                    </button>
                    <button
                  onClick={isScreenRecording ? stopScreenRecording : startScreenRecording}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                    isScreenRecording 
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isScreenRecording ? (
                    <>
                      <div className="w-4 h-4 mr-2 bg-white rounded-sm"></div>
                      Detener Grabación
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 mr-2" />
                      Grabar Pantalla
                    </>
                  )}
                    </button>
                    <button
                  onClick={loadCameraData}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Actualizar
                    </button>
                </div>
              </div>
            </div>
          </div>
          
        {/* Stream de la cámara */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="aspect-video bg-black relative">
            {camera.status === 'online' && !streamError ? (
              <img
                src={generateStreamUrl(camera.streamUrl, true)}
                alt={camera.name}
                className="w-full h-full object-contain"
                onError={handleStreamError}
                onLoad={() => {
                  setStreamError(false);
                  setRetryCount(0);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {streamError ? (
                    <>
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                      <h3 className="text-lg font-medium mb-2">Error en el Stream</h3>
                      <p className="text-sm mb-4">No se pudo conectar con la cámara</p>
                <button
                        onClick={() => {
                          setStreamError(false);
                          setRetryCount(0);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reintentar
                </button>
                    </>
                  ) : (
                    <>
                      <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Cámara {camera.status}</h3>
                      <p className="text-sm">La cámara no está disponible en este momento</p>
                    </>
                )}
              </div>
            </div>
            )}

            {/* Overlay de información en tiempo real */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">En Vivo</span>
                </div>
                </div>

            <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
              <div className="text-right">
                <div className="text-sm font-mono font-medium">{formatTime(currentTime)}</div>
                <div className="text-xs opacity-75">{formatDate(currentTime)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {camera.description && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
            <p className="text-gray-600">{camera.description}</p>
          </div>
        )}
      </div>
      
      {/* Estilos CSS para animaciones */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default CameraStreamPage;
