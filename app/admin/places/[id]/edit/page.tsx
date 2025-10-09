'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Copy, Eye, MapPin, Clock, Star, Phone, Globe, Camera, Navigation, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';

interface Place {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string;
  images: string[];
  phone?: string;
  website?: string;
  characteristics?: string[];
  activities?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

const categories = [
  { value: 'miradores', label: 'Miradores' },
  { value: 'pulperias', label: 'Pulperías' },
  { value: 'parques', label: 'Parques' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'historia', label: 'Históricos' },
];

export default function PlaceEditPage() {
  const params = useParams();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPlace, setOriginalPlace] = useState<Place | null>(null);
  const [newCharacteristic, setNewCharacteristic] = useState('');
  const [newActivity, setNewActivity] = useState('');

  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      loadPlace(params.id as string);
    }
  }, [params.id]);

  const loadPlace = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/places/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Lugar no encontrado');
        } else {
          setError('Error al cargar el lugar');
        }
        return;
      }

      const data = await response.json();
      setPlace(data.place);
      setOriginalPlace(data.place);
    } catch (error) {
      console.error('Error al cargar lugar:', error);
      setError('Error al cargar el lugar');
    } finally {
      setLoading(false);
    }
  };

  const savePlace = async () => {
    if (!place) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/places/${place.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(place),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el lugar');
      }

      setHasChanges(false);
      setOriginalPlace(place);
      alert('Lugar guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el lugar');
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = async () => {
    if (!place || !confirm('¿Estás seguro de que quieres eliminar este lugar?')) return;

    try {
      const response = await fetch(`/api/admin/places/${place.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el lugar');
      }

      router.push('/admin/places');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el lugar');
    }
  };

  const clonePlace = async () => {
    if (!place) return;

    try {
      const clonedPlace = {
        ...place,
        name: `${place.name} (Copia)`,
        id: undefined,
      };

      const response = await fetch('/api/admin/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clonedPlace),
      });

      if (!response.ok) {
        throw new Error('Error al clonar el lugar');
      }

      const data = await response.json();
      router.push(`/admin/places/${data.id}/edit`);
    } catch (error) {
      console.error('Error al clonar:', error);
      alert('Error al clonar el lugar');
    }
  };

  const updatePlace = (updates: Partial<Place>) => {
    if (!place) return;
    
    const updatedPlace = { ...place, ...updates };
    setPlace(updatedPlace);
    setHasChanges(true);
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!place || !editingField) return;

    const updates: any = {};
    updates[editingField] = tempValue;
    
    // Validaciones específicas
    if (editingField === 'rating') {
      const rating = parseFloat(tempValue);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        alert('La calificación debe estar entre 0 y 5');
        return;
      }
      updates.rating = rating;
    }

    if (editingField === 'coordinates') {
      try {
        const coords = JSON.parse(tempValue);
        updates.coordinates = coords;
      } catch {
        alert('Formato de coordenadas inválido');
        return;
      }
    }

    updatePlace(updates);
    setIsEditing(false);
    setEditingField(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingField(null);
    setTempValue('');
  };

  const addImage = (url: string) => {
    if (url.trim()) {
      updatePlace({
        images: [...(place?.images || []), url.trim()]
      });
    }
  };

  const removeImage = (index: number) => {
    if (!place) return;
    const newImages = place.images.filter((_, i) => i !== index);
    updatePlace({ images: newImages });
  };

  const setMainImage = (url: string) => {
    updatePlace({ image: url });
  };

  const addCharacteristic = () => {
    if (newCharacteristic.trim() && place) {
      const updatedCharacteristics = [...(place.characteristics || []), newCharacteristic.trim()];
      updatePlace({ characteristics: updatedCharacteristics });
      setNewCharacteristic('');
    }
  };

  const removeCharacteristic = (index: number) => {
    if (place) {
      const updatedCharacteristics = place.characteristics?.filter((_, i) => i !== index) || [];
      updatePlace({ characteristics: updatedCharacteristics });
    }
  };

  const addActivity = () => {
    if (newActivity.trim() && place) {
      const updatedActivities = [...(place.activities || []), newActivity.trim()];
      updatePlace({ activities: updatedActivities });
      setNewActivity('');
    }
  };

  const removeActivity = (index: number) => {
    if (place) {
      const updatedActivities = place.activities?.filter((_, i) => i !== index) || [];
      updatePlace({ activities: updatedActivities });
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'miradores': 'bg-green-100 text-green-800',
      'pulperias': 'bg-orange-100 text-orange-800',
      'parques': 'bg-blue-100 text-blue-800',
      'cultura': 'bg-purple-100 text-purple-800',
      'naturaleza': 'bg-emerald-100 text-emerald-800',
      'historia': 'bg-amber-100 text-amber-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAllImages = () => {
    if (!place) return [];
    const allImages = [place.image, ...(place.images || [])];
    return allImages.filter(img => img && img.trim() !== '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lugar...</p>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lugar no encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'El lugar que buscas no existe'}</p>
          <Link
            href="/admin/places"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Lugares
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute 
      allowedRoles={['admin', 'super_admin']} 
      requiredPermissions={['community.places', 'community.edit']}
      requireAllPermissions={false}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header con controles */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/admin/places"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Editor Visual</h1>
                <p className="text-sm text-gray-500">Editando: {place.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Cambios sin guardar
                </span>
              )}
              <UserMenu />
              
              <button
                onClick={clonePlace}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Clonar
              </button>
              
              <Link
                href={`/visitantes/lugares/${place.id}`}
                target="_blank"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Link>
              
              <button
                onClick={deletePlace}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </button>
              
              <button
                onClick={savePlace}
                disabled={!hasChanges || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido editable */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galería de Imágenes */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {getAllImages().length > 0 ? (
                <>
                  <div className="relative">
                    <img
                      src={getAllImages()[activeImageIndex]}
                      alt={place.name}
                      className="w-full h-96 object-cover"
                    />
                    {getAllImages().length > 1 && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex space-x-2">
                          {getAllImages().map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveImageIndex(index)}
                              className={`w-3 h-3 rounded-full ${
                                index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Miniaturas */}
                  {getAllImages().length > 1 && (
                    <div className="p-4">
                      <div className="flex space-x-2 overflow-x-auto">
                        {getAllImages().map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                              index === activeImageIndex ? 'border-primary-500' : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${place.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay imágenes disponibles</p>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
              {editingField === 'description' ? (
                <div className="space-y-2">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    rows={6}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => startEditing('description', place.description)}
                  className="text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  {place.description}
                </div>
              )}
            </div>

            {/* Información Adicional */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Adicional</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Características</h3>
                  
                  {/* Lista de características */}
                  <ul className="space-y-2 text-gray-700 mb-3">
                    {(place?.characteristics || []).map((characteristic, index) => (
                      <li key={index} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                          {characteristic}
                        </div>
                        <button
                          onClick={() => removeCharacteristic(index)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Agregar nueva característica */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCharacteristic}
                      onChange={(e) => setNewCharacteristic(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      placeholder="Nueva característica..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCharacteristic();
                        }
                      }}
                    />
                    <button
                      onClick={addCharacteristic}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Actividades</h3>
                  
                  {/* Lista de actividades */}
                  <ul className="space-y-2 text-gray-700 mb-3">
                    {(place?.activities || []).map((activity, index) => (
                      <li key={index} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                          {activity}
                        </div>
                        <button
                          onClick={() => removeActivity(index)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Agregar nueva actividad */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      placeholder="Nueva actividad..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addActivity();
                        }
                      }}
                    />
                    <button
                      onClick={addActivity}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información</h2>
              
              <div className="space-y-4">
                {/* Nombre */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nombre</span>
                  {editingField === 'name' ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 bg-white"
                      />
                      <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                      <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                    </div>
                  ) : (
                    <span
                      onClick={() => startEditing('name', place.name)}
                      className="text-gray-900 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      {place.name}
                    </span>
                  )}
                </div>

                {/* Categoría */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Categoría</span>
                  {editingField === 'category' ? (
                    <div className="flex space-x-2">
                      <select
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 bg-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                      <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                    </div>
                  ) : (
                    <span
                      onClick={() => startEditing('category', place.category)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-opacity-80 ${getCategoryColor(place.category)}`}
                    >
                      {getCategoryLabel(place.category)}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Calificación</span>
                  {editingField === 'rating' ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-16 text-gray-900 bg-white"
                      />
                      <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                      <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditing('rating', place.rating.toString())}
                      className="flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      <div className="flex items-center mr-2">
                        {renderStars(place.rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{place.rating}</span>
                    </div>
                  )}
                </div>

                {/* Horarios */}
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">Horarios</span>
                    {editingField === 'hours' ? (
                      <div className="flex space-x-2 mt-1">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1 text-gray-900 bg-white"
                        />
                        <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                        <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                      </div>
                    ) : (
                      <span
                        onClick={() => startEditing('hours', place.hours)}
                        className="text-gray-900 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded block"
                      >
                        {place.hours}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">Dirección</span>
                    {editingField === 'address' ? (
                      <div className="flex space-x-2 mt-1">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1 text-gray-900 bg-white"
                        />
                        <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                        <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                      </div>
                    ) : (
                      <span
                        onClick={() => startEditing('address', place.address)}
                        className="text-gray-900 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded block"
                      >
                        {place.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">Teléfono</span>
                    {editingField === 'phone' ? (
                      <div className="flex space-x-2 mt-1">
                        <input
                          type="tel"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1 text-gray-900 bg-white"
                          placeholder="+506 1234-5678"
                        />
                        <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                        <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                      </div>
                    ) : (
                      <span
                        onClick={() => startEditing('phone', place.phone || '')}
                        className="text-gray-900 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded block"
                      >
                        {place.phone || 'Sin teléfono'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sitio Web */}
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">Sitio Web</span>
                    {editingField === 'website' ? (
                      <div className="flex space-x-2 mt-1">
                        <input
                          type="url"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 flex-1 text-gray-900 bg-white"
                          placeholder="https://ejemplo.com"
                        />
                        <button onClick={saveEdit} className="text-green-600 text-sm">✓</button>
                        <button onClick={cancelEdit} className="text-red-600 text-sm">✗</button>
                      </div>
                    ) : (
                      <span
                        onClick={() => startEditing('website', place.website || '')}
                        className="text-gray-900 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded block"
                      >
                        {place.website || 'Sin sitio web'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado</span>
                  <button
                    onClick={() => updatePlace({ isActive: !place.isActive })}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      place.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {place.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Gestión de Imágenes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Gestión de Imágenes</h2>
              
              {/* Imagen Principal */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Principal
                </label>
                {editingField === 'image' ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditing('image', place.image)}
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="url"
                      value={place.image}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                    />
                  </div>
                )}
              </div>

              {/* Imágenes Adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes Adicionales
                </label>
                
                {/* Input para agregar nueva imagen */}
                <div className="flex space-x-2 mb-3">
                  <input
                    type="url"
                    id="newImageUrl"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addImage(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('newImageUrl') as HTMLInputElement;
                      addImage(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de imágenes adicionales */}
                {place.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Imágenes adicionales ({place.images.length}):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {place.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              <button
                                onClick={() => setMainImage(imageUrl)}
                                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                title="Establecer como principal"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeImage(index)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                title="Eliminar imagen"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h2>
              <div className="relative">
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Mapa interactivo</p>
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                          <input
                            type="number"
                            step="any"
                            value={place.coordinates.lat}
                            onChange={(e) => updatePlace({ 
                              coordinates: { ...place.coordinates, lat: parseFloat(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 bg-white"
                            placeholder="19.4326"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                          <input
                            type="number"
                            step="any"
                            value={place.coordinates.lng}
                            onChange={(e) => updatePlace({ 
                              coordinates: { ...place.coordinates, lng: parseFloat(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 bg-white"
                            placeholder="-99.1332"
                          />
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs">Lat: {place.coordinates.lat}, Lng: {place.coordinates.lng}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${place.coordinates.lat},${place.coordinates.lng}`, '_blank')}
                    className="bg-white/90 hover:bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium shadow-sm transition-colors"
                  >
                    Ver en Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
