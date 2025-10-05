'use client';

import React, { useState, useEffect } from 'react';

interface HeroStatsProps {
  className?: string;
}

interface StatsData {
  totalUsers: number;
  totalPlaces: number;
}

const HeroStats: React.FC<HeroStatsProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalPlaces: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      setLoading(true);
      
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
        totalPlaces
      });
    } catch (error) {
      console.error('Error fetching real stats:', error);
      setStats({
        totalUsers: 0,
        totalPlaces: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-3 gap-4 mb-8 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="animate-pulse bg-gray-200 rounded h-8 w-16 mx-auto mb-2"></div>
            <div className="animate-pulse bg-gray-200 rounded h-4 w-20 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-4 mb-8 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-600">
          {stats.totalUsers > 0 ? `${stats.totalUsers}` : '0'}
        </div>
        <div className="text-sm text-gray-500">Miembros</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-600">
          {stats.totalPlaces > 0 ? `${stats.totalPlaces}` : '0'}
        </div>
        <div className="text-sm text-gray-500">Lugares</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-600">24/7</div>
        <div className="text-sm text-gray-500">Seguridad</div>
      </div>
    </div>
  );
};

export default HeroStats;
