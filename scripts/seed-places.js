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
    description:
      'Ubicado en las colinas de Concepción, este mirador ofrece vistas panorámicas del Valle Central, incluyendo San José, Heredia y Alajuela. Es un lugar de encuentro para caminantes, peregrinos y visitantes que buscan un espacio de paz y naturaleza.',
    category: 'miradores',
    address: 'Cerro de la Cruz, Calle Jerusalén, Concepción, San Rafael de Heredia',
    hours: '5:00 AM – 8:00 PM',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    coordinates: { lat: 10.0401, lng: -84.0862 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Pulpería El Progreso',
    description:
      'Fundada en 1955, esta emblemática pulpería ha servido por décadas como punto de encuentro y abastecimiento para las familias de Calle Jerusalén. Conserva su estilo tradicional y mantiene la venta de productos locales y artesanales.',
    category: 'pulperias',
    address: 'Calle Principal #45, Calle Jerusalén, Concepción de San Rafael',
    hours: '6:00 AM – 9:00 PM',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800'
    ],
    coordinates: { lat: 10.0399, lng: -84.0854 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Parque Central de Concepción',
    description:
      'Corazón de la comunidad, rodeado por árboles de ciprés y la iglesia local. Es el escenario principal de las actividades culturales y deportivas de la zona, donde vecinos se reúnen para eventos, ferias y celebraciones patronales.',
    category: 'parques',
    address: 'Plaza Central, Concepción, San Rafael de Heredia',
    hours: '6:00 AM – 10:00 PM',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    coordinates: { lat: 10.0396, lng: -84.0847 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Iglesia de Concepción',
    description:
      'Templo católico de arquitectura tradicional herediana, construido en la primera mitad del siglo XX. Es uno de los edificios más representativos del distrito y punto central de las festividades religiosas.',
    category: 'iglesias',
    address: 'Frente al Parque Central, Concepción, San Rafael de Heredia',
    hours: '6:00 AM – 6:00 PM',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1508051123996-69f8caf4891e?w=400',
    images: [
      'https://images.unsplash.com/photo-1508051123996-69f8caf4891e?w=800',
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?w=800',
      'https://images.unsplash.com/photo-1528747008803-1baa6c662af1?w=800'
    ],
    coordinates: { lat: 10.0394, lng: -84.0845 },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    name: 'Sendero Ecológico La Esperanza',
    description:
      'Pequeña ruta natural ubicada al norte de Calle Jerusalén, ideal para caminatas cortas, observación de aves y contacto con la naturaleza. Administrada por vecinos voluntarios.',
    category: 'senderos',
    address: 'Final norte de Calle Jerusalén, Concepción de San Rafael',
    hours: '5:30 AM – 5:00 PM',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    images: [
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      'https://images.unsplash.com/photo-1493810329807-1e7d2dfc73ef?w=800'
    ],
    coordinates: { lat: 10.0412, lng: -84.0868 },
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
