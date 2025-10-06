'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Camera, AlertTriangle, Eye, ExternalLink } from 'lucide-react';
import L from '@/lib/leaflet';

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

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
}

interface MapComponentProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  points = [],
  center = [10.02424263, -84.07890636], // Calle Jerusalén, Heredia, Costa Rica por defecto
  zoom = 15,
  height = '400px',
  showControls = true
}) => {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Verificar si Leaflet se carga correctamente después de un tiempo
    const checkLeafletLoad = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.L) {
        console.warn('Leaflet no se cargó correctamente, usando mapa de fallback');
        setUseFallback(true);
      }
    }, 3000);

    return () => clearTimeout(checkLeafletLoad);
  }, []);

  // Validar coordenadas
  const isValidCoordinate = (coord: number) => {
    return !isNaN(coord) && isFinite(coord) && coord !== 0;
  };

  const validCenter: [number, number] = isValidCoordinate(center[0]) && isValidCoordinate(center[1]) 
    ? center 
    : [10.02424263, -84.07890636];

  // Componente de fallback con mapa embebido
  const FallbackMap = () => (
    <div className="relative">
      <div style={{ height }} className="rounded-lg overflow-hidden border">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${validCenter[1] - 0.01},${validCenter[0] - 0.01},${validCenter[1] + 0.01},${validCenter[0] + 0.01}&layer=mapnik&marker=${validCenter[0]},${validCenter[1]}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de OpenStreetMap"
        />
        <div className="absolute top-2 right-2">
          <a
            href={`https://www.openstreetmap.org/?mlat=${validCenter[0]}&mlon=${validCenter[1]}&zoom=${zoom}&layers=M`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white bg-opacity-90 hover:bg-opacity-100 px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Ver mapa completo
          </a>
        </div>
      </div>
      {points.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Puntos de interés:</p>
          <ul className="mt-1 space-y-1">
            {points.map((point) => (
              <li key={point.id} className="flex items-center gap-2">
                {getMarkerIconComponent(point.type, point.status)}
                <span>{point.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const getMarkerIcon = (type: MapPoint['type'], status?: string) => {
    const color = (() => {
      switch (type) {
        case 'place':
          return 'blue';
        case 'service':
          return 'green';
        case 'camera':
          return status === 'online' ? 'green' : status === 'offline' ? 'red' : 'orange';
        case 'alert':
          return 'red';
        default:
          return 'blue';
      }
    })();

    return {
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41] as [number, number],
      iconAnchor: [12, 41] as [number, number],
      popupAnchor: [1, -34] as [number, number],
      shadowSize: [41, 41] as [number, number]
    };
  };

  const getMarkerIconComponent = (type: MapPoint['type'], status?: string) => {
    const color = (() => {
      switch (type) {
        case 'place':
          return 'text-blue-600';
        case 'service':
          return 'text-green-600';
        case 'camera':
          return status === 'online' ? 'text-green-600' : status === 'offline' ? 'text-red-600' : 'text-orange-600';
        case 'alert':
          return 'text-red-600';
        default:
          return 'text-blue-600';
      }
    })();

    switch (type) {
      case 'place':
        return <MapPin className={`w-5 h-5 ${color}`} />;
      case 'service':
        return <MapPin className={`w-5 h-5 ${color}`} />;
      case 'camera':
        return <Camera className={`w-5 h-5 ${color}`} />;
      case 'alert':
        return <AlertTriangle className={`w-5 h-5 ${color}`} />;
      default:
        return <MapPin className={`w-5 h-5 ${color}`} />;
    }
  };

  if (!isClient) {
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

  if (mapError || useFallback) {
    return <FallbackMap />;
  }

  try {
    return (
      <div className="relative">
        <div style={{ height }} className="rounded-lg overflow-hidden">
          <MapContainer
            center={validCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {points.map((point) => (
              <Marker
                key={point.id}
                position={point.coordinates}
                icon={new L.Icon(getMarkerIcon(point.type, point.status))}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center space-x-2 mb-2">
                      {getMarkerIconComponent(point.type, point.status)}
                      <h3 className="font-semibold text-gray-900">{point.name}</h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
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
                    
                    {point.website && (
                      <p className="text-xs text-gray-500 mb-1">
                        🌐 {point.website}
                      </p>
                    )}
                    
                    {point.status && (
                      <p className="text-xs text-gray-500">
                        Estado: {point.status === 'online' ? 'En línea' : 
                                 point.status === 'offline' ? 'Desconectado' : 'Mantenimiento'}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Panel de leyenda desactivado por solicitud */}
      </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    setMapError('Error al cargar el mapa interactivo');
    setUseFallback(true);
    return <FallbackMap />;
  }
};

export default MapComponent;
