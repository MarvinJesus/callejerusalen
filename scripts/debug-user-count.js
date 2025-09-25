// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
};

async function debugUserCount() {
  try {
    console.log('🔍 Iniciando diagnóstico de usuarios...');
    console.log('📋 Configuración Firebase:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('✅ Firebase inicializado correctamente');

    // Obtener todos los usuarios
    console.log('📊 Obteniendo usuarios desde Firestore...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    console.log(`📈 Total de documentos encontrados: ${usersSnapshot.size}`);
    
    const users = [];
    const usersByStatus = { active: 0, inactive: 0, deleted: 0 };
    const usersByRole = { super_admin: 0, admin: 0, comunidad: 0, visitante: 0, residente: 0 };
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        isActive: userData.isActive,
        displayName: userData.displayName,
        createdAt: userData.createdAt
      });
      
      // Contar por estado
      const status = userData.status || (userData.isActive ? 'active' : 'inactive');
      usersByStatus[status] = (usersByStatus[status] || 0) + 1;
      
      // Contar por rol
      const role = userData.role || 'unknown';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });

    console.log('\n📋 RESUMEN DE USUARIOS:');
    console.log('='.repeat(50));
    console.log(`Total de usuarios: ${users.length}`);
    console.log('\nPor estado:');
    Object.entries(usersByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nPor rol:');
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\n📝 DETALLES DE USUARIOS:');
    console.log('='.repeat(50));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.displayName || 'Sin nombre'}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Estado: ${user.status}`);
      console.log(`   Activo: ${user.isActive}`);
      console.log(`   Creado: ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'Desconocido'}`);
      console.log('');
    });

    // Verificar si hay usuarios con datos inconsistentes
    console.log('🔍 VERIFICACIÓN DE INCONSISTENCIAS:');
    console.log('='.repeat(50));
    
    const inconsistentUsers = users.filter(user => {
      const statusFromIsActive = user.isActive ? 'active' : 'inactive';
      return user.status && user.status !== statusFromIsActive;
    });

    if (inconsistentUsers.length > 0) {
      console.log(`⚠️  Se encontraron ${inconsistentUsers.length} usuarios con datos inconsistentes:`);
      inconsistentUsers.forEach(user => {
        console.log(`  - ${user.email}: status="${user.status}" pero isActive=${user.isActive}`);
      });
    } else {
      console.log('✅ No se encontraron inconsistencias en los datos');
    }

    // Verificar usuarios duplicados por email
    const emailCounts = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });

    const duplicateEmails = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    if (duplicateEmails.length > 0) {
      console.log(`⚠️  Se encontraron emails duplicados:`);
      duplicateEmails.forEach(([email, count]) => {
        console.log(`  - ${email}: ${count} registros`);
      });
    } else {
      console.log('✅ No se encontraron emails duplicados');
    }

    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el diagnóstico
debugUserCount();
