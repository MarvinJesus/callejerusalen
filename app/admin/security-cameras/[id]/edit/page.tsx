'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, 
  Save, 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  MapPin,
  Monitor
} from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useProductionStreamUrl } from '@/hooks/useStreamUrl';

// Tipos
interface Camera {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt?: Date;
}

const EditCameraPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cameraId = params.id as string;
  
  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const playerRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    streamUrl: '',
    status: 'active' as Camera['status'],
    coordinates: { lat: 0, lng: 0 }
  });
  
  // Usar el hook para obtener la URL del stream con proxy en producción
  const streamUrl = useProductionStreamUrl(formData.streamUrl);

  // Cargar datos de la cámara
  useEffect(() => {
    if (cameraId) {
      loadCamera();
    }
  }, [cameraId]);

  // Cargar stream cuando cambie la URL
  useEffect(() => {
    if (formData.streamUrl && videoRef.current) {
      loadStream();
    }
  }, [formData.streamUrl]);

  // Limpiar player al desmontar
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  const loadCamera = async () => {
    try {
      setLoading(true);
      const cameraRef = doc(db, 'security_cameras', cameraId);
      const cameraSnap = await getDoc(cameraRef);
      
      if (cameraSnap.exists()) {
        const data = cameraSnap.data();
        const cameraData = {
          id: cameraSnap.id,
          name: data.name || '',
          description: data.description || '',
          streamUrl: data.streamUrl || '',
          status: data.status || 'active',
          coordinates: data.coordinates || { lat: 0, lng: 0 },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        } as Camera;
        
        setCamera(cameraData);
        setFormData({
          name: cameraData.name,
          description: cameraData.description,
          streamUrl: cameraData.streamUrl,
          status: cameraData.status,
          coordinates: cameraData.coordinates
        });
      } else {
        alert('Cámara no encontrada');
        router.push('/admin/security-cameras');
      }
    } catch (error) {
      console.error('Error al cargar cámara:', error);
      alert('Error al cargar los datos de la cámara');
    } finally {
      setLoading(false);
    }
  };

  const loadStream = () => {
    if (!formData.streamUrl || !streamUrl) return;
    
    setStreamError(false);
    setIsStreamPlaying(false);
    
    // Destruir player anterior si existe
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    
    // Detectar tipo de stream (usar URL original para detectar tipo)
    const isMjpeg = formData.streamUrl.includes('.mjpg') || 
                   formData.streamUrl.includes('.mjpeg') || 
                   formData.streamUrl.includes('.jpg') ||
                   formData.streamUrl.includes('faststream') ||
                   formData.streamUrl.includes('snapshot');
    const isHls = formData.streamUrl.includes('.m3u8');
    
    if (isMjpeg) {
      // Para streams MJPEG, usar elemento img con URL procesada
      if (imgRef.current) {
        imgRef.current.src = `${streamUrl}?t=${Date.now()}`;
        imgRef.current.onload = () => {
          console.log('Stream MJPEG cargado');
          setIsStreamPlaying(true);
          setStreamError(false);
        };
        imgRef.current.onerror = () => {
          console.error('Error al cargar stream MJPEG');
          setStreamError(true);
          setIsStreamPlaying(false);
        };
      }
    } else {
      // Para otros tipos de stream (HLS, MP4, etc.) usar Video.js con URL procesada
      if (videoRef.current) {
        const player = videojs(videoRef.current, {
          controls: false,
          responsive: true,
          fluid: true,
          autoplay: true,
          muted: true,
          sources: [{
            src: streamUrl,
            type: isHls ? 'application/x-mpegURL' : 'video/mp4'
          }],
          html5: {
            hls: {
              enableLowInitialPlaylist: true,
              smoothQualityChange: true,
              overrideNative: true
            }
          },
          techOrder: ['html5'],
          preload: 'auto'
        });
        
        playerRef.current = player;
        
        // Event listeners para otros streams
        player.on('loadstart', () => {
          console.log('Cargando stream...');
        });
        
        player.on('canplay', () => {
          console.log('Stream listo para reproducir');
          const playPromise = player.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log('Error al reproducir automáticamente:', error);
            });
          }
        });
        
        player.on('error', (e: any) => {
          console.error('Error en stream:', e);
          setStreamError(true);
          setIsStreamPlaying(false);
        });
        
        player.on('waiting', () => {
          console.log('Buffering...');
        });
        
        player.on('play', () => {
          console.log('Stream iniciado');
          setIsStreamPlaying(true);
          setStreamError(false);
        });
        
        player.on('pause', () => {
          setIsStreamPlaying(false);
        });
        
        // Intentar reproducir automáticamente
        player.ready(() => {
          const playPromise = player.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log('Autoplay falló, el usuario debe hacer click para reproducir:', error);
              setIsStreamPlaying(false);
            });
          }
        });
      }
    }
  };

  const reloadStream = () => {
    const isMjpeg = formData.streamUrl.includes('.mjpg') || 
                   formData.streamUrl.includes('.mjpeg') || 
                   formData.streamUrl.includes('.jpg') ||
                   formData.streamUrl.includes('faststream') ||
                   formData.streamUrl.includes('snapshot');
    
    if (isMjpeg) {
      // Para MJPEG, recargar la imagen con timestamp usando URL procesada
      if (imgRef.current) {
        try {
          imgRef.current.src = `${streamUrl}?t=${Date.now()}`;
        } catch (error) {
          console.error('Error al recargar stream MJPEG:', error);
        }
      }
    } else {
      // Para otros streams, recargar Video.js
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      loadStream();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!camera) return;
    
    try {
      setSaving(true);
      const cameraRef = doc(db, 'security_cameras', camera.id);
      await updateDoc(cameraRef, {
        ...formData,
        updatedAt: Timestamp.now(),
        updatedBy: userProfile?.uid
      });

      alert('✅ Cámara actualizada exitosamente');
      router.push('/admin/security-cameras');
    } catch (error) {
      console.error('Error al actualizar cámara:', error);
      alert('Error al actualizar la cámara');
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status: Camera['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Camera['status']) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'maintenance':
        return 'Mantenimiento';
      case 'offline':
        return 'Fuera de línea';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cámara...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!camera) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cámara no encontrada</h2>
            <p className="text-gray-600 mb-4">La cámara que buscas no existe o ha sido eliminada.</p>
            <Link 
              href="/admin/security-cameras"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Cámaras</span>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin/security-cameras"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver a Cámaras</span>
                </Link>
              </div>
              <UserMenu />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <Camera className="w-8 h-8 text-blue-600" />
                  <span>Editar Cámara</span>
                </h1>
                <p className="text-gray-600 mt-2">
                  Modifica la información de la cámara y visualiza el stream en vivo
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(camera.status)}`}>
                  {getStatusText(camera.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de Edición */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Información de la Cámara</h2>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Cámara *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Ej: Cámara Entrada Principal"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción o Nota
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    placeholder="Descripción de la ubicación o notas sobre la cámara..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Stream (Protocolo HTTP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900 bg-white"
                    placeholder="http://192.168.1.100:8080/video"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: http://192.168.1.100:8080/video o http://admin:password@192.168.1.100/stream
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitud *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Ej: -34.603722"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Ej: -58.381592"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de la Cámara
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Camera['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="maintenance">En Mantenimiento</option>
                    <option value="offline">Fuera de Línea</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Link
                    href="/admin/security-cameras"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview del Stream */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <Monitor className="w-5 h-5" />
                    <span>Vista Previa en Vivo</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={reloadStream}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Recargar</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {formData.streamUrl ? (
                  <div className="relative">
                    {/* Stream MJPEG */}
                    {(formData.streamUrl.includes('.mjpg') || 
                      formData.streamUrl.includes('.mjpeg') || 
                      formData.streamUrl.includes('.jpg') ||
                      formData.streamUrl.includes('faststream') ||
                      formData.streamUrl.includes('snapshot')) ? (
                      <div className="relative">
                        <img
                          ref={imgRef}
                          src={`${streamUrl}?t=${Date.now()}`}
                          alt="Stream MJPEG"
                          className="w-full aspect-video bg-black rounded-lg object-cover"
                          onLoad={() => {
                            console.log('Stream MJPEG cargado exitosamente');
                            setIsStreamPlaying(true);
                            setStreamError(false);
                          }}
                          onError={(e) => {
                            console.error('Error al cargar stream MJPEG:', e);
                            setStreamError(true);
                            setIsStreamPlaying(false);
                          }}
                        />
                        
                        {streamError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                            <div className="text-center text-white">
                              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                              <p className="text-sm">Error al cargar el stream MJPEG</p>
                              <p className="text-xs text-gray-300 mt-1">
                                Verifica que la URL sea correcta y la cámara esté en línea
                              </p>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    ) : (
                      /* Stream Video (HLS, MP4, etc.) */
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="video-js vjs-default-skin w-full h-80 bg-black rounded-lg"
                          muted
                          playsInline
                          data-setup="{}"
                        >
                          <p className="vjs-no-js">
                            Para ver este video, por favor habilita JavaScript y considera actualizar a un 
                            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
                              navegador web que soporte video HTML5
                            </a>.
                          </p>
                        </video>
                        
                        {streamError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                            <div className="text-center text-white">
                              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                              <p className="text-sm">Error al cargar el stream</p>
                              <p className="text-xs text-gray-300 mt-1">
                                Verifica que la URL sea correcta y la cámara esté en línea
                              </p>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Ingresa una URL de stream para ver la vista previa</p>
                    </div>
                  </div>
                )}
                
                {/* Información del Stream */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Información del Stream</h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">URL:</span>
                      <span className="font-mono break-all text-right max-w-xs">
                        {formData.streamUrl || 'No configurado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tipo:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {(formData.streamUrl.includes('.mjpg') || 
                          formData.streamUrl.includes('.mjpeg') || 
                          formData.streamUrl.includes('.jpg') ||
                          formData.streamUrl.includes('faststream') ||
                          formData.streamUrl.includes('snapshot')) ? 'MJPEG' :
                         formData.streamUrl.includes('.m3u8') ? 'HLS' : 'HTTP'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estado:</span>
                      <span className={`flex items-center space-x-1 ${
                        streamError ? 'text-red-600' : 
                        isStreamPlaying ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {streamError ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Error</span>
                          </>
                        ) : isStreamPlaying ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Reproduciendo</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span>Detenido</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Coordenadas:</span>
                      <span className="font-mono text-xs">
                        {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditCameraPage;
