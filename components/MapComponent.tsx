'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Camera, AlertTriangle, Eye } from 'lucide-react';
import L from '@/lib/leaflet';

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
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
  center = [19.4326, -99.1332], // Ciudad de México por defecto
  zoom = 15,
  height = '400px',
  showControls = true
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <div className="relative">
      <div style={{ height }} className="rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      
      {showControls && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 z-10">
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Lugares</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span>Servicios</span>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-green-600" />
              <span>Cámaras (En línea)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-red-600" />
              <span>Cámaras (Desconectadas)</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Alertas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
