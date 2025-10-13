/**
 * Hook personalizado para escuchar notificaciones de pánico en tiempo real
 * 
 * Este hook se suscribe a la colección panicReports de Firestore y notifica
 * al usuario cuando hay nuevas alertas de pánico dirigidas a él.
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export interface PanicNotification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  location: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'resolved';
  emergencyContacts: string[];
  notifiedUsers: string[];
  activatedFrom?: string;
  extremeMode?: boolean;
  hasVideo?: boolean;
}

interface UsePanicNotificationsReturn {
  notifications: PanicNotification[];
  activeNotifications: PanicNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para escuchar notificaciones de pánico en tiempo real
 * @param onNewNotification - Callback que se ejecuta cuando llega una nueva notificación
 */
export const usePanicNotifications = (
  onNewNotification?: (notification: PanicNotification) => void
): UsePanicNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PanicNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Cargar notificaciones leídas del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const stored = localStorage.getItem(`panic_notifications_read_${user.uid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setReadNotifications(new Set(parsed));
        } catch (error) {
          console.error('Error al cargar notificaciones leídas:', error);
        }
      }
    }
  }, [user]);

  // Guardar notificaciones leídas en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user && readNotifications.size > 0) {
      localStorage.setItem(
        `panic_notifications_read_${user.uid}`,
        JSON.stringify(Array.from(readNotifications))
      );
    }
  }, [readNotifications, user]);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    console.log('👂 Iniciando listener de notificaciones de pánico para usuario:', user.uid);

    try {
      // Query para obtener reportes de pánico donde el usuario está en la lista de notificados
      const panicReportsRef = collection(db, 'panicReports');
      const q = query(
        panicReportsRef,
        where('notifiedUsers', 'array-contains', user.uid),
        orderBy('timestamp', 'desc')
      );

      // Suscribirse a cambios en tiempo real
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📨 Cambios detectados en panicReports:', snapshot.size, 'documentos');

          const newNotifications: PanicNotification[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Convertir timestamp a Date
            let timestampDate: Date;
            if (data.timestamp instanceof Timestamp) {
              timestampDate = data.timestamp.toDate();
            } else if (data.timestamp?.toDate) {
              timestampDate = data.timestamp.toDate();
            } else {
              timestampDate = new Date();
            }

            const notification: PanicNotification = {
              id: doc.id,
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail,
              location: data.location,
              description: data.description,
              timestamp: timestampDate,
              status: data.status,
              emergencyContacts: data.emergencyContacts || [],
              notifiedUsers: data.notifiedUsers || [],
              activatedFrom: data.activatedFrom,
              extremeMode: data.extremeMode,
              hasVideo: data.hasVideo,
            };

            newNotifications.push(notification);
          });

          // Detectar nueva notificación (solo si hay notificaciones y es diferente a la última)
          if (newNotifications.length > 0) {
            const latestNotification = newNotifications[0];
            
            // Si hay una nueva notificación activa que no hemos visto antes
            if (
              latestNotification.status === 'active' &&
              latestNotification.id !== lastNotificationId &&
              !readNotifications.has(latestNotification.id)
            ) {
              console.log('🚨 Nueva notificación de pánico detectada:', latestNotification);
              setLastNotificationId(latestNotification.id);
              
              // Llamar callback si existe
              if (onNewNotification) {
                onNewNotification(latestNotification);
              }
            }
          }

          setNotifications(newNotifications);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error al escuchar notificaciones de pánico:', err);
          setError('Error al cargar notificaciones');
          setLoading(false);
        }
      );

      // Cleanup: desuscribirse cuando el componente se desmonte
      return () => {
        console.log('🔌 Desconectando listener de notificaciones de pánico');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error al configurar listener:', err);
      setError('Error al configurar notificaciones');
      setLoading(false);
    }
  }, [user, onNewNotification, lastNotificationId, readNotifications]);

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
  }, [notifications]);

  // Filtrar notificaciones activas
  const activeNotifications = notifications.filter(n => n.status === 'active');

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(
    n => !readNotifications.has(n.id) && n.status === 'active'
  ).length;

  return {
    notifications,
    activeNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    error,
  };
};

export default usePanicNotifications;


