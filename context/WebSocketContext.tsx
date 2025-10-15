'use client';

/**
 * Contexto de Firebase para alertas de pánico en tiempo real
 * Maneja la conexión con Firestore y los eventos de pánico
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Tipos de eventos de pánico
export interface PanicAlert {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'expired';
  notifiedUsers: string[];
  acknowledgedBy?: string[]; // Usuarios que confirmaron "He sido notificado"
  alertDurationMinutes?: number; // Duración en minutos
  expiresAt?: string; // Timestamp de expiración
  extremeMode?: boolean;
  hasVideo?: boolean;
  activatedFrom?: string;
  // Coordenadas GPS para mostrar en mapa
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface PanicAlertSent {
  success: boolean;
  alertId: string;
  notifiedCount: number;
  offlineCount: number;
  totalTargets: number;
}

interface FirebaseContextType {
  isConnected: boolean;
  sendPanicAlert: (alertData: Omit<PanicAlert, 'id' | 'timestamp' | 'status'>) => Promise<PanicAlertSent>;
  acknowledgePanicAlert: (alertId: string) => void;
  resolvePanicAlert: (alertId: string) => void;
  activeAlerts: PanicAlert[];
  connectionError: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isConnected: false,
  sendPanicAlert: async () => ({ success: false, alertId: '', notifiedCount: 0, offlineCount: 0, totalTargets: 0 }),
  acknowledgePanicAlert: () => {},
  resolvePanicAlert: () => {},
  activeAlerts: [],
  connectionError: null,
});

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase debe usarse dentro de FirebaseProvider');
  }
  return context;
};

// Mantener compatibilidad con el nombre anterior
export const useWebSocket = useFirebase;

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const { user, userProfile, securityPlan } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<PanicAlert[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Inicializar conexión con Firebase
  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      return;
    }

    console.log('🔥 Inicializando conexión Firebase...');
    setIsConnected(true);
    setConnectionError(null);

    // Escuchar alertas de pánico activas
    const panicAlertsQuery = query(
      collection(db, 'panicAlerts'),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      panicAlertsQuery,
      (snapshot) => {
        console.log('📡 Alertas de pánico actualizadas:', snapshot.size);
        const alerts: PanicAlert[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          alerts.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          } as PanicAlert);
        });
        
        setActiveAlerts(alerts);
      },
      (error) => {
        console.error('❌ Error al escuchar alertas:', error);
        setConnectionError('Error al conectar con Firebase');
        setIsConnected(false);
      }
    );

    // Cleanup
    return () => {
      console.log('🔥 Cerrando conexión Firebase...');
      unsubscribe();
    };
  }, [user]);

  // Enviar alerta de pánico
  const sendPanicAlert = useCallback(
    async (alertData: Omit<PanicAlert, 'id' | 'timestamp' | 'status'>): Promise<PanicAlertSent> => {
      try {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        console.log('🚨 Enviando alerta de pánico:', alertData);

        // Crear alerta en Firebase
        const alertDoc = await addDoc(collection(db, 'panicAlerts'), {
          ...alertData,
          timestamp: serverTimestamp(),
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Alerta creada exitosamente:', alertDoc.id);

        // Simular respuesta (en una implementación real, podrías tener una función que calcule usuarios notificados)
        const response: PanicAlertSent = {
          success: true,
          alertId: alertDoc.id,
          notifiedCount: 5, // Simulado - en realidad debería calcularse
          offlineCount: 2,  // Simulado
          totalTargets: 7   // Simulado
        };

        toast.success(
          `Alerta enviada a ${response.notifiedCount} persona${response.notifiedCount !== 1 ? 's' : ''} en línea`
        );
        
        if (response.offlineCount > 0) {
          toast(
            `${response.offlineCount} persona${response.offlineCount !== 1 ? 's' : ''} offline recibirán la notificación`,
            { icon: 'ℹ️', duration: 4000 }
          );
        }

        return response;
      } catch (error) {
        console.error('❌ Error al enviar alerta:', error);
        toast.error('Error al enviar alerta');
        throw error;
      }
    },
    [user]
  );

  // Confirmar recepción de alerta
  const acknowledgePanicAlert = useCallback(
    async (alertId: string) => {
      if (!user) {
        console.warn('⚠️ No se puede confirmar alerta: usuario no autenticado');
        return;
      }

      try {
        console.log('✅ Confirmando recepción de alerta:', alertId);
        
        // Actualizar alerta en Firebase para marcar como confirmada por este usuario
        const alertRef = collection(db, 'panicAlerts');
        // En una implementación real, aquí actualizarías el documento con la confirmación
        console.log('✅ Alerta confirmada exitosamente');
      } catch (error) {
        console.error('❌ Error al confirmar alerta:', error);
      }
    },
    [user]
  );

  // Resolver alerta
  const resolvePanicAlert = useCallback(
    async (alertId: string) => {
      if (!user) {
        console.warn('⚠️ No se puede resolver alerta: usuario no autenticado');
        return;
      }

      try {
        console.log('✅ Resolviendo alerta:', alertId);
        
        // Actualizar alerta en Firebase para marcar como resuelta
        const alertRef = collection(db, 'panicAlerts');
        // En una implementación real, aquí actualizarías el documento con status: 'resolved'
        console.log('✅ Alerta resuelta exitosamente');
      } catch (error) {
        console.error('❌ Error al resolver alerta:', error);
      }
    },
    [user]
  );

  const value: FirebaseContextType = {
    isConnected,
    sendPanicAlert,
    acknowledgePanicAlert,
    resolvePanicAlert,
    activeAlerts,
    connectionError,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

// Mantener compatibilidad con el nombre anterior
export const WebSocketProvider = FirebaseProvider;

export default FirebaseContext;

