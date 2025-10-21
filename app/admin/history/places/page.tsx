'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Edit, Trash2, Plus, ArrowLeft, X, Check, AlertCircle, Calendar, Star, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface HistoricalPlace {
  id?: string;
  name: string;
  description: string;
  year: string;
  significance: string;
  category: string;
  location: string;
  image: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  features: string[];
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: any[];
  places: HistoricalPlace[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const AdminPlacesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlace, setEditingPlace] = useState<HistoricalPlace | null>(null);
  const [editingPlaceIndex, setEditingPlaceIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialHistoryData, setInitialHistoryData] = useState<HistoryPageData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const categories = [
    'Edificio Religioso',
    'Plaza Pública',
    'Casa Histórica',
    'Monumento',
    'Escuela',
    'Centro Comunitario',
    'Mercado',
    'Parque',
    'Calle',
    'Otros'
  ];

  const significanceLevels = [
    'Muy Importante',
    'Importante',
    'Moderada',
    'Básica'
  ];

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      setHistoryData(data.historyData);
      setInitialHistoryData(data.historyData);
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const saveHistoryData = async () => {
    if (!historyData) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar datos de historia');
      }

      const data = await response.json();
      console.log('Datos de historia guardados:', data);
      toast.success('Datos de historia guardados exitosamente');
      setInitialHistoryData(historyData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar datos de historia:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar datos de historia');
      toast.error('Error al guardar datos de historia');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoryData = (updates: Partial<HistoryPageData>) => {
    setHistoryData(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialHistoryData));
      return updated;
    });
  };

  const addPlace = () => {
    const newPlace: HistoricalPlace = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      year: '',
      significance: '',
      category: '',
      location: '',
      image: '',
      coordinates: undefined,
      features: [],
      order: 0,
    };
    setEditingPlace(newPlace);
    setEditingPlaceIndex(null);
    setShowForm(true);
    setNewFeature('');
  };

  const editPlace = (place: HistoricalPlace, index: number) => {
    setEditingPlace({ ...place });
    setEditingPlaceIndex(index);
    setShowForm(true);
    setNewFeature('');
  };

  const confirmDeletePlace = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const deletePlace = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.places.length) {
      toast.error('Índice de lugar inválido');
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedPlaces = historyData.places.filter((_, i) => i !== index);
      
      const reorderedPlaces = updatedPlaces.map((place, newIndex) => ({
        ...place,
        order: newIndex + 1
      }));
      
      const updatedHistoryData = { ...historyData, places: reorderedPlaces };
      setHistoryData(updatedHistoryData);

      console.log('Eliminando lugar en índice:', index);
      console.log('Lugares restantes:', reorderedPlaces);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el lugar');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowDeleteConfirm(null);
      toast.success('Lugar eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar lugar:', error);
      toast.error(error.message || 'Error al eliminar el lugar');
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const savePlace = async () => {
    if (!editingPlace || !historyData) return;

    if (!editingPlace.name.trim() || !editingPlace.description.trim() || !editingPlace.category.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      const updatedPlaces = [...historyData.places];
      
      if (editingPlaceIndex === null) {
        const newPlace = { 
          ...editingPlace,
          order: updatedPlaces.length + 1
        };
        delete newPlace.id;
        updatedPlaces.push(newPlace);
        
        console.log('Agregando nuevo lugar:', newPlace);
      } else {
        if (editingPlaceIndex >= 0 && editingPlaceIndex < updatedPlaces.length) {
          const originalOrder = updatedPlaces[editingPlaceIndex].order;
          const updatedPlace = { 
            ...editingPlace, 
            order: originalOrder 
          };
          
          updatedPlaces[editingPlaceIndex] = updatedPlace;
          
          console.log(`Actualizando lugar en índice ${editingPlaceIndex}:`, updatedPlace);
        } else {
          throw new Error('Índice de lugar inválido para edición');
        }
      }

      const updatedHistoryData = { ...historyData, places: updatedPlaces };
      setHistoryData(updatedHistoryData);

      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el lugar');
      }

      setShowForm(false);
      setEditingPlace(null);
      setEditingPlaceIndex(null);
      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      
      toast.success('Lugar guardado exitosamente');
    } catch (error: any) {
      console.error('Error al guardar lugar:', error);
      toast.error(error.message || 'Error al guardar el lugar');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !editingPlace) return;
    
    setEditingPlace({
      ...editingPlace,
      features: [...editingPlace.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    if (!editingPlace) return;
    
    setEditingPlace({
      ...editingPlace,
      features: editingPlace.features.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando lugares históricos...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 sm:py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/admin/history"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Volver a Historia
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lugares Históricos</h1>
                <p className="text-sm sm:text-base text-gray-600">Gestiona los lugares históricos de Calle Jerusalén</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <UserMenu />
              {hasChanges && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Cambios sin guardar</span>
                  </div>
                  <button
                    onClick={saveHistoryData}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Lista de Lugares */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Lugares Configurados</h2>
            <button
              onClick={addPlace}
              disabled={saving}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Lugar
            </button>
          </div>

          <div className="space-y-4">
            {historyData?.places.map((place, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 w-fit">
                        {place.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                        {place.significance}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                        #{place.order}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{place.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 break-words overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                      maxHeight: '4.2em'
                    }}>
                      {place.description}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {place.year}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {place.location}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        {place.features.length} características
                      </span>
                      {place.image && (
                        <span className="flex items-center text-green-600">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          Con imagen
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4 lg:flex-shrink-0">
                    <button
                      onClick={() => editPlace(place, index)}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      title="Editar lugar"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => confirmDeletePlace(index)}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      title="Eliminar lugar"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {historyData?.places.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay lugares configurados</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Agrega el primer lugar histórico para comenzar</p>
                <button
                  onClick={addPlace}
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Lugar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Edición */}
        {showForm && editingPlace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                {/* Header del Modal */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {editingPlaceIndex === null ? 'Nuevo Lugar Histórico' : 'Editar Lugar Histórico'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {editingPlaceIndex === null 
                        ? 'Agrega un nuevo lugar histórico de Calle Jerusalén'
                        : 'Modifica la información del lugar seleccionado'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Formulario en dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna Izquierda */}
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Lugar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingPlace.name}
                        onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Iglesia de San Juan"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre del lugar histórico</p>
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editingPlace.category}
                        onChange={(e) => setEditingPlace({ ...editingPlace, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Tipo de lugar histórico</p>
                    </div>

                    {/* Año */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año de Construcción/Establecimiento
                      </label>
                      <input
                        type="text"
                        value={editingPlace.year}
                        onChange={(e) => setEditingPlace({ ...editingPlace, year: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: 1950 o Siglo XIX"
                      />
                      <p className="text-xs text-gray-500 mt-1">Año o período de construcción</p>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ubicación
                      </label>
                      <input
                        type="text"
                        value={editingPlace.location}
                        onChange={(e) => setEditingPlace({ ...editingPlace, location: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Calle Principal #123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dirección o ubicación del lugar</p>
                    </div>

                    {/* URL de Imagen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        value={editingPlace.image}
                        onChange={(e) => setEditingPlace({ ...editingPlace, image: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL de la imagen del lugar (opcional)</p>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-4">
                    {/* Importancia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nivel de Importancia
                      </label>
                      <select
                        value={editingPlace.significance}
                        onChange={(e) => setEditingPlace({ ...editingPlace, significance: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      >
                        <option value="">Selecciona el nivel de importancia</option>
                        {significanceLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Importancia histórica del lugar</p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editingPlace.description}
                        onChange={(e) => setEditingPlace({ ...editingPlace, description: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white resize-none"
                        placeholder="Descripción detallada del lugar histórico..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Descripción completa del lugar</p>
                    </div>

                    {/* Características */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Características Especiales
                      </label>
                      
                      {/* Lista de características existentes */}
                      {editingPlace.features.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 bg-gray-50">
                          {editingPlace.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                              <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{feature}</span>
                              <button
                                onClick={() => removeFeature(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                title="Eliminar característica"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para agregar nueva característica */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                          placeholder="Nueva característica..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addFeature();
                            }
                          }}
                        />
                        <button
                          onClick={addFeature}
                          className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                          title="Agregar característica"
                        >
                          <Plus className="w-4 h-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden text-sm">Agregar</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Agrega características especiales del lugar (opcional)</p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={savePlace}
                    disabled={saving}
                    className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Guardar Lugar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      Confirmar eliminación
                    </h3>
                  </div>
                </div>
                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600">
                    ¿Estás seguro de que quieres eliminar este lugar histórico? Esta acción no se puede deshacer.
                  </p>
                  {historyData?.places[showDeleteConfirm] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {historyData.places[showDeleteConfirm].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {historyData.places[showDeleteConfirm].category}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deletePlace(showDeleteConfirm)}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlacesPage;




















