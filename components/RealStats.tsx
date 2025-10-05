'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Shield, Eye } from 'lucide-react';

interface RealStatsProps {
  className?: string;
}

interface StatsData {
  totalUsers: number;
  totalPlaces: number;
  activeCameras: number;
  isMonitoring: boolean;
}

const RealStats: React.FC<RealStatsProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalPlaces: 0,
    activeCameras: 12, // Número fijo de cámaras
    isMonitoring: true // Siempre activo
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
        totalPlaces,
        activeCameras: 12,
        isMonitoring: true
      });
    } catch (error) {
      console.error('Error fetching real stats:', error);
      // En caso de error, usar valores por defecto
      setStats({
        totalUsers: 0,
        totalPlaces: 0,
        activeCameras: 12,
        isMonitoring: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center group">
            <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-pulse bg-white bg-opacity-30 rounded w-8 h-8"></div>
              </div>
              <div className="animate-pulse bg-white bg-opacity-20 rounded h-8 w-16 mx-auto mb-2"></div>
              <div className="animate-pulse bg-white bg-opacity-10 rounded h-4 w-24 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 ${className}`}>
      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {stats.totalUsers > 0 ? `${stats.totalUsers}` : '0'}
          </div>
          <div className="text-primary-100 font-medium">Miembros Registrados</div>
          <div className="text-primary-200 text-sm mt-2">Comunidad activa</div>
        </div>
      </div>
      
      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {stats.totalPlaces > 0 ? `${stats.totalPlaces}` : '0'}
          </div>
          <div className="text-primary-100 font-medium">Lugares Registrados</div>
          <div className="text-primary-200 text-sm mt-2">Miradores, pulperías y más</div>
        </div>
      </div>
      
      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.activeCameras}</div>
          <div className="text-primary-100 font-medium">Cámaras de Seguridad</div>
          <div className="text-primary-200 text-sm mt-2">Protección comunitaria</div>
        </div>
      </div>
      
      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">24/7</div>
          <div className="text-primary-100 font-medium">Monitoreo</div>
          <div className="text-primary-200 text-sm mt-2">Seguridad constante</div>
        </div>
      </div>
    </div>
  );
};

export default RealStats;
