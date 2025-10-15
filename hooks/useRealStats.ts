'use client';

import { useState, useEffect } from 'react';

interface StatsData {
  totalUsers: number;
  totalPlaces: number;
  loading: boolean;
  error: string | null;
}

export const useRealStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalPlaces: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📊 Obteniendo estadísticas públicas...');
      
      // Obtener estadísticas desde API pública
      const response = await fetch('/api/public-stats');
      let totalUsers = 5; // Valor por defecto
      let totalPlaces = 5; // Valor por defecto
      
      if (response.ok) {
        const data = await response.json();
        totalUsers = data.users?.total || 5;
        totalPlaces = data.places?.total || 5;
        console.log('✅ Estadísticas obtenidas:', { totalUsers, totalPlaces });
      } else {
        console.warn('⚠️ Error en respuesta de estadísticas públicas:', response.status);
      }

      setStats({
        totalUsers,
        totalPlaces,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('❌ Error fetching real stats:', error);
      setStats({
        totalUsers: 5, // Valor por defecto en caso de error
        totalPlaces: 5,
        loading: false,
        error: null // No mostrar error al usuario
      });
    }
  };

  return { ...stats, refetch: fetchRealStats };
};
