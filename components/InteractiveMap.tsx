'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Eye, Navigation, ExternalLink } from 'lucide-react';

interface Place {
  id: string;
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
}

interface InteractiveMapProps {
  places: Place[];
  selectedPlace?: Place | null;
  onPlaceSelect?: (place: Place) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  places, 
  selectedPlace, 
  onPlaceSelect 
}) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isStreetView, setIsStreetView] = useState(true);

  // Cargar Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa con Street View
  useEffect(() => {
    if (!isGoogleMapsLoaded) return;

    const mapElement = document.getElementById('interactive-map');
    if (!mapElement) return;

    // Crear el mapa
    const mapInstance = new google.maps.Map(mapElement, {
      center: { lat: 10.02424263, lng: -84.07890636 }, // Centro específico de C. Jerusalén
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Crear Street View
    const streetViewService = new google.maps.StreetViewService();
    const panorama = new google.maps.StreetViewPanorama(mapElement, {
      position: { lat: 10.02424263, lng: -84.07890636 },
      pov: {
        heading: 134.85494773, // Dirección específica de la vista
        pitch: 0 // Inclinación horizontal (0 = nivel de la calle)
      },
      zoom: 1,
      visible: true,
      addressControl: true,
      linksControl: true,
      panControl: true,
      enableCloseButton: true,
      showRoadLabels: true
    });

    // Verificar si hay Street View disponible en esta ubicación
    streetViewService.getPanorama({
      location: { lat: 10.02424263, lng: -84.07890636 },
      radius: 50
    }, (data, status) => {
      if (status === 'OK') {
        // Si hay Street View disponible, mostrarlo por defecto
        mapInstance.setStreetView(panorama);
        setIsStreetView(true);
      } else {
        // Si no hay Street View, mostrar mapa normal
        console.log('Street View no disponible en esta ubicación');
        setIsStreetView(false);
      }
    });

    setMap(mapInstance);
  }, [isGoogleMapsLoaded]);

  // Crear marcadores
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded) return;

    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = places.map(place => {
      const marker = new google.maps.Marker({
        position: place.coordinates,
        map: map,
        title: place.name,
        icon: {
          url: getMarkerIcon(place.category),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-4 max-w-xs">
            <h3 class="font-semibold text-lg mb-2">${place.name}</h3>
            <p class="text-gray-600 text-sm mb-3">${place.description}</p>
            <div class="flex items-center space-x-2 text-sm text-gray-500 mb-3">
              <span>⭐ ${place.rating}</span>
              <span>•</span>
              <span>${place.hours}</span>
            </div>
            <div class="flex space-x-2">
              <button onclick="window.openStreetView('${place.coordinates.lat}', '${place.coordinates.lng}')" 
                      class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                Ver en Street View
              </button>
              <button onclick="window.getDirections('${place.coordinates.lat}', '${place.coordinates.lng}')" 
                      class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">
                Cómo llegar
              </button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Funciones globales para los botones
    (window as any).openStreetView = (lat: string, lng: string) => {
      const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
      window.open(streetViewUrl, '_blank');
    };

    (window as any).getDirections = (lat: string, lng: string) => {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(directionsUrl, '_blank');
    };
  }, [map, places, isGoogleMapsLoaded, onPlaceSelect]);

  // Manejar lugar seleccionado
  useEffect(() => {
    if (!map || !selectedPlace || !isGoogleMapsLoaded) return;

    const { lat, lng } = selectedPlace.coordinates;
    
    // Centrar el mapa en el lugar seleccionado
    map.setCenter({ lat, lng });
    map.setZoom(18);

    // Crear Street View para el lugar seleccionado
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({
      location: { lat, lng },
      radius: 50
    }, (data, status) => {
      if (status === 'OK' && data) {
        // Crear nuevo panorama para el lugar seleccionado
        const panorama = new google.maps.StreetViewPanorama(document.getElementById('interactive-map')!, {
          position: { lat, lng },
          pov: {
            heading: 0, // Dirección por defecto
            pitch: 0 // Nivel de la calle
          },
          zoom: 1,
          visible: true,
          addressControl: true,
          linksControl: true,
          panControl: true,
          enableCloseButton: true,
          showRoadLabels: true
        });

        // Establecer Street View en el mapa
        map.setStreetView(panorama);
        setIsStreetView(true);
      } else {
        // Si no hay Street View disponible, ocultar Street View y mostrar mapa normal
        const streetView = map.getStreetView();
        if (streetView) {
          streetView.setVisible(false);
          setIsStreetView(false);
        }
        // Centrar en el lugar sin Street View
        map.setCenter({ lat, lng });
        map.setZoom(18);
      }
    });
  }, [selectedPlace, map, isGoogleMapsLoaded]);

  const getMarkerIcon = (category: string) => {
    const colors: { [key: string]: string } = {
      miradores: '#3B82F6', // Azul
      pulperias: '#10B981', // Verde
      parques: '#059669', // Verde oscuro
      cultura: '#8B5CF6', // Púrpura
      naturaleza: '#16A34A', // Verde
      historia: '#DC2626' // Rojo
    };
    
    const color = colors[category] || '#6B7280';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M16 8 L20 16 L16 24 L12 16 Z" fill="white"/>
      </svg>
    `)}`;
  };

  if (!isGoogleMapsLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa interactivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Mapa Interactivo</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (map) {
                const streetView = map.getStreetView();
                if (streetView) {
                  streetView.setVisible(true);
                  setIsStreetView(true);
                }
              }
            }}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
              isStreetView 
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Street View</span>
          </button>
          <button
            onClick={() => {
              if (map) {
                const streetView = map.getStreetView();
                if (streetView) {
                  streetView.setVisible(false);
                  setIsStreetView(false);
                }
                map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
              }
            }}
            className="flex items-center space-x-1 px-3 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Satélite</span>
          </button>
          <button
            onClick={() => {
              if (map) {
                const streetView = map.getStreetView();
                if (streetView) {
                  streetView.setVisible(false);
                  setIsStreetView(false);
                }
                map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
              }
            }}
            className="flex items-center space-x-1 px-3 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            <span>Mapa</span>
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div id="interactive-map" className="w-full h-96 rounded-lg border border-gray-200"></div>
        <style jsx>{`
          #interactive-map .gm-style-cc {
            display: none !important;
          }
          #interactive-map .gm-style .gm-style-iw-c {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            border-radius: 8px !important;
          }
          #interactive-map .gm-style .gm-style-iw-tc {
            display: none !important;
          }
          #interactive-map .gm-style .gm-style-iw-d {
            overflow: hidden !important;
            border-radius: 8px !important;
          }
          /* Mejorar visibilidad de controles nativos de Google Maps */
          #interactive-map .gm-control-active {
            background-color: #fff !important;
            border: 1px solid #ccc !important;
            color: #333 !important;
            font-weight: 500 !important;
          }
          #interactive-map .gm-control {
            background-color: #fff !important;
            border: 1px solid #ddd !important;
            color: #333 !important;
            font-weight: 500 !important;
          }
          #interactive-map .gm-control:hover {
            background-color: #f5f5f5 !important;
            border-color: #999 !important;
          }
          /* Mejorar controles de tipo de mapa */
          #interactive-map .gm-style .gm-control-wrapper {
            background-color: rgba(255, 255, 255, 0.95) !important;
            border-radius: 4px !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
          }
          #interactive-map .gm-style .gm-control-wrapper .gm-control {
            color: #333 !important;
            font-weight: 500 !important;
            text-shadow: none !important;
          }
        `}</style>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Miradores</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Pulperías</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
          <span>Parques</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Cultura</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-lime-600 rounded-full"></div>
          <span>Naturaleza</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span>Históricos</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
