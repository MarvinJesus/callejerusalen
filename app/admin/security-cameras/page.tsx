'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Camera, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  MapPin,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Settings,
  RefreshCw,
  Monitor,
  Play,
  Pause,
  Search,
  X,
  GripVertical
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Tipos
interface Camera {
  id: string;
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  accessLevel: 'public' | 'restricted' | 'private';
  coordinates: {
    lat: number;
    lng: number;
  };
  fps?: number;
  resolution?: string;
  recordingEnabled?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastSeen?: Date;
}

// Componente SortableCameraCard
interface SortableCameraCardProps {
  camera: Camera;
  onToggleStatus: (camera: Camera) => void;
  onDelete: (id: string, name: string) => void;
  getStatusClass: (status: Camera['status']) => string;
  getStatusText: (status: Camera['status']) => string;
}

const SortableCameraCard: React.FC<SortableCameraCardProps> = ({
  camera,
  onToggleStatus,
  onDelete,
  getStatusClass,
  getStatusText,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: camera.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden hover:shadow-2xl hover:border-blue-500/50 transition-all duration-500 sm:hover:scale-105 ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      {/* Header de la tarjeta */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-3 sm:p-4 md:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 hover:bg-white/20 rounded transition-colors duration-200 flex-shrink-0"
            >
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold group-hover:scale-105 transition-transform duration-300 truncate">{camera.name}</h3>
          </div>
          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap flex-shrink-0 ${getStatusClass(camera.status)}`}>
            {getStatusText(camera.status)}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {/* Ubicación y Descripción */}
        <div className="pb-3 sm:pb-4 border-b border-gray-600/50 space-y-2">
          {camera.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-300 font-medium">{camera.location}</span>
            </div>
          )}
          {camera.description && (
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-2">{camera.description}</p>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
          <div className="flex items-start space-x-2 sm:space-x-3 group/item">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg group-hover/item:bg-blue-500/30 transition-colors duration-300 flex-shrink-0">
              <Monitor className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-400 block mb-1 sm:mb-2 font-medium">URL de Stream:</span>
              <span className="font-mono text-[10px] sm:text-xs bg-gray-700/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg break-all block text-gray-200 border border-gray-600/50">
                {camera.streamUrl}
              </span>
            </div>
          </div>
          
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 group/item">
            <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg group-hover/item:bg-green-500/30 transition-colors duration-300 flex-shrink-0">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-400 font-medium block sm:inline">Coordenadas:</span>
              <span className="font-mono text-[10px] sm:text-xs mt-1 sm:mt-0 sm:ml-2 text-gray-300 bg-gray-700/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block sm:inline-block break-all">
                {camera.coordinates.lat.toFixed(4)}, {camera.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 group/item">
            <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg group-hover/item:bg-purple-500/30 transition-colors duration-300 flex-shrink-0">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-400 font-medium block sm:inline">Acceso:</span>
              <span className={`text-[10px] sm:text-xs mt-1 sm:mt-0 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block sm:inline-block font-medium ${
                camera.accessLevel === 'public' ? 'bg-green-500/20 text-green-400' :
                camera.accessLevel === 'restricted' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {camera.accessLevel === 'public' ? 'Público' :
                 camera.accessLevel === 'restricted' ? 'Restringido' : 'Privado'}
              </span>
            </div>
          </div>

          {camera.resolution && (
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 group/item">
              <div className="p-1.5 sm:p-2 bg-orange-500/20 rounded-lg group-hover/item:bg-orange-500/30 transition-colors duration-300 flex-shrink-0">
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-400 font-medium block sm:inline">Resolución:</span>
                <span className="text-[10px] sm:text-xs mt-1 sm:mt-0 sm:ml-2 text-gray-300 bg-gray-700/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block sm:inline-block">
                  {camera.resolution}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-600/50">
          <button
            onClick={() => onToggleStatus(camera)}
            className={`group flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium shadow-lg ${
              camera.status === 'active'
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 hover:from-gray-500 hover:to-gray-600 sm:hover:scale-105'
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 sm:hover:scale-105'
            }`}
          >
            {camera.status === 'active' ? (
              <>
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Desactivar</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Activar</span>
              </>
            )}
          </button>
          <Link
            href={`/admin/security-cameras/${camera.id}/edit`}
            className="group flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg sm:hover:scale-105"
            title="Editar"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
          </Link>
          <button
            onClick={() => onDelete(camera.id, camera.name)}
            className="group flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg sm:hover:scale-105"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SecurityCamerasPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    streamUrl: '',
    status: 'active' as Camera['status'],
    accessLevel: 'public' as Camera['accessLevel'],
    coordinates: { lat: 0, lng: 0 },
    fps: 30,
    resolution: '1920x1080',
    recordingEnabled: true
  });

  // Cargar orden personalizado desde localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('camera-order');
    if (savedOrder) {
      try {
        setCustomOrder(JSON.parse(savedOrder));
      } catch (error) {
        console.error('Error loading camera order:', error);
        setCustomOrder([]);
      }
    }
  }, []);

  // Cargar cámaras
  useEffect(() => {
    loadCameras();
  }, []);

  // Guardar orden personalizado en localStorage
  const saveCustomOrder = (order: string[]) => {
    setCustomOrder(order);
    localStorage.setItem('camera-order', JSON.stringify(order));
  };

  // Manejar drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredCameras.findIndex(camera => camera.id === active.id);
      const newIndex = filteredCameras.findIndex(camera => camera.id === over.id);
      
      const newOrder = arrayMove(filteredCameras, oldIndex, newIndex);
      const newOrderIds = newOrder.map(camera => camera.id);
      
      saveCustomOrder(newOrderIds);
    }
  };

  const loadCameras = async () => {
    try {
      setLoading(true);
      const camerasRef = collection(db, 'security_cameras');
      const snapshot = await getDocs(camerasRef);
      
      const camerasData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          location: data.location || '',
          description: data.description || '',
          streamUrl: data.streamUrl || '',
          status: data.status || 'active',
          accessLevel: data.accessLevel || 'public',
          coordinates: data.coordinates || { lat: 0, lng: 0 },
          fps: data.fps || 30,
          resolution: data.resolution || '1920x1080',
          recordingEnabled: data.recordingEnabled !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          createdBy: data.createdBy || 'system',
          lastSeen: data.lastSeen?.toDate()
        } as Camera;
      });

      setCameras(camerasData);
    } catch (error) {
      console.error('Error al cargar cámaras:', error);
      alert('Error al cargar las cámaras');
    } finally {
      setLoading(false);
    }
  };

  // Agregar cámara
  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const camerasRef = collection(db, 'security_cameras');
      const docRef = await addDoc(camerasRef, {
        ...formData,
        createdAt: Timestamp.now(),
        createdBy: userProfile?.uid
      });

      // Agregar la nueva cámara al final del orden personalizado
      const newOrder = [...customOrder, docRef.id];
      saveCustomOrder(newOrder);

      alert('✅ Cámara agregada exitosamente');
      setShowAddModal(false);
      resetForm();
      loadCameras();
    } catch (error) {
      console.error('Error al agregar cámara:', error);
      alert('Error al agregar la cámara');
    }
  };


  // Eliminar cámara
  const handleDeleteCamera = async (cameraId: string, cameraName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la cámara "${cameraName}"?`)) {
      return;
    }

    try {
      const cameraRef = doc(db, 'security_cameras', cameraId);
      await deleteDoc(cameraRef);
      
      // Remover la cámara del orden personalizado
      const newOrder = customOrder.filter(id => id !== cameraId);
      saveCustomOrder(newOrder);
      
      alert('✅ Cámara eliminada exitosamente');
      loadCameras();
    } catch (error) {
      console.error('Error al eliminar cámara:', error);
      alert('Error al eliminar la cámara');
    }
  };

  // Cambiar estado de cámara
  const toggleCameraStatus = async (camera: Camera) => {
    const newStatus = camera.status === 'active' ? 'inactive' : 'active';
    try {
      const cameraRef = doc(db, 'security_cameras', camera.id);
      await updateDoc(cameraRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: userProfile?.uid
      });
      
      loadCameras();
    } catch (error) {
      console.error('Error al cambiar estado de cámara:', error);
      alert('Error al cambiar el estado de la cámara');
    }
  };


  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      description: '',
      streamUrl: '',
      status: 'active',
      accessLevel: 'public',
      coordinates: { lat: 0, lng: 0 },
      fps: 30,
      resolution: '1920x1080',
      recordingEnabled: true
    });
  };

  // Filtrar y ordenar cámaras
  const filteredCameras = cameras
    .filter(camera => {
      const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           camera.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || camera.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Si hay un orden personalizado, usarlo
      if (customOrder.length > 0) {
        const aIndex = customOrder.indexOf(a.id);
        const bIndex = customOrder.indexOf(b.id);
        
        // Si ambas cámaras están en el orden personalizado, usar ese orden
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // Si solo una está en el orden personalizado, priorizarla
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
      }
      
      // Si no hay orden personalizado, usar ordenamiento por nombre
      return a.name.localeCompare(b.name);
    });

  // Estadísticas
  const stats = {
    total: cameras.length,
    active: cameras.filter(c => c.status === 'active').length,
    inactive: cameras.filter(c => c.status === 'inactive').length,
    maintenance: cameras.filter(c => c.status === 'maintenance').length,
    offline: cameras.filter(c => c.status === 'offline').length
  };

  // Obtener clase de estado
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

  // Obtener texto de estado
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Cargando cámaras...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <nav className="bg-gray-800/95 backdrop-blur-md shadow-xl border-b border-gray-700/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link 
                  href="/admin/admin-dashboard"
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 group"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-[-2px] transition-transform duration-300" />
                  <span className="text-sm sm:text-base">Volver</span>
                </Link>
              </div>
              <UserMenu />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header con título y botón */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3 group">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                    Gestión de Cámaras
                  </span>
                </h1>
                <p className="text-gray-300 mt-2 text-sm sm:text-base lg:text-lg hidden sm:block">
                  Administra las cámaras de vigilancia de la comunidad
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/admin/monitoring"
                  className="group flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 text-sm sm:text-base"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium hidden sm:inline">Centro de Monitoreo</span>
                  <span className="font-medium sm:hidden">Monitoreo</span>
                </Link>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="group flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium hidden sm:inline">Agregar Cámara</span>
                  <span className="font-medium sm:hidden">Agregar</span>
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-blue-500/10 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Total</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{stats.total}</p>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-green-500/10 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Activas</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">{stats.active}</p>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-gray-500/10 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Inactivas</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-gray-400 transition-colors duration-300">{stats.inactive}</p>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 bg-gray-500/20 rounded-lg group-hover:bg-gray-500/30 transition-colors duration-300">
                    <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-yellow-500/10 hover:scale-105 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Mantenimiento</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">{stats.maintenance}</p>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors duration-300">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-red-500/10 hover:scale-105 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Fuera de Línea</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">{stats.offline}</p>
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors duration-300">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 min-w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activas</option>
                    <option value="inactive">Inactivas</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="offline">Fuera de Línea</option>
                  </select>
                  <button
                    onClick={loadCameras}
                    className="group flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-gray-500/10 hover:scale-105 text-sm sm:text-base"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-medium hidden sm:inline">Actualizar</span>
                  </button>
                  {customOrder.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que deseas resetear el orden personalizado de las cámaras?')) {
                          setCustomOrder([]);
                          localStorage.removeItem('camera-order');
                        }
                      }}
                      className="group flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-orange-500/10 hover:scale-105 text-sm sm:text-base"
                      title="Resetear orden personalizado"
                    >
                      <Settings className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="font-medium hidden sm:inline">Resetear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Cámaras */}
          {filteredCameras.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
              <div className="p-4 bg-gray-700/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No hay cámaras registradas
              </h3>
              <p className="text-gray-400 mb-8 text-lg">
                Comienza agregando tu primera cámara de seguridad
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium text-lg">Agregar Primera Cámara</span>
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredCameras.map(camera => camera.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                  {filteredCameras.map((camera) => (
                    <SortableCameraCard
                      key={camera.id}
                      camera={camera}
                      onToggleStatus={toggleCameraStatus}
                      onDelete={handleDeleteCamera}
                      getStatusClass={getStatusClass}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Modal Agregar Cámara */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-700/50 animate-in zoom-in-95 duration-300">
              <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 backdrop-blur-md z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Agregar Cámara</h2>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddCamera} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                      Nombre de la Cámara *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                      placeholder="Ej: Cámara Entrada Principal"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                      placeholder="Ej: Cancha Deportiva, Entrada Principal, etc."
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                      Descripción o Nota
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 resize-none text-sm sm:text-base"
                      rows={3}
                      placeholder="Descripción de la ubicación o notas sobre la cámara..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                        Nivel de Acceso
                      </label>
                      <select
                        value={formData.accessLevel}
                        onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as Camera['accessLevel'] })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                      >
                        <option value="public">Público</option>
                        <option value="restricted">Restringido</option>
                        <option value="private">Privado</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                        Estado de la Cámara
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Camera['status'] })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                      >
                        <option value="active">Activa</option>
                        <option value="inactive">Inactiva</option>
                        <option value="maintenance">En Mantenimiento</option>
                        <option value="offline">Fuera de Línea</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                        Resolución
                      </label>
                      <select
                        value={formData.resolution}
                        onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                      >
                        <option value="640x480">640x480 (VGA)</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="1920x1080">1920x1080 (Full HD)</option>
                        <option value="2560x1440">2560x1440 (2K)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                        FPS (Frames por Segundo)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.fps}
                        onChange={(e) => setFormData({ ...formData, fps: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                        placeholder="30"
                      />
                    </div>

                    <div className="group flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.recordingEnabled}
                          onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-700"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-300">
                          Grabación Habilitada
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
                      URL de Stream (Protocolo HTTP) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.streamUrl}
                      onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs sm:text-sm text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70"
                      placeholder="http://192.168.1.100:8080/video"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 ml-1 hidden sm:block">
                      Ejemplo: http://192.168.1.100:8080/video
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                        placeholder="Ej: -34.603722"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white bg-gray-700/50 placeholder-gray-400 transition-all duration-300 hover:bg-gray-700/70 text-sm sm:text-base"
                        placeholder="Ej: -58.381592"
                      />
                    </div>
                  </div>

                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-600/50">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="group w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-600 text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-700/50 transition-all duration-300 sm:hover:scale-105 text-sm sm:text-base"
                  >
                    <span className="font-medium">Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    className="group w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/25 sm:hover:scale-105 text-sm sm:text-base"
                  >
                    <span className="font-semibold">Agregar Cámara</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default SecurityCamerasPage;

