'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Users, Star, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CulturalTradition {
  id?: string;
  name: string;
  description: string;
  category: string;
  image: string;
  importance: string;
  practices: string[];
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: any[];
  traditions: CulturalTradition[];
  places: any[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const TraditionsPage: React.FC = () => {
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImportance, setSelectedImportance] = useState('');

  const categories = [
    'Festividades',
    'Gastronomía',
    'Música y Danza',
    'Artesanías',
    'Religión',
    'Costumbres',
    'Lenguaje',
    'Otros'
  ];

  const importanceLevels = [
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
      
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      setHistoryData(data.historyData);
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'Muy Importante':
        return 'bg-red-100 text-red-800';
      case 'Importante':
        return 'bg-orange-100 text-orange-800';
      case 'Moderada':
        return 'bg-yellow-100 text-yellow-800';
      case 'Básica':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Festividades':
        return '🎉';
      case 'Gastronomía':
        return '🍽️';
      case 'Música y Danza':
        return '🎵';
      case 'Artesanías':
        return '🎨';
      case 'Religión':
        return '⛪';
      case 'Costumbres':
        return '👥';
      case 'Lenguaje':
        return '💬';
      default:
        return '📚';
    }
  };

  const filteredTraditions = historyData?.traditions.filter(tradition => {
    if (!tradition) return false;
    
    const matchesSearch = (tradition.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tradition.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || (tradition.category || '') === selectedCategory;
    const matchesImportance = !selectedImportance || (tradition.importance || '') === selectedImportance;
    
    return matchesSearch && matchesCategory && matchesImportance;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando tradiciones culturales...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Heart className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar las tradiciones</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link
                href="/visitantes/historia"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Historia
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tradiciones Culturales</h1>
                <p className="text-gray-600 mt-1">Descubre las tradiciones que dan vida a Calle Jerusalén</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar tradiciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </option>
                ))}
              </select>

              {/* Filtro por importancia */}
              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas las importancias</option>
                {importanceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Tradiciones</p>
                <p className="text-2xl font-semibold text-gray-900">{historyData?.traditions.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Muy Importantes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {historyData?.traditions.filter(t => t.importance === 'Muy Importante').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Categorías</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(historyData?.traditions.map(t => t.category)).size || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Tradiciones */}
        {filteredTraditions.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory || selectedImportance 
                ? 'No se encontraron tradiciones' 
                : 'No hay tradiciones disponibles'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory || selectedImportance 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Las tradiciones culturales se están preparando'
              }
            </p>
            {(searchTerm || selectedCategory || selectedImportance) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedImportance('');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTraditions.map((tradition, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagen */}
                {tradition.image && (
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={tradition.image}
                      alt={tradition.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Contenido */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {getCategoryIcon(tradition.category)} {tradition.category}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(tradition.importance)}`}>
                          {tradition.importance}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{tradition.name}</h3>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {tradition.description}
                  </p>

                  {/* Prácticas */}
                  {tradition.practices && tradition.practices.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Prácticas y Costumbres:</h4>
                      <div className="space-y-1">
                        {(tradition.practices || []).slice(0, 3).map((practice, practiceIndex) => (
                          <div key={practiceIndex} className="flex items-start">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2"></div>
                            <span className="text-sm text-gray-600">{practice}</span>
                          </div>
                        ))}
                        {(tradition.practices || []).length > 3 && (
                          <p className="text-xs text-gray-500 ml-3.5">
                            +{(tradition.practices || []).length - 3} más...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="w-4 h-4 mr-1" />
                      {(tradition.practices || []).length} prácticas
                    </div>
                    <button
                      onClick={() => router.push(`/visitantes/historia/tradiciones/${index}`)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraditionsPage;
