import { useMemo } from 'react';

interface UseStreamUrlOptions {
  originalUrl: string;
  useProxy?: boolean;
}

export const useStreamUrl = ({ originalUrl, useProxy = true }: UseStreamUrlOptions) => {
  return useMemo(() => {
    if (!originalUrl) return '';

    // Si no usar proxy o ya es HTTPS, devolver URL original
    if (!useProxy || originalUrl.startsWith('https://')) {
      return originalUrl;
    }

    // Si es HTTP, usar el proxy
    if (originalUrl.startsWith('http://')) {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `/api/stream-proxy?url=${encodedUrl}`;
    }

    return originalUrl;
  }, [originalUrl, useProxy]);
};

// Hook para detectar si estamos en producción
export const useIsProduction = () => {
  return useMemo(() => {
    return process.env.NODE_ENV === 'production' || 
           process.env.VERCEL === '1' ||
           (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
  }, []);
};

// Hook combinado que automáticamente usa proxy en producción
export const useProductionStreamUrl = (originalUrl: string) => {
  const isProduction = useIsProduction();
  
  return useStreamUrl({
    originalUrl,
    useProxy: isProduction
  });
};
