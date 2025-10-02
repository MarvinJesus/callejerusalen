// Script para probar directamente el servicio de lugares
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

async function testPlacesService() {
  try {
    console.log('🧪 Probando servicio de lugares directamente...');
    
    // Obtener lugares desde Firebase
    console.log('📋 Obteniendo lugares desde Firebase...');
    const snapshot = await db.collection('places').orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron lugares en Firebase');
      return;
    }
    
    console.log(`✅ Encontrados ${snapshot.size} lugares:`);
    
    const places = [];
    snapshot.forEach((doc) => {
      const place = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      };
      places.push(place);
      console.log(`  - ${place.name} (ID: ${place.id})`);
    });
    
    // Probar obtener un lugar específico
    if (places.length > 0) {
      const firstPlace = places[0];
      console.log(`\n🔍 Probando obtener lugar específico: ${firstPlace.id}`);
      
      const doc = await db.collection('places').doc(firstPlace.id).get();
      if (doc.exists) {
        console.log(`✅ Lugar específico encontrado: ${doc.data().name}`);
      } else {
        console.log('❌ Lugar específico no encontrado');
      }
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testPlacesService();
