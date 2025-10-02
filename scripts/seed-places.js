// Script para poblar Firebase con datos iniciales de lugares
const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Datos iniciales de lugares
const initialPlaces = [
  {
    name: 'Mirador de la Cruz',
    description: 'Punto de observación natural que ofrece vistas panorámicas espectaculares de toda la región. Lugar sagrado y de peregrinación.',
    category: 'miradores',
    address: 'Cerro de la Cruz, Calle Jerusalén',
    hours: '5:00 AM - 8:00 PM',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    coordinates: { lat: 19.4326, lng: -99.1332 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Pulpería El Progreso',
    description: 'La pulpería más antigua de Calle Jerusalén, en funcionamiento desde 1955. Ofrece productos tradicionales y es un punto de encuentro comunitario.',
    category: 'pulperias',
    address: 'Calle Principal #45',
    hours: '6:00 AM - 9:00 PM',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'
    ],
    coordinates: { lat: 19.4336, lng: -99.1342 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Parque Central',
    description: 'Hermoso parque con áreas verdes, juegos infantiles y pista de caminata. Centro de actividades comunitarias.',
    category: 'parques',
    address: 'Plaza Central, Calle Jerusalén',
    hours: '6:00 AM - 10:00 PM',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    coordinates: { lat: 19.4316, lng: -99.1322 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

async function seedPlaces() {
  try {
    console.log('🌱 Iniciando población de lugares en Firebase...');
    
    // Limpiar lugares existentes
    const existingPlaces = await db.collection('places').get();
    if (!existingPlaces.empty) {
      console.log(`🗑️ Eliminando ${existingPlaces.size} lugares existentes...`);
      const batch = db.batch();
      existingPlaces.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Agregar nuevos lugares
    console.log(`📝 Agregando ${initialPlaces.length} lugares...`);
    const batch = db.batch();
    
    initialPlaces.forEach(place => {
      const docRef = db.collection('places').doc();
      batch.set(docRef, place);
    });
    
    await batch.commit();
    
    console.log('✅ Lugares poblados exitosamente en Firebase!');
    console.log(`📊 Total de lugares: ${initialPlaces.length}`);
    
    // Verificar que se guardaron correctamente
    const savedPlaces = await db.collection('places').get();
    console.log(`🔍 Verificación: ${savedPlaces.size} lugares encontrados en Firebase`);
    
    savedPlaces.forEach(doc => {
      console.log(`  - ${doc.data().name} (ID: ${doc.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar lugares:', error);
  } finally {
    process.exit(0);
  }
}

seedPlaces();
