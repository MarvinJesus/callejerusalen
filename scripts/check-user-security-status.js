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

async function checkUserSecurityStatus() {
  try {
    console.log('🔍 Verificando estado del usuario Marvin en la base de datos...\n');

    const userId = 'qwBKaOMEZCgePXPTHsuNhAoz9uC2'; // Marvin Calvo

    // 1. Verificar usuario en la colección users
    console.log('📋 1. Verificando usuario en colección "users":');
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`   ✅ Usuario encontrado: ${userData.displayName}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🏷️  Rol: ${userData.role}`);
      console.log(`   📊 Estado: ${userData.status}`);
      console.log(`   🔐 Activo: ${userData.isActive}`);
      console.log(`   📋 Registro: ${userData.registrationStatus}`);
      
      if (userData.securityPlan) {
        console.log(`   ⚠️  AÚN TIENE CAMPO securityPlan:`, userData.securityPlan);
      } else {
        console.log(`   ✅ Campo securityPlan eliminado correctamente`);
      }
    } else {
      console.log(`   ❌ Usuario no encontrado en colección users`);
    }

    console.log('\n📋 2. Verificando registro en colección "securityRegistrations":');
    
    // 2. Buscar en securityRegistrations por userId
    const registrationsSnapshot = await db.collection('securityRegistrations').get();
    
    let foundRegistration = null;
    registrationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId) {
        foundRegistration = { id: doc.id, ...data };
      }
    });

    if (foundRegistration) {
      console.log(`   ✅ Registro encontrado: ${foundRegistration.id}`);
      console.log(`   👤 Nombre: ${foundRegistration.userDisplayName}`);
      console.log(`   📧 Email: ${foundRegistration.userEmail}`);
      console.log(`   📞 Teléfono: ${foundRegistration.phoneNumber}`);
      console.log(`   📍 Dirección: ${foundRegistration.address}`);
      console.log(`   🕒 Disponibilidad: ${foundRegistration.availability}`);
      console.log(`   🛠️  Habilidades: ${foundRegistration.skills?.join(', ') || 'N/A'}`);
      console.log(`   📊 Estado: ${foundRegistration.status}`);
      console.log(`   📅 Enviado: ${foundRegistration.submittedAt?.toDate?.() || foundRegistration.submittedAt}`);
      console.log(`   👨‍💼 Revisado por: ${foundRegistration.reviewedBy || 'N/A'}`);
      console.log(`   📅 Revisado: ${foundRegistration.reviewedAt?.toDate?.() || foundRegistration.reviewedAt}`);
      console.log(`   📝 Notas: ${foundRegistration.reviewNotes || 'N/A'}`);
      
      if (foundRegistration.status === 'active') {
        console.log(`   ✅ ESTADO: APROBADO - El usuario debería tener acceso`);
      } else if (foundRegistration.status === 'pending') {
        console.log(`   ⏳ ESTADO: PENDIENTE - El usuario NO debería tener acceso`);
      } else if (foundRegistration.status === 'rejected') {
        console.log(`   ❌ ESTADO: RECHAZADO - El usuario NO debería tener acceso`);
      }
    } else {
      console.log(`   ❌ No se encontró registro en securityRegistrations para userId: ${userId}`);
    }

    console.log('\n🔍 3. Resumen:');
    console.log(`   👤 Usuario: ${userDoc.exists ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   📋 Registro: ${foundRegistration ? '✅ Existe' : '❌ No existe'}`);
    console.log(`   📊 Estado: ${foundRegistration?.status || 'N/A'}`);
    console.log(`   🎯 Acceso esperado: ${foundRegistration?.status === 'active' ? '✅ SÍ' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error verificando estado del usuario:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkUserSecurityStatus()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando verificación:', error);
      process.exit(1);
    });
}

module.exports = { checkUserSecurityStatus };
