const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require(path.join(__dirname, '../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function cleanSecurityPlanField() {
  try {
    console.log('🧹 Iniciando limpieza del campo securityPlan de la colección users...\n');

    // Obtener todos los usuarios que tengan el campo securityPlan
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No se encontraron usuarios en la colección users');
      return;
    }

    console.log(`📋 Encontrados ${usersSnapshot.size} usuarios en la colección users\n`);

    let cleanedCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      if (userData.securityPlan) {
        console.log(`👤 Limpiando usuario: ${userData.displayName || userData.email} (${userId})`);
        console.log(`   📊 Estado actual: ${userData.securityPlan.status || 'No definido'}`);

        try {
          // Eliminar el campo securityPlan
          await doc.ref.update({
            securityPlan: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ Campo securityPlan eliminado exitosamente`);
          cleanedCount++;
          
        } catch (error) {
          console.error(`   ❌ Error al limpiar usuario ${userId}:`, error.message);
        }

        console.log(''); // Línea en blanco para separar usuarios
      }
    }

    console.log(`🎉 Limpieza completada exitosamente`);
    console.log(`📊 Usuarios limpiados: ${cleanedCount}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanSecurityPlanField()
    .then(() => {
      console.log('\n✅ Script ejecutado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { cleanSecurityPlanField };
