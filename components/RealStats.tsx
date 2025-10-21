'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const DEFAULT_STATS: StatsData = {
  totalUsers: 5,
  totalPlaces: 5,
  activeCameras: 0,
  isMonitoring: false,
};

const RealStats: React.FC<RealStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<StatsData>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const containerClasses = useMemo(
    () => ['grid md:grid-cols-2 lg:grid-cols-4 gap-8', className].filter(Boolean).join(' '),
    [className],
  );

  const fetchRealStats = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/public-stats', { cache: 'no-store' });

      if (!response.ok) {
        console.warn('[RealStats] Respuesta no valida al obtener estadisticas publicas:', response.status);
        setStats(DEFAULT_STATS);
        return;
      }

      const data = await response.json();
      const totalUsers = Number(data?.users?.total ?? DEFAULT_STATS.totalUsers);
      const totalPlaces = Number(data?.places?.total ?? DEFAULT_STATS.totalPlaces);
      const activeCameras = Number(data?.security?.cameras ?? DEFAULT_STATS.activeCameras);
      const monitoringValue = data?.security?.monitoring;
      const isMonitoring = typeof monitoringValue === 'boolean' ? monitoringValue : activeCameras > 0;

      setStats({
        totalUsers,
        totalPlaces,
        activeCameras,
        isMonitoring,
      });
    } catch (error) {
      console.error('[RealStats] Error al obtener estadisticas publicas:', error);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealStats();
  }, [fetchRealStats]);

  if (loading) {
    return (
      <div className={containerClasses}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="text-center group">
            <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-pulse bg-white bg-opacity-30 rounded w-8 h-8" />
              </div>
              <div className="animate-pulse bg-white bg-opacity-20 rounded h-8 w-16 mx-auto mb-2" />
              <div className="animate-pulse bg-white bg-opacity-10 rounded h-4 w-24 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.totalUsers > 0 ? stats.totalUsers : 0}</div>
          <div className="text-white font-medium opacity-90">Miembros Registrados</div>
          <div className="text-white text-sm mt-2 opacity-70">Comunidad activa</div>
        </div>
      </div>

      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.totalPlaces > 0 ? stats.totalPlaces : 0}</div>
          <div className="text-white font-medium opacity-90">Lugares Registrados</div>
          <div className="text-white text-sm mt-2 opacity-70">Miradores, pulperias y mas</div>
        </div>
      </div>

      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.activeCameras > 0 ? stats.activeCameras : 0}</div>
          <div className="text-white font-medium opacity-90">Camaras de Seguridad</div>
          <div className="text-white text-sm mt-2 opacity-70">Proteccion comunitaria</div>
        </div>
      </div>

      <div className="text-center group">
        <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm border border-white border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.isMonitoring ? '24/7' : 'N/A'}</div>
          <div className="text-white font-medium opacity-90">Monitoreo</div>
          <div className="text-white text-sm mt-2 opacity-70">Seguridad constante</div>
        </div>
      </div>
    </div>
  );
};

export default RealStats;
