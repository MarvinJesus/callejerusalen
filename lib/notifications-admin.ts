import { getAdminDb } from '@/lib/firebase-admin';

export interface AdminNotificationInput<TData = Record<string, unknown>> {
  userId: string;
  title: string;
  message: string;
  type?: string;
  data?: TData | null;
  link?: string | null;
  read?: boolean;
}

/**
 * Crea una notificación usando Firebase Admin (entornos del servidor).
 */
export const createAdminNotification = async <TData = Record<string, unknown>>(
  input: AdminNotificationInput<TData>
) => {
  const adminDb = getAdminDb();

  const payload = {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? 'general',
    data: input.data ?? null,
    link: input.link ?? null,
    read: input.read ?? false,
    createdAt: new Date()
  };

  await adminDb.collection('notifications').add(payload);
};

