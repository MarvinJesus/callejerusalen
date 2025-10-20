// Script simple para actualizar lastSeen de usuarios
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } = require('firebase/firestore');

// Usar la configuración real del proyecto
const firebaseConfig = {
  apiKey: "AIzaSyBvKQJ9vKQJ9vKQJ9vKQJ9vKQJ9vKQJ9vKQ",
  authDomain: "callejerusalen-a78aa.firebaseapp.com",
  projectId: "callejerusalen-a78aa",
  storageBucket: "callejerusalen-a78aa.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

async function updateLastSeenSimple() {
  try {
    console.log('🔄 Actualizando lastSeen de usuarios (método simple)...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado correctamente');
    
    // Obtener todos los usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`👥 Total de usuarios: ${usersSnapshot.size}`);
    
    const now = new Date();
    
    // Actualizar algunos usuarios con lastSeen reciente (últimos 30 minutos)
    const usersToUpdate = usersSnapshot.docs.slice(0, 4); // Primeros 4 usuarios
    
    for (const userDoc of usersToUpdate) {
      const userData = userDoc.data();
      
      // Crear diferentes tiempos de lastSeen para simular usuarios conectados
      const minutesAgo = Math.floor(Math.random() * 30) + 1; // Entre 1 y 30 minutos atrás
      const lastSeenTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastSeen: Timestamp.fromDate(lastSeenTime)
      });
      
      console.log(`✅ ${userData.displayName || userData.email} - lastSeen: ${lastSeenTime.toISOString()}`);
    }
    
    console.log('\n🎉 lastSeen actualizado para usuarios de prueba!');
    
    // Verificar el resultado
    console.log('\n🔍 Verificando resultado...');
    const updatedUsersSnapshot = await getDocs(collection(db, 'users'));
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let connectedCount = 0;
    updatedUsersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const lastSeen = userData.lastSeen?.toDate();
      const isConnected = lastSeen && lastSeen > oneHourAgo;
      
      if (isConnected) {
        connectedCount++;
        console.log(`✅ ${userData.displayName || userData.email} - Conectado (${lastSeen.toISOString()})`);
      } else {
        console.log(`❌ ${userData.displayName || userData.email} - Desconectado (${lastSeen ? lastSeen.toISOString() : 'Sin lastSeen'})`);
      }
    });
    
    console.log(`\n📊 Total de usuarios conectados: ${connectedCount}`);
    
  } catch (error) {
    console.error('❌ Error actualizando lastSeen:', error);
  }
}

// Ejecutar la actualización
updateLastSeenSimple();
