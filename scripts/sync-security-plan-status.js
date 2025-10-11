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

async function syncSecurityPlanStatus() {
  try {
    console.log('🔄 Iniciando sincronización de estados del Plan de Seguridad...\n');

    // Obtener todos los registros de securityRegistrations
    const registrationsSnapshot = await db.collection('securityRegistrations').get();
    
    if (registrationsSnapshot.empty) {
      console.log('❌ No se encontraron registros en securityRegistrations');
      return;
    }

    console.log(`📋 Encontrados ${registrationsSnapshot.size} registros en securityRegistrations\n`);

    for (const doc of registrationsSnapshot.docs) {
      const registration = doc.data();
      const registrationId = doc.id;
      
      console.log(`👤 Procesando: ${registration.userDisplayName} (${registration.userEmail})`);
      console.log(`   📄 ID Registro: ${registrationId}`);
      console.log(`   👤 ID Usuario: ${registration.userId}`);
      console.log(`   📊 Estado: ${registration.status}`);

      try {
        // Buscar el usuario en la colección users
        const userRef = db.collection('users').doc(registration.userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          console.log(`   ⚠️  Usuario no encontrado en colección users`);
          continue;
        }

        const userData = userDoc.data();
        console.log(`   📋 Usuario encontrado: ${userData.displayName || userData.email}`);
        console.log(`   📊 Estado actual en users: ${userData.securityPlan?.status || 'No definido'}`);

        // Mapear el estado de securityRegistrations a securityPlan
        let securityPlanStatus;
        switch (registration.status) {
          case 'active':
            securityPlanStatus = 'approved';
            break;
          case 'rejected':
            securityPlanStatus = 'rejected';
            break;
          case 'pending':
          default:
            securityPlanStatus = 'pending';
            break;
        }

        // Preparar datos para actualizar
        const updateData = {
          'securityPlan.enrolled': true,
          'securityPlan.status': securityPlanStatus,
          'securityPlan.phoneNumber': registration.phoneNumber || '',
          'securityPlan.address': registration.address || '',
          'securityPlan.availability': registration.availability || '',
          'securityPlan.skills': registration.skills || [],
          'securityPlan.otherSkills': registration.otherSkills || '',
          'securityPlan.enrolledAt': registration.submittedAt,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Agregar datos de revisión si existen
        if (registration.reviewedBy) {
          updateData['securityPlan.reviewedBy'] = registration.reviewedBy;
        }
        if (registration.reviewedAt) {
          updateData['securityPlan.reviewedAt'] = registration.reviewedAt;
        }
        if (registration.reviewNotes) {
          updateData['securityPlan.reviewNotes'] = registration.reviewNotes;
        }

        // Agregar datos de aprobación/rechazo según el estado
        if (securityPlanStatus === 'approved') {
          updateData['securityPlan.approvedBy'] = registration.reviewedBy;
          updateData['securityPlan.approvedAt'] = registration.reviewedAt;
        } else if (securityPlanStatus === 'rejected') {
          updateData['securityPlan.rejectedBy'] = registration.reviewedBy;
          updateData['securityPlan.rejectedAt'] = registration.reviewedAt;
          updateData['securityPlan.rejectionReason'] = registration.reviewNotes;
        }

        // Actualizar el usuario
        await userRef.update(updateData);
        
        console.log(`   ✅ Usuario actualizado exitosamente`);
        console.log(`   📊 Nuevo estado: ${securityPlanStatus}`);
        
      } catch (userError) {
        console.error(`   ❌ Error al actualizar usuario ${registration.userId}:`, userError.message);
      }

      console.log(''); // Línea en blanco para separar usuarios
    }

    console.log('🎉 Sincronización completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncSecurityPlanStatus()
    .then(() => {
      console.log('\n✅ Script ejecutado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { syncSecurityPlanStatus };
