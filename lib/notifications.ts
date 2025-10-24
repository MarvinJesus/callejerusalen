'use client';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export interface NotificationInput<TData = Record<string, unknown>> {
  userId: string;
  title: string;
  message: string;
  type?: string;
  data?: TData | null;
  link?: string | null;
  read?: boolean;
}

// Crea un documento en la coleccion `notifications` para un usuario.
export const createNotification = async <TData = Record<string, unknown>>(
  input: NotificationInput<TData>
) => {
  if (!db) {
    throw new Error('Firebase no esta inicializado');
  }

  const payload = {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? 'general',
    data: input.data ?? null,
    link: input.link ?? null,
    read: input.read ?? false,
    createdAt: serverTimestamp()
  };

  const notificationsRef = collection(db, 'notifications');
  const docRef = await addDoc(notificationsRef, payload);
  return docRef;
};

export const createWelcomeNotification = async (params: {
  userId: string;
  displayName?: string | null;
}) => {
  const userFirstName = params.displayName?.split(' ')[0] ?? 'Vecino';

  return createNotification({
    userId: params.userId,
    title: 'Bienvenido a Calle Jerusalen!',
    message: `Hola ${userFirstName}, tu solicitud fue recibida. Te avisaremos cuando un administrador revise tu registro.`,
    type: 'registration_welcome',
    link: '/residentes',
    read: false
  });
};

export const createPanicActivationNotifications = async (params: {
  alertId: string;
  triggeredByName: string;
  location: string;
  description?: string;
  notifiedUserIds: string[];
  extremeMode?: boolean;
  hasVideo?: boolean;
}) => {
  const uniqueTargets = Array.from(new Set(params.notifiedUserIds.filter(Boolean)));
  if (uniqueTargets.length === 0) {
    return;
  }

  await Promise.allSettled(
    uniqueTargets.map((targetId) =>
      createNotification({
        userId: targetId,
        title: 'Alerta de panico activa',
        message: `${params.triggeredByName} activo una alerta de panico. Ubicacion: ${params.location}.`,
        type: 'panic_alert_active',
        link: `/residentes/panico/activa/${params.alertId}`,
        data: {
          alertId: params.alertId,
          triggeredBy: params.triggeredByName,
          location: params.location,
          description: params.description ?? null,
          extremeMode: params.extremeMode ?? false,
          hasVideo: params.hasVideo ?? false
        }
      })
    )
  );
};

export const createPanicResolutionNotifications = async (params: {
  alertId: string;
  ownerId: string;
  ownerName: string;
  resolvedByName?: string;
  notifiedUserIds?: string[];
}) => {
  const resolvedBy = params.resolvedByName ?? 'equipo de asistencia';

  const tasks: Promise<any>[] = [
    createNotification({
      userId: params.ownerId,
      title: 'Alerta de panico resuelta',
      message: `Tu alerta fue marcada como resuelta por ${resolvedBy}.`,
      type: 'panic_alert_resolved',
      link: `/residentes/panico/historial/${params.alertId}`,
      data: {
        alertId: params.alertId,
        resolvedBy
      }
    })
  ];

  if (params.notifiedUserIds && params.notifiedUserIds.length > 0) {
    const uniqueContacts = Array.from(new Set(params.notifiedUserIds.filter((id) => id && id !== params.ownerId)));
    uniqueContacts.forEach((targetId) => {
      tasks.push(
        createNotification({
          userId: targetId,
          title: 'Alerta de panico finalizada',
          message: `La alerta de ${params.ownerName} fue marcada como resuelta por ${resolvedBy}.`,
          type: 'panic_alert_resolved',
          link: `/residentes/panico/historial/${params.alertId}`,
          data: {
            alertId: params.alertId,
            ownerName: params.ownerName,
            resolvedBy
          }
        })
      );
    });
  }

  await Promise.allSettled(tasks);
};
