'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlaceList from '@/components/PlaceList';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

const AdminPlacesPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar lugares al montar el componente
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/places');
      
      if (!response.ok) {
        throw new Error('Error al cargar lugares');
      }
      
      const data = await response.json();
      setPlaces(data.places || []);
    } catch (error) {
      console.error('Error al cargar lugares:', error);
      showMessage('error', 'Error al cargar los lugares');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };


  const handleDeletePlace = async (placeId: string) => {
    try {
      const response = await fetch(`/api/admin/places/${placeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar lugar');
      }

      const result = await response.json();
      showMessage('success', result.message || 'Lugar eliminado exitosamente');
      await loadPlaces();
    } catch (error) {
      console.error('Error al eliminar lugar:', error);
      showMessage('error', error instanceof Error ? error.message : 'Error al eliminar lugar');
    }
  };

  const handleToggleActive = async (placeId: string, isActive: boolean) => {
    try {
      const place = places.find(p => p.id === placeId);
      if (!place) return;

      const response = await fetch(`/api/admin/places/${placeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...place,
          isActive: !isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado del lugar');
      }

      const result = await response.json();
      showMessage('success', result.message || 'Estado del lugar actualizado');
      await loadPlaces();
    } catch (error) {
      console.error('Error al cambiar estado del lugar:', error);
      showMessage('error', error instanceof Error ? error.message : 'Error al cambiar estado del lugar');
    }
  };

  const handleEditPlace = (place: Place) => {
    router.push(`/admin/places/${place.id}/edit`);
  };

  const handleCreateNew = () => {
    router.push('/admin/places/new');
  };

  // Estadísticas
  const stats = {
    total: places.length,
    active: places.filter(p => p.isActive).length,
    inactive: places.filter(p => !p.isActive).length,
    categories: Array.from(new Set(places.map(p => p.category))).length,
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Lugares</h1>
                <p className="text-gray-600">Administra los lugares de interés de Calle Jerusalén</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {userProfile?.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                </span>
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mensaje de estado */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Lugares</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lugares Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lugares Inactivos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categorías</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de lugares */}
          <PlaceList
            places={places}
            onEdit={handleEditPlace}
            onDelete={handleDeletePlace}
            onToggleActive={handleToggleActive}
            onCreateNew={handleCreateNew}
            isLoading={loading}
          />
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default AdminPlacesPage;














































































































































































































































































































































