'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Star, Phone, Globe, Camera, Navigation } from 'lucide-react';
import Link from 'next/link';

interface Place {
  id: string;
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
}

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Función para obtener todas las imágenes del lugar
  const getAllImages = () => {
    if (!place) return [];
    const allImages = [place.image, ...(place.images || [])];
    return allImages.filter(img => img && img.trim() !== '');
  };

  useEffect(() => {
    if (params.id) {
      loadPlace(params.id as string);
    }
  }, [params.id]);

  const loadPlace = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/places/${id}`);
      
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
    } catch (error) {
      console.error('Error al cargar lugar:', error);
      setError('Error al cargar el lugar');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'miradores': 'Miradores',
      'pulperias': 'Pulperías',
      'parques': 'Parques',
      'cultura': 'Cultura',
      'naturaleza': 'Naturaleza',
      'historia': 'Históricos',
      'restaurantes': 'Restaurantes',
      'iglesias': 'Iglesias',
      'museos': 'Museos',
      'hoteles': 'Hoteles',
      'tiendas': 'Tiendas'
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'miradores': 'bg-green-100 text-green-800',
      'pulperias': 'bg-orange-100 text-orange-800',
      'parques': 'bg-blue-100 text-blue-800',
      'cultura': 'bg-purple-100 text-purple-800',
      'naturaleza': 'bg-emerald-100 text-emerald-800',
      'historia': 'bg-amber-100 text-amber-800',
      'restaurantes': 'bg-red-100 text-red-800',
      'iglesias': 'bg-purple-100 text-purple-800',
      'museos': 'bg-yellow-100 text-yellow-800',
      'hoteles': 'bg-indigo-100 text-indigo-800',
      'tiendas': 'bg-pink-100 text-pink-800'
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

  const openInGoogleMaps = () => {
    if (place) {
      const url = `https://www.google.com/maps?q=${place.coordinates.lat},${place.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const openInGoogleEarth = () => {
    if (place) {
      const url = `https://earth.google.com/web/@${place.coordinates.lat},${place.coordinates.lng},1000a,35y,0h,0t,0r`;
      window.open(url, '_blank');
    }
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
            href="/visitantes/lugares"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/visitantes/lugares"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{place.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(place.category)}`}>
                  {getCategoryLabel(place.category)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={openInGoogleMaps}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Google Maps
              </button>
              <button
                onClick={openInGoogleEarth}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Google Earth
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <p className="text-gray-700 leading-relaxed">{place.description}</p>
            </div>

            {/* Información Adicional */}
            {((place.characteristics && place.characteristics.length > 0) || (place.activities && place.activities.length > 0)) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Adicional</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {place.characteristics && place.characteristics.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Características</h3>
                      <ul className="space-y-2 text-gray-700">
                        {place.characteristics.map((characteristic, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            {characteristic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {place.activities && place.activities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Actividades</h3>
                      <ul className="space-y-2 text-gray-700">
                        {place.activities.map((activity, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información</h2>
              
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Calificación</span>
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {renderStars(place.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{place.rating}</span>
                  </div>
                </div>

                {/* Horarios */}
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <span className="text-gray-600 block">Horarios</span>
                    <span className="text-gray-900 font-medium">{place.hours}</span>
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <span className="text-gray-600 block">Dirección</span>
                    <span className="text-gray-900 font-medium">{place.address}</span>
                  </div>
                </div>

                {/* Teléfono - Solo mostrar si existe */}
                {place.phone && place.phone.trim() && (
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Teléfono</span>
                      <span className="text-gray-900 font-medium">{place.phone}</span>
                    </div>
                  </div>
                )}

                {/* Sitio Web - Solo mostrar si existe */}
                {place.website && place.website.trim() && (
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600 block">Sitio Web</span>
                      <a 
                        href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {place.website}
                      </a>
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
                    <p className="text-gray-500 text-xs">Lat: {place.coordinates.lat}</p>
                    <p className="text-gray-500 text-xs">Lng: {place.coordinates.lng}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={openInGoogleMaps}
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
  );
}
