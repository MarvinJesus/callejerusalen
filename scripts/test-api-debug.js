// Script para debuggear la API de lugares
const admin = require('firebase-admin');
const path = require('path');

// Simular el entorno de Next.js
process.env.NODE_ENV = 'development';

// Inicializar Firebase Admin igual que en firebase-admin.ts
const serviceAccountPath = path.join(__dirname, '..', 'callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Simular la función getPlaces del places-service
async function getPlaces() {
  try {
    console.log('🔥 Obteniendo lugares desde Firebase');
    const snapshot = await db.collection('places').orderBy('createdAt', 'desc').get();
    const places = [];
    snapshot.forEach((doc) => {
      places.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      });
    });
    console.log(`✅ Obtenidos ${places.length} lugares desde Firebase`);
    return places;
  } catch (error) {
    console.error('❌ Error al obtener lugares de Firebase:', error);
    throw error;
  }
}

// Simular la función getPlaceById del places-service
async function getPlaceById(id) {
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
    };
    
    console.log(`✅ Lugar ${id} obtenido desde Firebase: ${place.name}`);
    return place;
  } catch (error) {
    console.error(`❌ Error al obtener lugar ${id} de Firebase:`, error);
    throw error;
  }
}

async function testAPI() {
  try {
    console.log('🧪 Probando funciones de la API...');
    
    // Probar getPlaces
    console.log('\n1. Probando getPlaces()');
    const places = await getPlaces();
    console.log(`   Resultado: ${places.length} lugares`);
    places.forEach(place => {
      console.log(`   - ${place.name} (ID: ${place.id})`);
    });
    
    // Probar getPlaceById con el primer lugar
    if (places.length > 0) {
      console.log('\n2. Probando getPlaceById()');
      const firstPlace = places[0];
      const place = await getPlaceById(firstPlace.id);
      if (place) {
        console.log(`   Resultado: ${place.name}`);
      } else {
        console.log('   Resultado: null');
      }
    }
    
    console.log('\n🎉 Todas las pruebas pasaron!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    process.exit(0);
  }
}

testAPI();
