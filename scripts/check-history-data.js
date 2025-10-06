const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('🔍 Verificando datos de historia en Firebase...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

async function checkHistoryData() {
  try {
    console.log('📋 Verificando colección de historia...');
    
    const historyRef = db.collection('history');
    const snapshot = await historyRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron datos de historia');
      console.log('📝 Creando datos de historia básicos...');
      
      // Crear datos básicos de historia
      const basicHistoryData = {
        title: 'Historia de Calle Jerusalén',
        subtitle: 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
        periods: [],
        traditions: [],
        places: [],
        events: [],
        gallery: [],
        services: [],
        exploreLinks: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await historyRef.add(basicHistoryData);
      console.log('✅ Datos básicos de historia creados');
    } else {
      console.log('✅ Datos de historia encontrados:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`  - Título: ${data.title}`);
        console.log(`  - Eventos: ${data.events?.length || 0}`);
        console.log(`  - Activo: ${data.isActive}`);
        console.log(`  - Creado: ${data.createdAt?.toDate?.() || data.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al verificar datos de historia:', error);
  }
}

checkHistoryData();
