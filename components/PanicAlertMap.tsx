'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

interface PanicAlertMapProps {
  latitude?: number;
  longitude?: number;
  location?: string;
  userName?: string;
  className?: string;
}

export default function PanicAlertMap({ 
  latitude, 
  longitude, 
  location, 
  userName = 'Usuario',
  className = ''
}: PanicAlertMapProps) {
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Verificar si tenemos coordenadas GPS válidas
  const hasValidCoordinates = latitude && longitude && 
    latitude >= -90 && latitude <= 90 && 
    longitude >= -180 && longitude <= 180;

  // URL para Google Maps
  const googleMapsUrl = hasValidCoordinates 
    ? `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=16`
    : location 
      ? `https://www.google.com/maps/search/${encodeURIComponent(location)}`
      : null;

  // URL para OpenStreetMap (fallback)
  const openStreetMapUrl = hasValidCoordinates
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`
    : null;

  // URL para navegación GPS
  const navigationUrl = hasValidCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : null;

  useEffect(() => {
    if (hasValidCoordinates) {
      setMapLoading(true);
      
      // Timeout para mostrar fallback si el mapa no carga en 5 segundos
      const timeout = setTimeout(() => {
        if (mapLoading) {
          console.log('⏰ Timeout: Mapa no cargó en 5 segundos, mostrando fallback');
          setMapLoading(false);
          setMapError(true);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [hasValidCoordinates, mapLoading]);

  if (!hasValidCoordinates && !location) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center text-gray-500">
          <MapPin className="w-5 h-5 mr-2" />
          <span>Ubicación no disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header del mapa */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          <span className="font-semibold">📍 Ubicación de {userName}</span>
        </div>
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-white hover:text-blue-200 transition-colors"
            title="Abrir en Google Maps"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            <span className="text-sm">Abrir</span>
          </a>
        )}
      </div>

      {/* Contenido del mapa */}
      <div className="relative">
        {hasValidCoordinates ? (
          <>
            {/* Mapa embebido usando Google Maps */}
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
              {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=es&z=16&output=embed`}
                className="w-full h-64 border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => {
                  setMapLoading(false);
                  console.log('🗺️ Google Maps cargado correctamente');
                }}
                onError={(e) => {
                  console.error('❌ Error al cargar Google Maps:', e);
                  setMapError(true);
                  setMapLoading(false);
                }}
                title={`Ubicación de ${userName}`}
              />
              
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 z-20">
                  <div className="text-center p-6">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <p className="text-gray-700 font-medium mb-4">Ubicación disponible en Google Maps</p>
                    <button 
                      onClick={() => window.open(googleMapsUrl || undefined, '_blank')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center mx-auto"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir en Google Maps
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Información de coordenadas */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Latitud:</span>
                  <span className="ml-2 font-mono text-gray-900">{latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Longitud:</span>
                  <span className="ml-2 font-mono text-gray-900">{longitude.toFixed(6)}</span>
                </div>
              </div>
              
              {location && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600 text-sm">Ubicación textual:</span>
                  <p className="text-sm text-gray-900 mt-1">{location}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Fallback para ubicación textual solamente */
          <div className="p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-3">Ubicación disponible:</p>
            <p className="font-medium text-gray-900 mb-4">{location}</p>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buscar en Google Maps
              </a>
            )}
          </div>
        )}

        {/* Botones de acción */}
        {hasValidCoordinates && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {navigationUrl && (
                <a
                  href={navigationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Cómo llegar
                </a>
              )}
              
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </a>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 <strong>Tip:</strong> Usa "Cómo llegar" para obtener direcciones paso a paso desde tu ubicación actual
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
