'use client';

/**
 * Contexto de WebSocket para alertas de pánico en tiempo real
 * Maneja la conexión con Socket.io y los eventos de pánico
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
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

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendPanicAlert: (alertData: Omit<PanicAlert, 'id' | 'timestamp' | 'status'>) => Promise<PanicAlertSent>;
  acknowledgePanicAlert: (alertId: string) => void;
  resolvePanicAlert: (alertId: string) => void;
  activeAlerts: PanicAlert[];
  connectionError: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  sendPanicAlert: async () => ({ success: false, alertId: '', notifiedCount: 0, offlineCount: 0, totalTargets: 0 }),
  acknowledgePanicAlert: () => {},
  resolvePanicAlert: () => {},
  activeAlerts: [],
  connectionError: null,
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket debe usarse dentro de WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, userProfile, securityPlan } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<PanicAlert[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Inicializar conexión de Socket.io
  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      return;
    }

    console.log('🔌 Inicializando conexión WebSocket...');
    
    // Crear instancia de socket
    const socketInstance = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
    });

    // Eventos de conexión
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // Registrar usuario en el servidor
      socketInstance.emit('register', {
        userId: user.uid,
        securityPlanId: securityPlan?.id || null,
      });
    });

    socketInstance.on('registered', (data) => {
      console.log('✅ Usuario registrado en WebSocket:', data);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // El servidor desconectó, intentar reconectar manualmente
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionError('No se pudo conectar al servidor de notificaciones en tiempo real');
        toast.error('Error de conexión. Las notificaciones pueden retrasarse.');
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos`);
      toast.success('Conexión restablecida');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión de WebSocket');
      setConnectionError('No se pudo reconectar al servidor');
      toast.error('No se pudo reconectar. Por favor, recarga la página.');
    });

    // Heartbeat para mantener conexión viva
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, 30000); // Cada 30 segundos

    socketInstance.on('pong', () => {
      // Conexión activa
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      console.log('🔌 Cerrando conexión WebSocket...');
      clearInterval(heartbeatInterval);
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.off('reconnect');
      socketInstance.off('reconnect_failed');
      socketInstance.off('registered');
      socketInstance.off('ping');
      socketInstance.off('pong');
      socketInstance.disconnect();
    };
  }, [user, securityPlan]);

  // Enviar alerta de pánico
  const sendPanicAlert = useCallback(
    async (alertData: Omit<PanicAlert, 'id' | 'timestamp' | 'status'>): Promise<PanicAlertSent> => {
      return new Promise((resolve, reject) => {
        if (!socket || !socket.connected) {
          const error = 'No hay conexión con el servidor de notificaciones';
          console.error('❌', error);
          toast.error(error);
          reject(new Error(error));
          return;
        }

        console.log('🚨 Enviando alerta de pánico:', alertData);

        // Enviar evento de alerta
        socket.emit('panic:alert', alertData);

        // Esperar confirmación
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: No se recibió confirmación del servidor'));
        }, 10000);

        socket.once('panic:alert_sent', (response: PanicAlertSent) => {
          clearTimeout(timeout);
          console.log('✅ Alerta enviada exitosamente:', response);
          
          if (response.success) {
            toast.success(
              `Alerta enviada a ${response.notifiedCount} persona${response.notifiedCount !== 1 ? 's' : ''} en línea`
            );
            if (response.offlineCount > 0) {
              toast(
                `${response.offlineCount} persona${response.offlineCount !== 1 ? 's' : ''} offline recibirán la notificación`,
                { icon: 'ℹ️', duration: 4000 }
              );
            }
          }
          
          resolve(response);
        });

        socket.once('panic:error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Error al enviar alerta:', error);
          toast.error(error.message || 'Error al enviar alerta');
          reject(new Error(error.message));
        });
      });
    },
    [socket]
  );

  // Confirmar recepción de alerta
  const acknowledgePanicAlert = useCallback(
    (alertId: string) => {
      if (!socket || !socket.connected || !user) {
        console.warn('⚠️ No se puede confirmar alerta: socket desconectado');
        return;
      }

      console.log('✅ Confirmando recepción de alerta:', alertId);
      socket.emit('panic:acknowledge', {
        alertId,
        userId: user.uid,
      });
    },
    [socket, user]
  );

  // Resolver alerta
  const resolvePanicAlert = useCallback(
    (alertId: string) => {
      if (!socket || !socket.connected || !user) {
        console.warn('⚠️ No se puede resolver alerta: socket desconectado');
        return;
      }

      console.log('✅ Resolviendo alerta:', alertId);
      socket.emit('panic:resolve', {
        alertId,
        resolvedBy: user.uid,
      });
    },
    [socket, user]
  );

  const value: WebSocketContextType = {
    socket,
    isConnected,
    sendPanicAlert,
    acknowledgePanicAlert,
    resolvePanicAlert,
    activeAlerts,
    connectionError,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export default WebSocketContext;

