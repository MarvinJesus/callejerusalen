'use client';

import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  MapPin, 
  Clock, 
  Star, 
  Search, 
  Filter,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

export interface Place {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string;
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

interface PlaceListProps {
  places: Place[];
  onEdit: (place: Place) => void;
  onDelete: (placeId: string) => void;
  onToggleActive: (placeId: string, isActive: boolean) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const categories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'miradores', label: 'Miradores' },
  { value: 'pulperias', label: 'Pulperías' },
  { value: 'parques', label: 'Parques' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'historia', label: 'Históricos' },
];

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  onEdit,
  onDelete,
  onToggleActive,
  onCreateNew,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar y ordenar lugares
  const filteredAndSortedPlaces = places
    .filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           place.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           place.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'createdAt':
          aValue = a.createdAt || new Date(0);
          bValue = b.createdAt || new Date(0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (placeId: string, placeName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el lugar "${placeName}"?\n\nEsta acción no se puede deshacer.`)) {
      onDelete(placeId);
    }
  };

  const handleToggleActive = (placeId: string, isActive: boolean, placeName: string) => {
    const action = isActive ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de que quieres ${action} el lugar "${placeName}"?`)) {
      onToggleActive(placeId, !isActive);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lugares de Interés</h2>
          <p className="text-sm text-gray-600">
            Gestiona los lugares de interés de Calle Jerusalén
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Lugar</span>
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lugares..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Filtro por categoría */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-gray-900 bg-white"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="createdAt-desc">Más recientes</option>
              <option value="createdAt-asc">Más antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="rating-desc">Mejor calificados</option>
              <option value="rating-asc">Menor calificación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de lugares */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPlaces.map(place => (
            <div key={place.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden">
                {place.image ? (
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {getCategoryLabel(place.category)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    place.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {place.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium text-gray-900">{place.rating}</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                  {place.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {place.description}
                </p>

                {/* Información adicional */}
                <div className="space-y-2 text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{place.address}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{place.hours}</span>
                  </div>
                </div>

                {/* Fecha de creación */}
                <div className="text-xs text-gray-400 mb-4">
                  Creado: {formatDate(place.createdAt)}
                </div>

                {/* Acciones */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(place)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(place.id!, place.isActive, place.name)}
                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded transition-colors ${
                      place.isActive
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {place.isActive ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(place.id!, place.name)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron lugares
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Comienza creando tu primer lugar de interés'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Lugar</span>
            </button>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      {filteredAndSortedPlaces.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {filteredAndSortedPlaces.length} de {places.length} lugares
        </div>
      )}
    </div>
  );
};

export default PlaceList;
