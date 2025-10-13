'use client';

import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation, Copy, CheckCircle } from 'lucide-react';

interface EmergencyLocationMapProps {
  latitude?: number;
  longitude?: number;
  location?: string;
  userName?: string;
  className?: string;
}

export default function EmergencyLocationMap({ 
  latitude, 
  longitude, 
  location, 
  userName = 'Usuario',
  className = ''
}: EmergencyLocationMapProps) {
  const [copied, setCopied] = useState(false);

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

  // URL para navegación GPS
  const navigationUrl = hasValidCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : null;

  // Copiar coordenadas al portapapeles
  const copyCoordinates = async () => {
    if (hasValidCoordinates) {
      try {
        await navigator.clipboard.writeText(`${latitude}, ${longitude}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error al copiar coordenadas:', error);
      }
    }
  };

  return (
    <div className={`bg-white border-2 border-red-500 rounded-lg overflow-hidden ${className}`}>
      {/* Header de emergencia */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="w-6 h-6 mr-2 animate-pulse" />
          <span className="font-bold text-lg">🚨 UBICACIÓN DE EMERGENCIA</span>
        </div>
        <div className="text-red-100 text-sm font-semibold">
          {userName}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6 space-y-4">
        {/* Mapa embebido */}
        {hasValidCoordinates && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center text-sm">
              <MapPin className="w-4 h-4 text-red-600 mr-2" />
              🗺️ Mapa de Ubicación
            </h3>
            <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=es&z=16&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación de ${userName}`}
                onLoad={() => {
                  console.log('🗺️ Mapa embebido cargado correctamente');
                }}
                onError={() => {
                  console.log('⚠️ Google Maps Embed falló, usando fallback');
                }}
              />
              <div className="absolute top-2 right-2">
                <a
                  href={googleMapsUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  Abrir
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Información de ubicación */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center">
            <MapPin className="w-5 h-5 text-red-600 mr-2" />
            📍 Ubicación Actual
          </h3>
          
          {hasValidCoordinates ? (
            <div className="space-y-3">
              {/* Coordenadas GPS */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Coordenadas GPS:</span>
                  <button
                    onClick={copyCoordinates}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Latitud:</span>
                    <span className="ml-2 font-mono text-gray-900 font-semibold">{latitude?.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Longitud:</span>
                    <span className="ml-2 font-mono text-gray-900 font-semibold">{longitude?.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Ubicación textual si está disponible */}
              {location && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Descripción:</span>
                  <p className="text-gray-900 mt-1">{location}</p>
                </div>
              )}
            </div>
          ) : (
            /* Fallback para ubicación textual */
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-gray-900 font-medium">{location || 'Ubicación no especificada'}</p>
            </div>
          )}
        </div>

        {/* Botones de acción más pequeños */}
        <div className="grid grid-cols-2 gap-2">
          {navigationUrl && (
            <a
              href={navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Navigation className="w-4 h-4 mr-1" />
              CÓMO LLEGAR
            </a>
          )}
          
          {googleMapsUrl && (
            <a
              href={googleMapsUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              VER EN GOOGLE MAPS
            </a>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 text-center font-medium">
            💡 <strong>Consejo:</strong> Usa "CÓMO LLEGAR" para obtener direcciones paso a paso desde tu ubicación actual
          </p>
        </div>

        {/* Estado de precisión */}
        {hasValidCoordinates && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-semibold">
                ✅ Ubicación GPS precisa disponible
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
