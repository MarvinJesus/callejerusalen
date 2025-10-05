'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Maximize2, Minimize2, RotateCcw, ExternalLink, MapPin, Navigation } from 'lucide-react';
import GoogleMaps3D from './GoogleMaps3D';

interface GoogleEarthStreamProps {
  url: string;
  title?: string;
  className?: string;
  height?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const GoogleEarthStream: React.FC<GoogleEarthStreamProps> = ({
  url,
  title = "Vista 3D de Google Earth",
  className = "",
  height = "400px",
  coordinates
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(true); // Mostrar fallback por defecto
  const [useGoogleMaps, setUseGoogleMaps] = useState(true); // Usar Google Maps por defecto
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

  // Inicializar con Google Maps por defecto
  useEffect(() => {
    if (coordinates) {
      setIsLoading(false);
      setHasError(false);
    }
  }, [coordinates]);

  // Función para abrir Google Earth en nueva pestaña
  const openInGoogleEarth = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Función para abrir en Google Maps 3D
  const openInGoogleMaps3D = () => {
    if (coordinates) {
      const mapsUrl = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},1000a,35y,0h,0t,0r/data=!3m1!1e3`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      const mapsUrl = `https://www.google.com/maps/search/Calle+Jerusalén,+Heredia,+San+Rafael/@10.02193128,-84.07814492,1000a,35y,0h,0t,0r/data=!3m1!1e3`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Función para mostrar vista alternativa
  const showAlternativeView = () => {
    setShowFallback(true);
    setUseGoogleMaps(true);
    setIsLoading(false);
    setHasError(false);
  };

  // Función para intentar Google Earth
  const tryGoogleEarth = () => {
    setUseGoogleMaps(false);
    setShowFallback(false);
    setIsLoading(true);
    setHasError(false);
  };

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
            <Globe className="w-5 h-5 text-white" />
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
            <p className="text-gray-600">Cargando vista 3D...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Restringido
            </h3>
            <p className="text-gray-600 mb-6">
              Google Earth no permite el embebido directo en esta página. 
              Puedes explorar la vista 3D usando las opciones alternativas.
            </p>
            <div className="space-y-3">
              <button
                onClick={openInGoogleEarth}
                className="w-full btn-theme-primary flex items-center justify-center"
              >
                <Globe className="w-4 h-4 mr-2" />
                Abrir en Google Earth
              </button>
              <button
                onClick={openInGoogleMaps3D}
                className="w-full btn-theme-secondary flex items-center justify-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ver en Google Maps 3D
              </button>
              <button
                onClick={showAlternativeView}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Ver vista satelital alternativa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista principal con Google Maps 3D */}
      {(showFallback || useGoogleMaps) && coordinates && (
        <GoogleMaps3D
          coordinates={coordinates}
          title={title}
          height="100%"
          className="absolute inset-0"
        />
      )}

      {/* Vista alternativa sin coordenadas */}
      {showFallback && !coordinates && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 z-20">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-blue-500 text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Vista 3D de Calle Jerusalén
            </h3>
            <p className="text-gray-600 mb-6">
              Explora la zona en una vista tridimensional interactiva usando las herramientas de Google.
            </p>
            <div className="space-y-3">
              <button
                onClick={openInGoogleEarth}
                className="w-full btn-theme-primary flex items-center justify-center"
              >
                <Globe className="w-4 h-4 mr-2" />
                Abrir en Google Earth
              </button>
              <button
                onClick={openInGoogleMaps3D}
                className="w-full btn-theme-secondary flex items-center justify-center"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Ver en Google Maps 3D
              </button>
              <button
                onClick={tryGoogleEarth}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Intentar Google Earth (puede fallar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe de Google Earth - Solo mostrar cuando se intenta Google Earth */}
      {!useGoogleMaps && !hasError && !showFallback && (
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
          allow="fullscreen; geolocation; microphone; camera"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          loading="lazy"
        />
      )}

      {/* Overlay de instrucciones */}
      {!isLoading && !hasError && useGoogleMaps && (
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

export default GoogleEarthStream;
