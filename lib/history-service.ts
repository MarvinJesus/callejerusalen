import { getAdminDb } from '@/lib/firebase-admin';

export interface HistoryPeriod {
  id?: string;
  period: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  order: number;
}

export interface CulturalTradition {
  id?: string;
  title: string;
  description: string;
  icon: string; // Nombre del icono de Lucide
  month: string;
  category?: string;
  importance?: string;
  image?: string;
  practices?: string[];
  order: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoricalPlace {
  id?: string;
  name: string;
  description: string;
  year: string;
  significance: string;
  category?: string;
  location?: string;
  features?: string[];
  image?: string;
  order: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoryGalleryImage {
  id?: string;
  title: string;
  description: string;
  url: string;
  caption?: string;
  category: string;
  year?: string;
  location?: string;
  photographer?: string;
  source?: string;
  tags: string[];
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExploreLink {
  id?: string;
  title: string;
  description: string;
  url: string;
  icon: string; // Nombre del icono de Lucide
  color: string; // Clase de color de Tailwind
  order: number;
}

export interface LocalService {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  image: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuideSection {
  id?: string;
  title: string;
  icon: string; // Nombre del icono de Lucide
  content: string[];
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuideAmenity {
  id?: string;
  name: string;
  description: string;
  icon: string; // Nombre del icono de Lucide
  available: boolean;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuideTip {
  id?: string;
  title: string;
  description: string;
  icon: string; // Nombre del icono de Lucide
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  description: string;
  availableHours: string;
  isEmergency: boolean;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitorsGuideData {
  id?: string;
  title: string;
  subtitle: string;
  sections: GuideSection[];
  amenities: GuideAmenity[];
  tips: GuideTip[];
  emergencyContacts: EmergencyContact[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommunityEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  type: string;
  organizer: string;
  contact: string;
  image: string;
  maxParticipants?: number;
  requirements: string[];
  highlights: string[];
  isRecurring: boolean;
  recurringPattern?: string;
  order: number;
}


export interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: HistoryPeriod[];
  traditions: CulturalTradition[];
  places: HistoricalPlace[];
  events: CommunityEvent[];
  gallery: HistoryGalleryImage[];
  services: LocalService[];
  exploreLinks: ExploreLink[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Función para asegurar que Firebase esté disponible
function ensureFirebaseAvailable() {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firebase Admin no está disponible');
  }
  return db;
}

// Obtener todos los datos de la página de historia
export async function getHistoryPageData(): Promise<HistoryPageData | null> {
  try {
    const db = ensureFirebaseAvailable();
    console.log('🔥 Obteniendo datos de historia desde Firebase');
    
    const historyRef = db.collection('history');
    const snapshot = await historyRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron datos de historia');
      return null;
    }
    
    // Tomar el primer documento (asumimos que solo hay uno)
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const historyData: HistoryPageData = {
      id: doc.id,
      title: data.title || 'Historia de Calle Jerusalén',
      subtitle: data.subtitle || 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
      periods: data.periods || [],
      traditions: data.traditions || [],
      places: data.places || [],
      events: data.events || [],
      gallery: data.gallery || [],
      services: data.services || [],
      exploreLinks: data.exploreLinks || [],
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
    
    console.log('✅ Datos de historia obtenidos desde Firebase');
    return historyData;
  } catch (error) {
    console.error('❌ Error al obtener datos de historia:', error);
    throw error;
  }
}

// Obtener datos de historia por ID
export async function getHistoryPageDataById(id: string): Promise<HistoryPageData | null> {
  try {
    const db = ensureFirebaseAvailable();
    console.log(`🔥 Obteniendo datos de historia ${id} desde Firebase`);
    
    const historyRef = db.collection('history').doc(id);
    const historySnap = await historyRef.get();
    
    if (!historySnap.exists()) {
      console.log(`❌ Datos de historia ${id} no encontrados`);
      return null;
    }
    
    const data = historySnap.data();
    const historyData: HistoryPageData = {
      id: historySnap.id,
      title: data.title || 'Historia de Calle Jerusalén',
      subtitle: data.subtitle || 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
      periods: data.periods || [],
      traditions: data.traditions || [],
      places: data.places || [],
      events: data.events || [],
      gallery: data.gallery || [],
      services: data.services || [],
      exploreLinks: data.exploreLinks || [],
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
    
    console.log(`✅ Datos de historia ${id} obtenidos desde Firebase: ${historyData.title}`);
    return historyData;
  } catch (error) {
    console.error(`❌ Error al obtener datos de historia ${id}:`, error);
    throw error;
  }
}

// Crear o actualizar datos de la página de historia
export async function saveHistoryPageData(historyData: Omit<HistoryPageData, 'id'>): Promise<HistoryPageData> {
  try {
    const db = ensureFirebaseAvailable();
    console.log('🔥 Guardando datos de historia en Firebase');
    
    const historyRef = db.collection('history');
    
    // Verificar si ya existe un documento
    const snapshot = await historyRef.get();
    let docId: string;
    
    if (snapshot.empty) {
      // Crear nuevo documento
      const newDoc = await historyRef.add({
        ...historyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      docId = newDoc.id;
      console.log(`✅ Datos de historia creados con ID: ${docId}`);
    } else {
      // Actualizar documento existente
      const existingDoc = snapshot.docs[0];
      docId = existingDoc.id;
      
      await historyRef.doc(docId).update({
        ...historyData,
        updatedAt: new Date(),
      });
      console.log(`✅ Datos de historia actualizados: ${docId}`);
    }
    
    return {
      id: docId,
      ...historyData,
    };
  } catch (error) {
    console.error('❌ Error al guardar datos de historia:', error);
    throw error;
  }
}

// Eliminar datos de la página de historia
export async function deleteHistoryPageData(id: string): Promise<boolean> {
  try {
    const db = ensureFirebaseAvailable();
    console.log(`🔥 Eliminando datos de historia ${id} de Firebase`);
    
    await db.collection('history').doc(id).delete();
    console.log(`✅ Datos de historia ${id} eliminados de Firebase`);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar datos de historia ${id}:`, error);
    throw error;
  }
}

// ===== FUNCIONES PARA GUÍA DE VISITANTES =====

// Obtener datos de la guía de visitantes
export async function getVisitorsGuideData(): Promise<VisitorsGuideData> {
  try {
    const db = ensureFirebaseAvailable();
    console.log('🔥 Obteniendo datos de guía de visitantes desde Firebase');
    
    const guideRef = db.collection('visitorsGuide');
    const snapshot = await guideRef.get();
    
    if (snapshot.empty) {
      console.log('📝 No hay datos de guía de visitantes, devolviendo datos por defecto');
      return {
        title: 'Guía para Visitantes',
        subtitle: 'Todo lo que necesitas saber para disfrutar al máximo tu visita a nuestra comunidad.',
        sections: [],
        amenities: [],
        tips: [],
        emergencyContacts: [],
        isActive: true,
      };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const guideData: VisitorsGuideData = {
      id: doc.id,
      title: data.title || 'Guía para Visitantes',
      subtitle: data.subtitle || 'Todo lo que necesitas saber para disfrutar al máximo tu visita a nuestra comunidad.',
      sections: data.sections || [],
      amenities: data.amenities || [],
      tips: data.tips || [],
      emergencyContacts: data.emergencyContacts || [],
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
    
    console.log(`✅ Datos de guía de visitantes obtenidos desde Firebase: ${guideData.title}`);
    return guideData;
  } catch (error) {
    console.error('❌ Error al obtener datos de guía de visitantes:', error);
    throw error;
  }
}

// Guardar datos de la guía de visitantes
export async function saveVisitorsGuideData(guideData: Omit<VisitorsGuideData, 'id'>): Promise<VisitorsGuideData> {
  try {
    const db = ensureFirebaseAvailable();
    console.log('🔥 Guardando datos de guía de visitantes en Firebase');
    
    const guideRef = db.collection('visitorsGuide');
    
    // Verificar si ya existe un documento
    const snapshot = await guideRef.get();
    let docId: string;
    
    if (snapshot.empty) {
      // Crear nuevo documento
      const newDoc = await guideRef.add({
        ...guideData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      docId = newDoc.id;
      console.log(`✅ Datos de guía de visitantes creados con ID: ${docId}`);
    } else {
      // Actualizar documento existente
      const existingDoc = snapshot.docs[0];
      docId = existingDoc.id;
      
      await guideRef.doc(docId).update({
        ...guideData,
        updatedAt: new Date(),
      });
      console.log(`✅ Datos de guía de visitantes actualizados: ${docId}`);
    }
    
    console.log(`✅ Datos de guía de visitantes guardados: ${guideData.title}`);
    return {
      ...guideData,
      id: docId,
    };
  } catch (error) {
    console.error('❌ Error al guardar datos de guía de visitantes:', error);
    throw error;
  }
}
