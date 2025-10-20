'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  accessibleCameras: number;
  connectedResidents: number;
  recentAlerts: number;
  loading: boolean;
  error: string | null;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    accessibleCameras: 0,
    connectedResidents: 0,
    recentAlerts: 0,
    loading: true,
    error: null
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Obtener cámaras accesibles para el usuario
        let accessibleCameras = 0;
        if (user) {
          const userAccessDoc = await getDoc(doc(db, 'cameraAccess', user.uid));
          if (userAccessDoc.exists()) {
            const userAccessData = userAccessDoc.data();
            // Contar las cámaras a las que el usuario tiene acceso
            accessibleCameras = Object.keys(userAccessData).length;
          }
        }

        // Obtener residentes conectados (usuarios con lastSeen reciente)
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // Última hora
        
        const connectedResidents = usersSnapshot.docs.filter(doc => {
          const userData = doc.data();
          const lastSeen = userData.lastSeen?.toDate();
          return lastSeen && lastSeen > oneHourAgo;
        }).length;

        // Obtener alertas recientes (últimas 24 horas)
        const alertsQuery = query(
          collection(db, 'panicAlerts'),
          where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        );
        const alertsSnapshot = await getDocs(alertsQuery);
        const recentAlerts = alertsSnapshot.size;

        setStats({
          accessibleCameras,
          connectedResidents,
          recentAlerts,
          loading: false,
          error: null
        });

        console.log('📊 Estadísticas cargadas:', {
          accessibleCameras,
          connectedResidents,
          recentAlerts
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar estadísticas'
        }));
      }
    };

    fetchStats();

    // Configurar listeners en tiempo real para actualizaciones
    let unsubscribeCameras: (() => void) | undefined;
    if (user) {
      unsubscribeCameras = onSnapshot(
        doc(db, 'cameraAccess', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const userAccessData = snapshot.data();
            const accessibleCameras = Object.keys(userAccessData).length;
            setStats(prev => ({ ...prev, accessibleCameras }));
          } else {
            setStats(prev => ({ ...prev, accessibleCameras: 0 }));
          }
        }
      );
    }

    const unsubscribeAlerts = onSnapshot(
      query(
        collection(db, 'panicAlerts'),
        where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      ),
      (snapshot) => {
        setStats(prev => ({ ...prev, recentAlerts: snapshot.size }));
      }
    );

    // Cleanup listeners
    return () => {
      if (unsubscribeCameras) {
        unsubscribeCameras();
      }
      unsubscribeAlerts();
    };
  }, [user]);

  return stats;
};
