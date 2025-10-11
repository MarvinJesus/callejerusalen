import { db } from '@/lib/firebase-admin';

export interface EventRegistration {
  id?: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  registrationDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventRegistrationStats {
  eventId: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  lastUpdated: Date;
}

// Función para asegurar que Firebase esté disponible
function ensureFirebaseAvailable() {
  if (!db) {
    throw new Error('Firebase Admin no está disponible');
  }
}

// Inscribir usuario a un evento
export async function registerUserToEvent(
  eventId: string, 
  userId: string, 
  userEmail: string, 
  userName: string,
  notes?: string
): Promise<EventRegistration> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Registrando usuario ${userId} al evento ${eventId}`);
    
    // Verificar si el usuario ya está inscrito
    const existingRegistration = await getUserEventRegistration(eventId, userId);
    if (existingRegistration && existingRegistration.status !== 'cancelled') {
      throw new Error('El usuario ya está inscrito a este evento');
    }

    // Verificar si el evento existe y tiene cupo disponible
    const eventStats = await getEventRegistrationStats(eventId);
    // Aquí podrías agregar lógica para verificar el cupo máximo del evento
    
    const registrationData: Omit<EventRegistration, 'id'> = {
      eventId,
      userId,
      userEmail,
      userName,
      registrationDate: new Date(),
      status: 'confirmed',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const registrationRef = db.collection('eventRegistrations');
    const newRegistration = await registrationRef.add(registrationData);
    
    console.log(`✅ Usuario ${userId} registrado al evento ${eventId} con ID: ${newRegistration.id}`);
    
    return {
      id: newRegistration.id,
      ...registrationData,
    };
  } catch (error) {
    console.error(`❌ Error al registrar usuario al evento:`, error);
    throw error;
  }
}

// Desinscribir usuario de un evento
export async function unregisterUserFromEvent(
  eventId: string, 
  userId: string
): Promise<boolean> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Desinscribiendo usuario ${userId} del evento ${eventId}`);
    
    const registration = await getUserEventRegistration(eventId, userId);
    if (!registration) {
      throw new Error('El usuario no está inscrito a este evento');
    }

    if (!registration.id) {
      throw new Error('ID de registro no encontrado');
    }

    await db.collection('eventRegistrations').doc(registration.id).update({
      status: 'cancelled',
      updatedAt: new Date(),
    });
    
    console.log(`✅ Usuario ${userId} desinscrito del evento ${eventId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al desinscribir usuario del evento:`, error);
    throw error;
  }
}

// Obtener inscripción de un usuario a un evento específico
export async function getUserEventRegistration(
  eventId: string, 
  userId: string
): Promise<EventRegistration | null> {
  try {
    ensureFirebaseAvailable();
    
    const registrationsRef = db.collection('eventRegistrations');
    const snapshot = await registrationsRef
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      eventId: data.eventId,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      registrationDate: data.registrationDate?.toDate(),
      status: data.status,
      notes: data.notes,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  } catch (error) {
    console.error(`❌ Error al obtener inscripción del usuario:`, error);
    throw error;
  }
}

// Obtener todas las inscripciones de un evento (VERSIÓN OPTIMIZADA CON ÍNDICES)
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Obteniendo inscripciones del evento ${eventId} (versión optimizada)`);
    
    const registrationsRef = db.collection('eventRegistrations');
    const snapshot = await registrationsRef
      .where('eventId', '==', eventId)
      .orderBy('registrationDate', 'desc')
      .get();
    
    const registrations: EventRegistration[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      registrations.push({
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        registrationDate: data.registrationDate?.toDate(),
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });
    
    console.log(`✅ Obtenidas ${registrations.length} inscripciones del evento ${eventId}`);
    return registrations;
  } catch (error) {
    console.error(`❌ Error al obtener inscripciones del evento:`, error);
    throw error;
  }
}

// Obtener estadísticas de inscripciones de un evento
export async function getEventRegistrationStats(eventId: string): Promise<EventRegistrationStats> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Obteniendo estadísticas del evento ${eventId}`);
    
    const registrations = await getEventRegistrations(eventId);
    
    const stats: EventRegistrationStats = {
      eventId,
      totalRegistrations: registrations.length,
      confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
      pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
      cancelledRegistrations: registrations.filter(r => r.status === 'cancelled').length,
      lastUpdated: new Date(),
    };
    
    console.log(`✅ Estadísticas del evento ${eventId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`❌ Error al obtener estadísticas del evento:`, error);
    throw error;
  }
}

// Obtener todos los eventos a los que está inscrito un usuario (VERSIÓN OPTIMIZADA CON ÍNDICES)
export async function getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Obteniendo eventos del usuario ${userId} (versión optimizada)`);
    
    const registrationsRef = db.collection('eventRegistrations');
    const snapshot = await registrationsRef
      .where('userId', '==', userId)
      .where('status', 'in', ['confirmed', 'pending'])
      .orderBy('registrationDate', 'desc')
      .get();
    
    const registrations: EventRegistration[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      registrations.push({
        id: doc.id,
        eventId: data.eventId,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        registrationDate: data.registrationDate?.toDate(),
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });
    
    console.log(`✅ Usuario ${userId} está inscrito a ${registrations.length} eventos`);
    return registrations;
  } catch (error) {
    console.error(`❌ Error al obtener eventos del usuario:`, error);
    throw error;
  }
}

// Actualizar estado de una inscripción (para administradores)
export async function updateRegistrationStatus(
  registrationId: string, 
  status: 'confirmed' | 'pending' | 'cancelled'
): Promise<boolean> {
  try {
    ensureFirebaseAvailable();
    console.log(`🔥 Actualizando estado de inscripción ${registrationId} a ${status}`);
    
    await db.collection('eventRegistrations').doc(registrationId).update({
      status,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Estado de inscripción ${registrationId} actualizado a ${status}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al actualizar estado de inscripción:`, error);
    throw error;
  }
}

