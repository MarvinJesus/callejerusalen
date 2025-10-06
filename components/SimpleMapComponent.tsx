'use client';

import React from 'react';
import { MapPin, ExternalLink, AlertTriangle } from 'lucide-react';

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

interface SimpleMapComponentProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
}

const SimpleMapComponent: React.FC<SimpleMapComponentProps> = ({
  points = [],
  center = [10.02424263, -84.07890636], // Calle Jerusalén, Heredia, Costa Rica por defecto
  zoom = 15,
  height = '400px',
  showControls = true
}) => {
  // Validar coordenadas
  const isValidCoordinate = (coord: number) => {
    return !isNaN(coord) && isFinite(coord) && coord !== 0;
  };

  const validCenter = isValidCoordinate(center[0]) && isValidCoordinate(center[1]) 
    ? center 
    : [10.02424263, -84.07890636];


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
        return <MapPin className={`w-5 h-5 ${color}`} />;
      case 'alert':
        return <AlertTriangle className={`w-5 h-5 ${color}`} />;
      default:
        return <MapPin className={`w-5 h-5 ${color}`} />;
    }
  };

  // Calcular el bbox basado en el nivel de zoom para que sea coherente
  // Valores aproximados de delta según zoom level
  const getDeltaForZoom = (zoomLevel: number): number => {
    // A mayor zoom, menor delta (área más pequeña)
    return 0.02 / Math.pow(2, zoomLevel - 14);
  };

  const delta = getDeltaForZoom(zoom);

  return (
    <div className="relative" style={{ height: '100%' }}>
      <div style={{ height: '100%' }} className="rounded-lg overflow-hidden border border-gray-200">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${validCenter[1] - delta},${validCenter[0] - delta},${validCenter[1] + delta},${validCenter[0] + delta}&layer=mapnik&marker=${validCenter[0]},${validCenter[1]}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de OpenStreetMap - Área Segura de Reunión"
        />
        <div className="absolute top-2 right-2">
          <a
            href={`https://www.openstreetmap.org/?mlat=${validCenter[0]}&mlon=${validCenter[1]}&zoom=${zoom}&layers=M`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white bg-opacity-90 hover:bg-opacity-100 px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 transition-all shadow-sm"
          >
            <ExternalLink className="w-3 h-3" />
            Ver mapa completo
          </a>
        </div>
      </div>
      
    </div>
  );
};

export default SimpleMapComponent;
