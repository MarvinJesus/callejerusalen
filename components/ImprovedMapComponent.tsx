'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Camera, AlertTriangle, Eye, Navigation } from 'lucide-react';

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

interface ImprovedMapComponentProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
  onMapLoad?: (map: any) => void;
}


const ImprovedMapComponent: React.FC<ImprovedMapComponentProps> = ({ 
  points = [],
  center = [10.02280446907578, -84.07857158309207],
  zoom = 20,
  height = '500px',
  showControls = true,
  onMapLoad
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [panorama, setPanorama] = useState<google.maps.StreetViewPanorama | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Cargar Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setMapError('Error al cargar Google Maps');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
       const mapInstance = new google.maps.Map(mapRef.current, {
         center: { lat: center[0], lng: center[1] },
         zoom: zoom,
         mapTypeId: google.maps.MapTypeId.HYBRID,
         styles: [
           {
             featureType: 'poi',
             elementType: 'labels',
             stylers: [{ visibility: 'on' }]
           },
           {
             featureType: 'road',
             elementType: 'labels',
             stylers: [{ visibility: 'on' }]
           },
           {
             featureType: 'administrative',
             elementType: 'labels',
             stylers: [{ visibility: 'on' }]
           }
         ],
         zoomControl: true,
         mapTypeControl: true,
         scaleControl: true,
         streetViewControl: true,
         rotateControl: true,
         fullscreenControl: true
       });

      setMap(mapInstance);
      
      // Crear objeto con métodos adicionales
      const mapWithMethods = {
        ...mapInstance,
        showStreetView: (lat: number, lng: number, heading: number = 0, pitch: number = 0) => {
          console.log('showStreetView called with:', { lat, lng, heading, pitch });
          if (!mapInstance || !window.google) {
            console.log('Map instance or Google Maps not available');
            return;
          }
          const pano = mapInstance.getStreetView();
          console.log('Street View panorama:', pano);
          pano.setPosition({ lat, lng });
          pano.setPov({ heading, pitch });
          pano.setVisible(true);
          setPanorama(pano);
          console.log('Street View activated');
        }
      };
      
      if (onMapLoad) {
        onMapLoad(mapWithMethods);
      }
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      setMapError('Error al inicializar el mapa');
    }
  }, [isLoaded, center, zoom]);


  // Crear marcadores
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    // Crear marcadores para los puntos
    points.forEach(point => {
      const marker = new google.maps.Marker({
        position: { lat: point.coordinates[0], lng: point.coordinates[1] },
        map: map,
        title: point.name,
        icon: getMarkerIcon(point.type, point.status)
      });

      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(point)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Ajustar vista para mostrar todos los marcadores
    if (points.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let validPointsCount = 0;
      
      // Agregar los puntos con validación
      points.forEach(point => {
        const lat = point.coordinates[0];
        const lng = point.coordinates[1];
        
        // Validar que las coordenadas sean números válidos
        if (typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          bounds.extend({ lat, lng });
          validPointsCount++;
        } else {
          console.warn(`Coordenadas inválidas para punto ${point.name}:`, { lat, lng });
        }
      });
      
      // Solo ajustar bounds si hay puntos válidos
      if (validPointsCount > 0) {
        try {
          map.fitBounds(bounds);
        } catch (error) {
          console.error('Error al ajustar bounds del mapa:', error);
          // Fallback: centrar en el primer punto válido
          const firstValidPoint = points.find(point => {
            const lat = point.coordinates[0];
            const lng = point.coordinates[1];
            return typeof lat === 'number' && typeof lng === 'number' && 
                   !isNaN(lat) && !isNaN(lng) && 
                   lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          });
          
          if (firstValidPoint) {
            map.setCenter({ lat: firstValidPoint.coordinates[0], lng: firstValidPoint.coordinates[1] });
            map.setZoom(18);
          }
        }
      } else {
        console.warn('No hay puntos válidos para mostrar en el mapa');
        // Centrar en las coordenadas por defecto
        map.setCenter({ lat: center[0], lng: center[1] });
        map.setZoom(18);
      }
      
      // Mantener zoom mínimo para mejor detalle
      setTimeout(() => {
        try {
          if (map && typeof map.setZoom === 'function') {
            map.setZoom(18);
            map.setCenter({ lat: center[0], lng: center[1] });
          }
        } catch (error) {
          console.warn('Error adjusting map zoom:', error);
        }
      }, 100);
    }
  }, [map, points, center]);

  const getMarkerIcon = (type: MapPoint['type'], status?: string) => {
    const color = (() => {
      switch (type) {
        case 'place':
          return '#3B82F6'; // blue
        case 'service':
          return '#10B981'; // green
        case 'camera':
          return status === 'online' ? '#10B981' : status === 'offline' ? '#EF4444' : '#F59E0B';
        case 'alert':
          return '#EF4444'; // red
        default:
          return '#3B82F6';
      }
    })();

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8
    };
  };

  const createInfoWindowContent = (point: MapPoint) => {
    const icon = (() => {
      switch (point.type) {
        case 'place':
          return '<div class="w-4 h-4 text-blue-600">📍</div>';
        case 'service':
          return '<div class="w-4 h-4 text-green-600">🏪</div>';
        case 'camera':
          return '<div class="w-4 h-4 text-purple-600">📹</div>';
        case 'alert':
          return '<div class="w-4 h-4 text-red-600">⚠️</div>';
        default:
          return '<div class="w-4 h-4 text-blue-600">📍</div>';
      }
    })();

    return `
      <div class="p-3 min-w-[250px] max-w-[300px]">
        ${point.image ? `
          <div class=\"mb-2 h-28 w-full overflow-hidden rounded\">
            <img src=\"${point.image}\" alt=\"${point.name}\" style=\"width:100%;height:100%;object-fit:cover\" />
          </div>
        ` : ''}
        <div class="flex items-center space-x-2 mb-2">
          ${icon}
          <h3 class="font-semibold text-gray-900 text-sm">${point.name}</h3>
        </div>
        
        <p class="text-xs text-gray-600 mb-2">
          ${point.description}
        </p>
        
        ${point.address ? `
          <p class="text-xs text-gray-500 mb-1">
            📍 ${point.address}
          </p>
        ` : ''}
        
        ${point.phone ? `
          <p class="text-xs text-gray-500 mb-1">
            📞 ${point.phone}
          </p>
        ` : ''}
        
        ${point.website ? `
          <p class="text-xs text-gray-500 mb-1">
            🌐 ${point.website}
          </p>
        ` : ''}
        
        ${point.status ? `
          <p class="text-xs text-gray-500">
            Estado: ${point.status === 'online' ? 'En línea' : 
                     point.status === 'offline' ? 'Desconectado' : 'Mantenimiento'}
          </p>
        ` : ''}
      </div>
    `;
  };

  const getTypeStats = () => {
    const stats = {
      places: points.filter(p => p.type === 'place').length,
      services: points.filter(p => p.type === 'service').length,
      cameras: points.filter(p => p.type === 'camera').length,
      alerts: points.filter(p => p.type === 'alert').length,
    };
    return stats;
  };

  const stats = getTypeStats();

  if (mapError) {
    return (
      <div 
        className="bg-red-50 border border-red-200 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-600 font-medium">Error al cargar el mapa</p>
          <p className="text-red-500 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="bg-gray-200 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      
      {showControls && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-48 border border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Leyenda</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700">Lugares ({stats.places})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700">Servicios ({stats.services})</span>
            </div>
            {stats.cameras > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">Cámaras ({stats.cameras})</span>
              </div>
            )}
            {stats.alerts > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">Alertas ({stats.alerts})</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 Haz clic en los marcadores
            </p>
          </div>
        </div>
      )}

      {/* Controles de navegación */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 z-10">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (map) {
                map.setCenter({ lat: center[0], lng: center[1] });
                map.setZoom(zoom);
              }
            }}
            className="p-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            title="Centrar en Calle Jerusalén"
          >
            <Navigation className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              if (map && points.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                points.forEach(point => {
                  bounds.extend({ lat: point.coordinates[0], lng: point.coordinates[1] });
                });
                map.fitBounds(bounds);
              }
            }}
            className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            title="Ver todos los puntos"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedMapComponent;
