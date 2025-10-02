'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Maximize2, Minimize2, RotateCcw, ExternalLink, Globe } from 'lucide-react';

interface GoogleMaps3DProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  title?: string;
  className?: string;
  height?: string;
  zoom?: number;
}

const GoogleMaps3D: React.FC<GoogleMaps3DProps> = ({
  coordinates,
  title = "Vista 3D de Google Maps",
  className = "",
  height = "400px",
  zoom = 18
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para alternar pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Función para recargar el iframe
  const reloadIframe = () => {
    setIsLoading(true);
    setHasError(false);
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  // Función para abrir en Google Earth
  const openInGoogleEarth = () => {
    const earthUrl = `https://earth.google.com/web/@${coordinates.lat},${coordinates.lng},1000a,35y,0h,0t,0r`;
    window.open(earthUrl, '_blank', 'noopener,noreferrer');
  };

  // Función para abrir en Google Maps
  const openInGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},${zoom}a,35y,0h,0t,0r/data=!3m1!1e3`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Manejar eventos de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Manejar carga del iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Generar URL de Google Maps embebido
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgUjQq8J0Y&center=${coordinates.lat},${coordinates.lng}&zoom=${zoom}&maptype=satellite`;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-100 rounded-lg overflow-hidden shadow-lg ${className} ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Header con controles */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-lg">{title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={reloadIframe}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Recargar vista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={openInGoogleMaps}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Abrir en Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <button
              onClick={openInGoogleEarth}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title="Abrir en Google Earth"
            >
              <Globe className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando vista satelital...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error al cargar la vista
            </h3>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la vista satelital. Verifica tu conexión a internet.
            </p>
            <button
              onClick={reloadIframe}
              className="btn-theme-primary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Iframe de Google Maps */}
      <iframe
        src={mapsEmbedUrl}
        title={title}
        className="w-full h-full border-0"
        allow="fullscreen"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        loading="lazy"
      />

      {/* Overlay de instrucciones */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-black/70 text-white p-3 rounded-lg text-sm">
            <p className="text-center">
              💡 Usa el mouse para hacer zoom y explorar la vista satelital
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMaps3D;
