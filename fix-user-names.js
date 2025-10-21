const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const db = admin.firestore();

async function fixUserNames() {
  console.log('🔧 Corrigiendo nombres de usuario en securityRegistrations...\n');

  try {
    // Obtener todos los registros
    const registrationsSnapshot = await db.collection('securityRegistrations').get();
    
    console.log(`📊 Total de registros: ${registrationsSnapshot.size}\n`);
    
    let updatedCount = 0;
    let errorCount = 0;

    for (const docSnapshot of registrationsSnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      // Verificar si userDisplayName está undefined o vacío
      if (!data.userDisplayName || data.userDisplayName === 'undefined') {
        try {
          console.log(`📝 Corrigiendo registro: ${docId}`);
          console.log(`   - Email: ${data.userEmail}`);
          console.log(`   - Nombre actual: ${data.userDisplayName || 'undefined'}`);
          
          // Generar un nombre basado en el email
          let newName = 'Usuario';
          if (data.userEmail) {
            const emailParts = data.userEmail.split('@');
            if (emailParts[0]) {
              newName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
            }
          }
          
          // Actualizar el documento
          await db.collection('securityRegistrations').doc(docId).update({
            userDisplayName: newName,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`   ✅ Nombre actualizado a: ${newName}`);
          updatedCount++;
          
        } catch (error) {
          console.error(`   ❌ Error al actualizar ${docId}:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`✅ ${docId}: ${data.userDisplayName} - Nombre ya está correcto`);
      }
    }

    // Resumen
    console.log('\n📊 RESUMEN DE CORRECCIÓN:');
    console.log(`   - Registros procesados: ${registrationsSnapshot.size}`);
    console.log(`   - Registros actualizados: ${updatedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    
    if (updatedCount > 0) {
      console.log('\n✅ Corrección completada exitosamente');
      console.log('   Los usuarios ahora tienen nombres válidos');
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  }
}

// Ejecutar la corrección
fixUserNames().then(() => {
  console.log('\n🏁 Proceso de corrección finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});


