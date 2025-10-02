'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Image as ImageIcon, X, Save, Loader2 } from 'lucide-react';

export interface Place {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string; // Imagen principal
  images: string[]; // Galería de imágenes
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
}

interface PlaceFormProps {
  place?: Place | null;
  onSave: (place: Omit<Place, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const categories = [
  { value: 'miradores', label: 'Miradores' },
  { value: 'pulperias', label: 'Pulperías' },
  { value: 'parques', label: 'Parques' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'historia', label: 'Históricos' },
];

const PlaceForm: React.FC<PlaceFormProps> = ({ place, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<Omit<Place, 'id'>>({
    name: '',
    description: '',
    category: 'miradores',
    address: '',
    hours: '',
    rating: 4.0,
    image: '',
    images: [],
    coordinates: {
      lat: 19.4326,
      lng: -99.1332,
    },
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name,
        description: place.description,
        category: place.category,
        address: place.address,
        hours: place.hours,
        rating: place.rating,
        image: place.image,
        images: place.images || [],
        coordinates: place.coordinates,
        isActive: place.isActive,
      });
    }
  }, [place]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.hours.trim()) {
      newErrors.hours = 'Los horarios son requeridos';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'La URL de la imagen es requerida';
    } else if (!isValidUrl(formData.image)) {
      newErrors.image = 'La URL de la imagen no es válida';
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = 'La calificación debe estar entre 0 y 5';
    }

    if (!formData.coordinates.lat || !formData.coordinates.lng) {
      newErrors.coordinates = 'Las coordenadas son requeridas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const addImage = (url: string) => {
    if (url.trim() && isValidUrl(url.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setMainImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar lugar:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        coordinates: {
          ...prev.coordinates,
          [field]: numValue,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {place ? 'Editar Lugar' : 'Crear Nuevo Lugar'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Lugar *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Mirador de la Cruz"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe el lugar, su historia, características especiales..."
              disabled={isLoading}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Categoría y Calificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                disabled={isLoading}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación (0-5) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                    errors.rating ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                <Star className="absolute right-3 top-2.5 w-4 h-4 text-yellow-500" />
              </div>
              {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Dirección *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Cerro de la Cruz, Calle Jerusalén"
              disabled={isLoading}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* Horarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Horarios *
            </label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => handleInputChange('hours', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                errors.hours ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 5:00 AM - 8:00 PM"
              disabled={isLoading}
            />
            {errors.hours && <p className="mt-1 text-sm text-red-600">{errors.hours}</p>}
          </div>

          {/* Gestión de Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="inline w-4 h-4 mr-1" />
              Imagen Principal *
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                errors.image ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://ejemplo.com/imagen-principal.jpg"
              disabled={isLoading}
            />
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
            
            {/* Vista previa de la imagen principal */}
            {formData.image && isValidUrl(formData.image) && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Imagen principal"
                  className="w-full h-32 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Galería de Imágenes Adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="inline w-4 h-4 mr-1" />
              Galería de Imágenes
            </label>
            
            {/* Input para agregar nueva imagen */}
            <div className="flex space-x-2 mb-3">
              <input
                type="url"
                id="newImageUrl"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                placeholder="https://ejemplo.com/imagen-adicional.jpg"
                disabled={isLoading}
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
                type="button"
                onClick={() => {
                  const input = document.getElementById('newImageUrl') as HTMLInputElement;
                  addImage(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={isLoading}
              >
                Agregar
              </button>
            </div>

            {/* Lista de imágenes adicionales */}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Imágenes adicionales ({formData.images.length}):</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            type="button"
                            onClick={() => setMainImage(imageUrl)}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            title="Establecer como principal"
                            disabled={isLoading}
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Eliminar imagen"
                            disabled={isLoading}
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

            {/* Instrucciones */}
            <div className="mt-2 text-xs text-gray-500">
              <p>• Agrega URLs de imágenes adicionales para crear una galería</p>
              <p>• Haz clic en la estrella para establecer una imagen como principal</p>
              <p>• Haz clic en la X para eliminar una imagen</p>
            </div>
          </div>

          {/* Coordenadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Coordenadas *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lat}
                  onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                    errors.coordinates ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="19.4326"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.lng}
                  onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white ${
                    errors.coordinates ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="-99.1332"
                  disabled={isLoading}
                />
              </div>
            </div>
            {errors.coordinates && <p className="mt-1 text-sm text-red-600">{errors.coordinates}</p>}
          </div>

          {/* Estado Activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Lugar activo (visible para visitantes)
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{place ? 'Actualizar' : 'Crear'} Lugar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceForm;
