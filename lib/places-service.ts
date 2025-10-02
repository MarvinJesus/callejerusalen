// Servicio de lugares que usa Firebase Admin cuando está disponible, o datos en memoria como fallback

import { db } from '@/lib/firebase-admin';

export interface Place {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string; // Imagen principal
  images: string[]; // Galería de imágenes
  phone?: string;
  website?: string;
  characteristics?: string[];
  activities?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Nota: Todos los datos ahora se almacenan y recuperan desde Firebase
// No hay datos de ejemplo en memoria

// Verificar si Firebase Admin está disponible
const isFirebaseAvailable = () => {
  try {
    return db && typeof db.collection === 'function';
  } catch (error) {
    console.error('❌ Firebase Admin no está disponible:', error);
    return false;
  }
};

// Función para verificar y lanzar error si Firebase no está disponible
const ensureFirebaseAvailable = () => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase Admin no está disponible. No se pueden realizar operaciones de base de datos.');
  }
};

// Funciones que SOLO usan Firebase Admin
export const getPlaces = async (): Promise<Place[]> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('🔥 Obteniendo lugares desde Firebase');
    const snapshot = await db.collection('places').orderBy('createdAt', 'desc').get();
    const places: Place[] = [];
    snapshot.forEach((doc: any) => {
      places.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Place);
    });
    console.log(`✅ Obtenidos ${places.length} lugares desde Firebase`);
    return places;
  } catch (error) {
    console.error('❌ Error al obtener lugares de Firebase:', error);
    throw error;
  }
};

export const getPlaceById = async (id: string): Promise<Place | null> => {
  ensureFirebaseAvailable();
  
  try {
    console.log(`🔥 Obteniendo lugar ${id} desde Firebase`);
    const doc = await db.collection('places').doc(id).get();
    if (!doc.exists) {
      console.log(`❌ Lugar ${id} no encontrado en Firebase`);
      return null;
    }
    
    const place = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Place;
    
    console.log(`✅ Lugar ${id} obtenido desde Firebase: ${place.name}`);
    return place;
  } catch (error) {
    console.error(`❌ Error al obtener lugar ${id} de Firebase:`, error);
    throw error;
  }
};

export const addPlace = async (place: Omit<Place, 'id'>): Promise<Place> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('🔥 Creando lugar en Firebase');
    const placeData = {
      ...place,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      updatedBy: 'admin'
    };
    
    const docRef = await db.collection('places').add(placeData);
    const newPlace = {
      id: docRef.id,
      ...placeData
    };
    
    console.log(`✅ Lugar creado en Firebase: ${newPlace.name} (ID: ${newPlace.id})`);
    return newPlace;
  } catch (error) {
    console.error('❌ Error al crear lugar en Firebase:', error);
    throw error;
  }
};

export const updatePlace = async (id: string, updates: Partial<Place>): Promise<Place | null> => {
  ensureFirebaseAvailable();
  
  try {
    console.log(`🔥 Actualizando lugar ${id} en Firebase`);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: 'admin'
    };
    
    await db.collection('places').doc(id).update(updateData);
    
    // Obtener el lugar actualizado
    const doc = await db.collection('places').doc(id).get();
    if (!doc.exists) {
      console.log(`❌ Lugar ${id} no encontrado después de actualizar`);
      return null;
    }
    
    const updatedPlace = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Place;
    
    console.log(`✅ Lugar ${id} actualizado en Firebase: ${updatedPlace.name}`);
    return updatedPlace;
  } catch (error) {
    console.error(`❌ Error al actualizar lugar ${id} en Firebase:`, error);
    throw error;
  }
};

export const deletePlace = async (id: string): Promise<Place | null> => {
  ensureFirebaseAvailable();
  
  try {
    console.log(`🔥 Eliminando lugar ${id} de Firebase`);
    const doc = await db.collection('places').doc(id).get();
    if (!doc.exists) {
      console.log(`❌ Lugar ${id} no encontrado para eliminar`);
      return null;
    }
    
    const placeData = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Place;
    
    await db.collection('places').doc(id).delete();
    console.log(`✅ Lugar ${id} eliminado de Firebase: ${placeData.name}`);
    return placeData;
  } catch (error) {
    console.error(`❌ Error al eliminar lugar ${id} de Firebase:`, error);
    throw error;
  }
};

// Nota: Todas las operaciones ahora se realizan directamente en Firebase
// No hay fallback a datos en memoria para garantizar consistencia
