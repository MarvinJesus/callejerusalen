'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, Calendar, Star, Share2, BookOpen, Navigation, Clock, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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

const PlaceDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [place, setPlace] = useState<HistoricalPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Buscar el lugar específico
      const placeIndex = parseInt(params.id as string);
      if (data.historyData.places && data.historyData.places[placeIndex]) {
        setPlace(data.historyData.places[placeIndex]);
      } else {
        setError('Lugar no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
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
      case 'Edificio Religioso':
        return '⛪';
      case 'Plaza Pública':
        return '🏛️';
      case 'Casa Histórica':
        return '🏠';
      case 'Monumento':
        return '🗿';
      case 'Escuela':
        return '🏫';
      case 'Centro Comunitario':
        return '🏢';
      case 'Mercado':
        return '🏪';
      case 'Parque':
        return '🌳';
      case 'Calle':
        return '🛣️';
      default:
        return '📍';
    }
  };

  const sharePlace = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place?.name,
          text: place?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error al compartir:', error);
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada al portapapeles');
    }
  };

  const openInMaps = () => {
    if (place?.coordinates) {
      const { lat, lng } = place.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (place?.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.location)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando lugar histórico...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <MapPin className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lugar no encontrado</h2>
            <p className="text-gray-600 mb-4">{error || 'El lugar que buscas no existe'}</p>
            <Link
              href="/visitantes/historia/lugares"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Lugares
            </Link>
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
                href="/visitantes/historia/lugares"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Lugares
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{place.name}</h1>
                <p className="text-gray-600 mt-1">Lugar histórico de Calle Jerusalén</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(place.coordinates || place.location) && (
                <button
                  onClick={openInMaps}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver en mapa
                </button>
              )}
              <button
                onClick={sharePlace}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            {/* Imagen */}
            {place.image && (
              <div className="mb-8">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Información Principal */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {getCategoryIcon(place.category)} {place.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSignificanceColor(place.significance)}`}>
                  <Star className="w-4 h-4 mr-1" />
                  {place.significance}
                </span>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sobre este lugar</h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
              </div>
            </div>

            {/* Características Especiales */}
            {place.features && place.features.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                  Características Especiales
                </h3>
                <div className="space-y-4">
                  {place.features.map((feature, index) => (
                    <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Información del Lugar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Categoría</p>
                    <p className="text-sm text-gray-600">{place.category}</p>
                  </div>
                </div>
                {place.year && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Año</p>
                      <p className="text-sm text-gray-600">{place.year}</p>
                    </div>
                  </div>
                )}
                {place.location && (
                  <div className="flex items-center">
                    <Navigation className="w-5 h-5 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600">{place.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Importancia</p>
                    <p className="text-sm text-gray-600">{place.significance}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Características</p>
                    <p className="text-sm text-gray-600">{place.features.length} registradas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lugares Relacionados */}
            {historyData?.places && historyData.places.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Otros Lugares</h3>
                <div className="space-y-3">
                  {historyData.places
                    .filter((p, index) => p.category === place.category && index !== parseInt(params.id as string))
                    .slice(0, 3)
                    .map((relatedPlace, index) => (
                      <Link
                        key={index}
                        href={`/visitantes/historia/lugares/${historyData.places.indexOf(relatedPlace)}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{relatedPlace.name}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{relatedPlace.description}</p>
                      </Link>
                    ))}
                </div>
                <Link
                  href="/visitantes/historia/lugares"
                  className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos los lugares
                </Link>
              </div>
            )}

            {/* Botón de Mapa */}
            {(place.coordinates || place.location) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
                <button
                  onClick={openInMaps}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage;
