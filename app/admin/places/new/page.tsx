'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, MapPin, Clock, Star, Phone, Globe, Camera, Navigation, X } from 'lucide-react';
import Link from 'next/link';
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

export default function NewPlacePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [place, setPlace] = useState<Place>({
    name: '',
    description: '',
    category: 'miradores',
    address: '',
    hours: '',
    rating: 4.0,
    image: '',
    images: [],
    phone: '',
    website: '',
    characteristics: [],
    activities: [],
    coordinates: {
      lat: 19.4326,
      lng: -99.1332,
    },
    isActive: true,
  });

  const [newCharacteristic, setNewCharacteristic] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const savePlace = async () => {
    try {
      setSaving(true);
      console.log('📝 Enviando datos para crear lugar:', JSON.stringify(place, null, 2));
      
      const response = await fetch('/api/admin/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(place),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al crear el lugar');
      }

      const data = await response.json();
      router.push(`/admin/places/${data.id}/edit`);
    } catch (error) {
      console.error('Error al crear:', error);
      alert('Error al crear el lugar');
    } finally {
      setSaving(false);
    }
  };

  const updatePlace = (updates: Partial<Place>) => {
    setPlace(prev => ({ ...prev, ...updates }));
  };

  const addImage = (url: string) => {
    if (url.trim()) {
      updatePlace({
        images: [...place.images, url.trim()]
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = place.images.filter((_, i) => i !== index);
    updatePlace({ images: newImages });
  };

  const setMainImage = (url: string) => {
    updatePlace({ image: url });
  };

  const addCharacteristic = () => {
    if (newCharacteristic.trim()) {
      const updatedCharacteristics = [...(place.characteristics || []), newCharacteristic.trim()];
      updatePlace({ characteristics: updatedCharacteristics });
      setNewCharacteristic('');
    }
  };

  const removeCharacteristic = (index: number) => {
    const updatedCharacteristics = place.characteristics?.filter((_, i) => i !== index) || [];
    updatePlace({ characteristics: updatedCharacteristics });
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      const updatedActivities = [...(place.activities || []), newActivity.trim()];
      updatePlace({ activities: updatedActivities });
      setNewActivity('');
    }
  };

  const removeActivity = (index: number) => {
    const updatedActivities = place.activities?.filter((_, i) => i !== index) || [];
    updatePlace({ activities: updatedActivities });
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
    const allImages = [place.image, ...place.images];
    return allImages.filter(img => img && img.trim() !== '');
  };

  return (
    <ProtectedRoute 
      allowedRoles={['admin', 'super_admin']} 
      requiredPermissions={['community.places', 'community.edit']}
      requireAllPermissions={false}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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
                <h1 className="text-xl font-semibold text-gray-900">Crear Nuevo Lugar</h1>
                <p className="text-sm text-gray-500">Editor Visual</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <UserMenu />
              <button
                onClick={savePlace}
                disabled={!place.name || !place.description || !place.address || !place.hours || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Lugar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
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
                      alt={place.name || 'Nuevo lugar'}
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
                              alt={`${place.name || 'Nuevo lugar'} ${index + 1}`}
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
                    <p className="text-gray-500">Agrega una imagen principal</p>
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descripción</h2>
              <textarea
                value={place.description}
                onChange={(e) => updatePlace({ description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                rows={6}
                placeholder="Describe el lugar, su historia, características especiales..."
              />
            </div>

            {/* Información Adicional */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Adicional</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Características</h3>
                  
                  {/* Lista de características */}
                  <ul className="space-y-2 text-gray-700 mb-3">
                    {(place.characteristics || []).map((characteristic, index) => (
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
                    {(place.activities || []).map((activity, index) => (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={place.name}
                    onChange={(e) => updatePlace({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Nombre del lugar"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={place.category}
                    onChange={(e) => updatePlace({ category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calificación
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={place.rating}
                      onChange={(e) => updatePlace({ rating: parseFloat(e.target.value) })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    />
                    <div className="flex items-center">
                      {renderStars(place.rating)}
                    </div>
                  </div>
                </div>

                {/* Horarios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horarios
                  </label>
                  <input
                    type="text"
                    value={place.hours}
                    onChange={(e) => updatePlace({ hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Ej: 6:00 AM - 9:00 PM"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={place.address}
                    onChange={(e) => updatePlace({ address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="Dirección completa"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={place.phone}
                    onChange={(e) => updatePlace({ phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="+506 1234-5678"
                  />
                </div>

                {/* Sitio Web */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={place.website}
                    onChange={(e) => updatePlace({ website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    placeholder="https://ejemplo.com"
                  />
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
                  Imagen Principal *
                </label>
                <input
                  type="url"
                  value={place.image}
                  onChange={(e) => updatePlace({ image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  placeholder="https://ejemplo.com/imagen-principal.jpg"
                />
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
                    <div className="mt-2 space-y-1">
                      <input
                        type="number"
                        step="any"
                        value={place.coordinates.lat}
                        onChange={(e) => updatePlace({ 
                          coordinates: { ...place.coordinates, lat: parseFloat(e.target.value) }
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-24 text-gray-900 bg-white"
                        placeholder="Lat"
                      />
                      <input
                        type="number"
                        step="any"
                        value={place.coordinates.lng}
                        onChange={(e) => updatePlace({ 
                          coordinates: { ...place.coordinates, lng: parseFloat(e.target.value) }
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-24 text-gray-900 bg-white"
                        placeholder="Lng"
                      />
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
