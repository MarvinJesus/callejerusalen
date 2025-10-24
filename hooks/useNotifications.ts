'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_LIMIT = 50;

export interface AppNotificationPayload {
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  userId: string;
  createdAt: Date;
  data?: AppNotificationPayload | null;
  link?: string | null;
  readAt?: Date | null;
}

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markManyAsRead: (ids: string[]) => Promise<void>;
}

const normalizeDate = (value: unknown): Date => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const maybeTimestamp = value as { toDate: () => Date };
      const converted = maybeTimestamp.toDate();
      if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
        return converted;
      }
    } catch {
      // ignore
    }
  }

  return new Date();
};

export const useNotifications = (
  options: { limit?: number } = {}
): UseNotificationsResult => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limitValue = options.limit ?? DEFAULT_LIMIT;

  useEffect(() => {
    if (!user || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isActive = true;
    let unsubscribe: (() => void) | null = null;

    setLoading(true);
    setError(null);

    const notificationsRef = collection(db, 'notifications');

    const startListener = (withOrdering: boolean) => {
      if (!isActive) {
        return;
      }

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const constraints: QueryConstraint[] = [where('userId', '==', user.uid)];
      if (withOrdering) {
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitValue));
      }

      unsubscribe = onSnapshot(
        query(notificationsRef, ...constraints),
        (snapshot) => {
          if (!isActive) {
            return;
          }

          const mapped: AppNotification[] = snapshot.docs.map((document) => {
            const data = document.data();
            const createdAt = normalizeDate(data.createdAt);
            const readAt = data.readAt ? normalizeDate(data.readAt) : null;

            return {
              id: document.id,
              title: data.title ?? 'Notificacion',
              message: data.message ?? '',
              type: data.type ?? 'general',
              read: Boolean(data.read),
              userId: data.userId ?? '',
              createdAt,
              readAt,
              data: data.data ?? null,
              link: data.link ?? data.url ?? data.data?.link ?? null
            };
          });

          const sorted = withOrdering
            ? mapped
            : [...mapped].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          const limited = withOrdering ? sorted : sorted.slice(0, limitValue);

          setNotifications(limited);
          setLoading(false);
          setError(null);
        },
        (listenerError: any) => {
          if (!isActive) {
            return;
          }

          const requiresIndex =
            listenerError?.code === 'failed-precondition' ||
            listenerError?.message?.includes('requires an index');

          if (withOrdering && requiresIndex) {
            console.warn(
              'Falta un indice compuesto para ordenar notificaciones por createdAt. Se usará ordenamiento local.',
              listenerError
            );
            startListener(false);
            return;
          }

          console.error('Error al escuchar notificaciones:', listenerError);
          setLoading(false);
          setError('No se pudieron cargar las notificaciones');
        }
      );
    };

    startListener(true);

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [limitValue, user]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user || !db || !id) {
        return;
      }

      try {
        const notificationRef = doc(db, 'notifications', id);
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
      } catch (markError) {
        console.error('Error al marcar notificacion como leida:', markError);
      }
    },
    [user]
  );

  const markManyAsRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) {
        return;
      }

      await Promise.all(ids.map((notificationId) => markAsRead(notificationId)));
    },
    [markAsRead]
  );

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((notification) => !notification.read).map((n) => n.id);

    if (!unread.length) {
      return;
    }

    await markManyAsRead(unread);
  }, [markManyAsRead, notifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0),
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    markManyAsRead
  };
};
