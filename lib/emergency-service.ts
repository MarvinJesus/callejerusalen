import { getAdminDb } from '@/lib/firebase-admin';

export interface EmergencyInfo {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  safeAreaName: string;
  safeAreaAddress?: string;
  imageUrl?: string;
  tips: string[];
  instructions: string[];
  map: {
    lat: number;
    lng: number;
    zoom?: number;
  };
  isActive: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}

function ensureFirebaseAvailable() {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firebase Admin no está disponible');
  }
  return db;
}

export async function getEmergencyInfo(): Promise<EmergencyInfo> {
  const db = ensureFirebaseAvailable();
  const col = db.collection('emergencyInfo');
  const snapshot = await col.get();

  if (snapshot.empty) {
    return {
      title: 'Área Segura de Reunión',
      subtitle: 'Punto de reunión en caso de siniestro o catástrofe',
      description:
        'En caso de siniestro o catástrofe, dirígete de inmediato al área segura designada y sigue las indicaciones de la comunidad y las autoridades.',
      safeAreaName: 'Área Segura Principal',
      safeAreaAddress: '',
      imageUrl: '',
      tips: [
        'Mantén la calma y ayuda a quienes lo necesiten',
        'No bloquees vías de acceso para equipos de emergencia',
        'Lleva documentos de identidad y un botiquín básico si es posible'
      ],
      instructions: [
        'Sigue las rutas señalizadas hacia el punto de encuentro',
        'Evita regresar a zonas de riesgo hasta recibir autorización',
        'Reporta personas desaparecidas a los coordinadores de seguridad'
      ],
      map: { lat: 10.02424263, lng: -84.07890636, zoom: 16 },
      isActive: true,
    };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || 'Área Segura de Reunión',
    subtitle: data.subtitle || 'Punto de reunión en caso de siniestro o catástrofe',
    description: data.description || '',
    safeAreaName: data.safeAreaName || 'Área Segura Principal',
    safeAreaAddress: data.safeAreaAddress || '',
    imageUrl: data.imageUrl || '',
    tips: Array.isArray(data.tips) ? data.tips : [],
    instructions: Array.isArray(data.instructions) ? data.instructions : [],
    map: {
      lat: Number(data.map?.lat) || 10.02424263,
      lng: Number(data.map?.lng) || -84.07890636,
      zoom: data.map?.zoom ? Number(data.map.zoom) : 16,
    },
    isActive: data.isActive !== false,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
  };
}

export async function saveEmergencyInfo(payload: Omit<EmergencyInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmergencyInfo> {
  const db = ensureFirebaseAvailable();
  const col = db.collection('emergencyInfo');
  const snapshot = await col.get();

  const dataToSave = {
    title: (payload.title || '').trim(),
    subtitle: (payload.subtitle || '').trim(),
    description: (payload.description || '').trim(),
    safeAreaName: (payload.safeAreaName || '').trim(),
    safeAreaAddress: (payload.safeAreaAddress || '').trim(),
    imageUrl: (payload.imageUrl || '').trim(),
    tips: Array.isArray(payload.tips) ? payload.tips : [],
    instructions: Array.isArray(payload.instructions) ? payload.instructions : [],
    map: {
      lat: Number(payload.map?.lat) || 10.02424263,
      lng: Number(payload.map?.lng) || -84.07890636,
      zoom: payload.map?.zoom ? Number(payload.map.zoom) : 16,
    },
    isActive: payload.isActive !== false,
    updatedAt: new Date(),
  };

  if (snapshot.empty) {
    const docRef = await col.add({ ...dataToSave, createdAt: new Date() });
    return { id: docRef.id, ...dataToSave } as EmergencyInfo;
  }

  const existing = snapshot.docs[0];
  await col.doc(existing.id).update(dataToSave);
  return { id: existing.id, ...dataToSave } as EmergencyInfo;
}


