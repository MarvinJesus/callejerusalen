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
      
      // Obtener estadísticas de usuarios
      const usersResponse = await fetch('/api/admin/users');
      let totalUsers = 0;
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        totalUsers = usersData.users?.length || 0;
      }

      // Obtener estadísticas de lugares
      const placesResponse = await fetch('/api/places');
      let totalPlaces = 0;
      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        totalPlaces = placesData.places?.length || 0;
      }

      setStats({
        totalUsers,
        totalPlaces,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching real stats:', error);
      setStats({
        totalUsers: 0,
        totalPlaces: 0,
        loading: false,
        error: 'Error al cargar estadísticas'
      });
    }
  };

  return { ...stats, refetch: fetchRealStats };
};
