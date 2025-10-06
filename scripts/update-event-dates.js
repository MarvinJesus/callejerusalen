const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

console.log('📅 Actualizando fechas de eventos a 2025...');

// Configuración de Firebase Admin
const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore(app);

async function updateEventDates() {
  try {
    console.log('📋 Obteniendo datos de historia...');
    
    const historyRef = db.collection('history');
    const snapshot = await historyRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron datos de historia');
      return;
    }
    
    const doc = snapshot.docs[0];
    const historyData = doc.data();
    
    console.log(`📊 Eventos actuales: ${historyData.events?.length || 0}`);
    
    if (!historyData.events || historyData.events.length === 0) {
      console.log('❌ No hay eventos para actualizar');
      return;
    }
    
    // Actualizar fechas a 2025
    const updatedEvents = historyData.events.map((event, index) => {
      const newDate = new Date();
      newDate.setFullYear(2025);
      newDate.setMonth(11); // Diciembre
      newDate.setDate(15 + index); // Diferentes días
      
      return {
        ...event,
        date: newDate.toISOString().split('T')[0] // Formato YYYY-MM-DD
      };
    });
    
    await doc.ref.update({
      events: updatedEvents,
      updatedAt: new Date()
    });
    
    console.log('✅ Fechas de eventos actualizadas a 2025!');
    console.log('📅 Nuevas fechas:');
    updatedEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} - ${event.date}`);
    });
    
  } catch (error) {
    console.error('❌ Error al actualizar fechas de eventos:', error);
  }
}

updateEventDates();
