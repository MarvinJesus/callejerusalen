'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Camera, AlertTriangle, Filter, Search, Eye } from 'lucide-react';

// Importar ImprovedMapComponent dinámicamente para evitar problemas de SSR
const ImprovedMapComponent = dynamic(() => import('@/components/ImprovedMapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface MapPoint {
  id: string;
  name: string;
  type: 'place' | 'service' | 'camera' | 'alert';
  coordinates: [number, number];
  description: string;
  address?: string;
  phone?: string;
  website?: string;
  status?: 'online' | 'offline' | 'maintenance';
  image?: string;
}

const MapPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<MapPoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapComponent, setMapComponent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const getStreetViewUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=0&pitch=0&fov=80`;

  // Función dedicada para activar Street View
  const activateStreetView = (lat: number, lng: number, pointName: string) => {
    console.log(`=== ACTIVATING STREET VIEW ===`);
    console.log(`Point: ${pointName}`);
    console.log(`Coordinates: ${lat}, ${lng}`);
    console.log('Map state:', { 
      map: !!map, 
      mapComponent: !!mapComponent, 
      mapReady,
      googleMaps: !!(window.google && window.google.maps)
    });
    
    // Verificar que Google Maps esté disponible
    if (!window.google || !window.google.maps) {
      console.log('❌ Google Maps not available, opening in new tab');
      const streetViewUrl = getStreetViewUrl(lat, lng);
      window.open(streetViewUrl, '_blank');
      return;
    }

    // Si el mapa no está listo, intentar esperar un poco y reintentar
    if (!mapReady || !map) {
      console.log('⏳ Map not ready, waiting and retrying...');
      setTimeout(() => {
        activateStreetView(lat, lng, pointName);
      }, 500);
      return;
    }

    // Método 1: Intentar usar el método del mapComponent (más confiable)
    if (mapComponent?.showStreetView && typeof mapComponent.showStreetView === 'function') {
      console.log('🔄 Method 1: Using mapComponent.showStreetView');
      try {
        const success = mapComponent.showStreetView(lat, lng, 0, 0);
        if (success) {
          console.log('✅ Street View activated via mapComponent');
          return;
        } else {
          console.log('❌ mapComponent.showStreetView returned false');
        }
      } catch (error) {
        console.error('❌ Error in mapComponent.showStreetView:', error);
      }
    } else {
      console.log('❌ mapComponent.showStreetView not available');
    }

    // Método 2: Usar el mapa directamente
    if (map && typeof map.getStreetView === 'function') {
      console.log('🔄 Method 2: Using direct map Street View');
      try {
        const panorama = map.getStreetView();
        console.log('Panorama object:', panorama);
        
        if (panorama && typeof panorama.setPosition === 'function') {
          panorama.setPosition({ lat, lng });
          panorama.setPov({ heading: 0, pitch: 0 });
          panorama.setVisible(true);
          console.log('✅ Street View activated via direct map');
          return;
        } else {
          console.log('❌ Panorama methods not available');
        }
      } catch (error) {
        console.error('❌ Error using direct map Street View:', error);
      }
    } else {
      console.log('❌ Direct map Street View not available');
    }

    // Fallback: Abrir en nueva pestaña
    console.log('🔄 Fallback: Opening Street View in new tab');
    const streetViewUrl = getStreetViewUrl(lat, lng);
    window.open(streetViewUrl, '_blank');
  };

  // Función para convertir lugares de la API a puntos del mapa
  const convertPlacesToMapPoints = (places: any[]): MapPoint[] => {
    return places.map(place => {
      // Determinar el tipo basado en la categoría
      let type: 'place' | 'service' = 'place';
      if (place.category === 'servicios' || 
          place.category === 'comercios' || 
          place.category === 'restaurantes' ||
          place.category === 'farmacias' ||
          place.category === 'tiendas') {
        type = 'service';
      }
      
      // Validar coordenadas del lugar
      let lat = place.coordinates?.lat;
      let lng = place.coordinates?.lng;
      
      // Verificar si las coordenadas son válidas
      if (typeof lat !== 'number' || typeof lng !== 'number' || 
          isNaN(lat) || isNaN(lng) || 
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`Coordenadas inválidas para lugar ${place.name}, usando coordenadas por defecto`);
        lat = 10.02280446907578;
        lng = -84.07857158309207;
      }
      
      return {
        id: place.id,
        name: place.name,
        type: type,
        coordinates: [lat, lng],
        description: place.description,
        address: place.address,
        phone: place.phone,
        website: place.website,
        status: undefined,
        image: place.image || (Array.isArray(place.images) ? place.images[0] : undefined)
      };
    });
  };

  // Función para convertir servicios locales a puntos del mapa
  const convertServicesToMapPoints = (services: any[]): MapPoint[] => {
    return services.map(service => {
      // Validar y usar coordenadas por defecto si son inválidas
      let lat = service.latitude;
      let lng = service.longitude;
      
      // Verificar si las coordenadas son válidas
      if (typeof lat !== 'number' || typeof lng !== 'number' || 
          isNaN(lat) || isNaN(lng) || 
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`Coordenadas inválidas para servicio ${service.name}, usando coordenadas por defecto`);
        lat = 10.02280446907578;
        lng = -84.07857158309207;
      }
      
      return {
        id: `service-${service.id}`,
        name: service.name,
        type: 'service' as const,
        coordinates: [lat, lng],
        description: service.description,
        address: service.address,
        phone: service.phone,
        website: undefined,
        status: undefined,
        image: service.image
      };
    });
  };

  // Función para obtener datos reales de la API
  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener lugares y servicios en paralelo
      const [placesResponse, servicesResponse] = await Promise.all([
        fetch('/api/places'),
        fetch('/api/services')
      ]);
      
      if (!placesResponse.ok) {
        throw new Error('Error al cargar lugares');
      }
      
      if (!servicesResponse.ok) {
        throw new Error('Error al cargar servicios');
      }
      
      const [placesData, servicesData] = await Promise.all([
        placesResponse.json(),
        servicesResponse.json()
      ]);
      
      const places = placesData.places || [];
      const services = servicesData.services || [];
      
      // Convertir lugares a puntos del mapa
      const placePoints = convertPlacesToMapPoints(places);
      
      // Convertir servicios a puntos del mapa
      const servicePoints = convertServicesToMapPoints(services);
      
      // Combinar todos los puntos
      const allMapPoints = [...placePoints, ...servicePoints];
      
      setAllPoints(allMapPoints);
      console.log(`✅ Cargados ${allMapPoints.length} puntos del mapa (${placePoints.length} lugares + ${servicePoints.length} servicios locales)`);
      
    } catch (error) {
      console.error('❌ Error al cargar datos del mapa:', error);
      setError('Error al cargar los datos del mapa. Por favor, intenta de nuevo.');
      
      // Fallback a datos de ejemplo si falla la API
      const fallbackPoints: MapPoint[] = [
        {
          id: 'fallback-1',
          name: 'Calle Jerusalén - Centro',
          type: 'place',
          coordinates: [10.02280446907578, -84.07857158309207],
          description: 'Calle principal de San Rafael, Heredia',
          address: 'Calle Jerusalén, San Rafael'
        },
        {
          id: 'fallback-2',
          name: 'Calle Jerusalén - Entrada',
          type: 'place',
          coordinates: [10.0229, -84.0786],
          description: 'Entrada principal a la comunidad',
          address: 'Calle Jerusalén, San Rafael'
        }
      ];
      setAllPoints(fallbackPoints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [user]); // Recargar cuando cambie el usuario para mostrar/ocultar cámaras

  // Efecto para inicializar el estado del mapa cuando se carga la página
  useEffect(() => {
    console.log('Mapa page mounted, initializing...');
    // Asegurar que el estado inicial esté correcto
    setMapReady(false);
    setMap(null);
    setMapComponent(null);
    
    // Verificar si Google Maps ya está disponible
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps already available');
        setMapReady(true);
      } else {
        console.log('⏳ Google Maps not yet available, waiting...');
        // Reintentar después de un breve delay
        setTimeout(checkGoogleMaps, 500);
      }
    };
    
    checkGoogleMaps();
  }, []);

  // Efecto para debuggear el estado del mapa
  useEffect(() => {
    console.log('Map state changed:', { map: !!map, mapComponent: !!mapComponent, mapReady });
  }, [map, mapComponent, mapReady]);

  useEffect(() => {
    let filtered = allPoints;

    // Los visitantes solo pueden ver lugares y servicios
    if (!user) {
      filtered = filtered.filter(point => point.type === 'place' || point.type === 'service');
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(point =>
        point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPoints(filtered);
  }, [allPoints, searchTerm, user]);


  const getTypeStats = () => {
    const stats = {
      places: allPoints.filter(p => p.type === 'place').length,
      services: allPoints.filter(p => p.type === 'service').length,
      cameras: 0,
      alerts: 0,
    };

    // Solo mostrar cámaras y alertas a usuarios autenticados
    if (user) {
      stats.cameras = allPoints.filter(p => p.type === 'camera').length;
      stats.alerts = allPoints.filter(p => p.type === 'alert').length;
    }

    return stats;
  };

  const stats = getTypeStats();

  // El mapa es accesible para todos los visitantes

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mapa Interactivo
              </h1>
              <p className="text-gray-600">
                {user 
                  ? 'Explora lugares, servicios, cámaras de seguridad y alertas en la comunidad'
                  : 'Explora lugares y servicios disponibles en Calle Jerusalén, San Rafael'
                }
              </p>
            </div>
            
            {/* Quick actions */}
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (map) {
                    map.setCenter({ lat: 10.02280446907578, lng: -84.07857158309207 });
                    map.setZoom(20);
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>Centrar en Calle Jerusalén</span>
              </button>
              
              <button
                onClick={() => {
                  if (map && filteredPoints.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    filteredPoints.forEach(point => {
                      bounds.extend({ lat: point.coordinates[0], lng: point.coordinates[1] });
                    });
                    map.fitBounds(bounds);
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Todo</span>
              </button>

              {/* Botón de prueba para Street View */}
              <button
                onClick={() => {
                  console.log('Test Street View button clicked');
                  console.log('Map state:', { map: !!map, mapComponent: !!mapComponent, mapReady });
                  activateStreetView(10.02280446907578, -84.07857158309207, 'Test Location');
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                  mapReady 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                disabled={!mapReady}
                title={mapReady ? 'Probar Street View' : 'Esperando que el mapa se cargue...'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z"/>
                </svg>
                <span>{mapReady ? 'Test Street View' : 'Cargando...'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid gap-4 mb-8 ${user ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Lugares</p>
                <p className="text-xl font-bold text-blue-600">{stats.places}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Servicios</p>
                <p className="text-xl font-bold text-green-600">{stats.services}</p>
              </div>
            </div>
          </div>

          {user && (
            <>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Cámaras</p>
                    <p className="text-xl font-bold text-purple-600">{stats.cameras}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Alertas</p>
                    <p className="text-xl font-bold text-red-600">{stats.alerts}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar lugares y servicios
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Escribe el nombre de un lugar o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          {/* Results summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-primary-600">{filteredPoints.length}</span> de <span className="font-semibold">{allPoints.length}</span> puntos en el mapa
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Datos en tiempo real</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={fetchRealData}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Cargando datos del mapa...</p>
                <p className="text-sm text-gray-500 mt-1">Obteniendo lugares desde la base de datos</p>
              </div>
            </div>
          ) : (
            <>
              <ImprovedMapComponent
                points={filteredPoints}
                center={[10.02280446907578, -84.07857158309207]}
                zoom={20}
                height="600px"
                showControls={true}
                onMapLoad={(mapInstance) => {
                  console.log('=== MAP LOADED CALLBACK ===');
                  console.log('mapInstance:', mapInstance);
                  
                  if (mapInstance && mapInstance.showStreetView) {
                    console.log('✅ showStreetView method is available');
                  } else {
                    console.log('❌ showStreetView method is NOT available');
                  }
                  
                  // Actualizar estado de manera síncrona
                  setMap(mapInstance);
                  setMapComponent(mapInstance);
                  
                  // Marcar como listo inmediatamente
                  setMapReady(true);
                  console.log('✅ Map state updated and ready');
                }}
              />
              {/* Contenedor oculto para Street View independiente */}
              <div className="street-view-container" style={{ display: 'none', position: 'absolute', top: '-1000px' }}></div>
            </>
          )}
        </div>

        {/* Points List */}
        {filteredPoints.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Puntos en el Mapa ({filteredPoints.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoints.map(point => (
                <div key={point.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Imagen del punto */}
                  <div className="h-36 bg-gray-100">
                    {point.image ? (
                      <img
                        src={point.image}
                        alt={point.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{point.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      point.type === 'place' ? 'bg-blue-100 text-blue-800' :
                      point.type === 'service' ? 'bg-green-100 text-green-800' :
                      point.type === 'camera' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {point.type === 'place' ? 'Lugar' :
                       point.type === 'service' ? 'Servicio' :
                       point.type === 'camera' ? 'Cámara' : 'Alerta'}
                    </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {point.description}
                    </p>
                    
                    {point.address && (
                      <p className="text-xs text-gray-500 mb-1">
                        📍 {point.address}
                      </p>
                    )}
                    
                    {point.phone && (
                      <p className="text-xs text-gray-500 mb-1">
                        📞 {point.phone}
                      </p>
                    )}
                    
                    {point.status && (
                      <p className="text-xs text-gray-500">
                        Estado: {point.status === 'online' ? 'En línea' : 
                                 point.status === 'offline' ? 'Desconectado' : 'Mantenimiento'}
                      </p>
                    )}
                    {/* Action: Street View */}
                    <div className="mt-3">
                      <button
                        onClick={() => activateStreetView(point.coordinates[0], point.coordinates[1], point.name)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title="Ver en Street View"
                        disabled={!mapReady}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1.5">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z"/>
                        </svg>
                        {mapReady ? 'Street View' : 'Cargando...'}
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
  );
};

export default MapPage;
