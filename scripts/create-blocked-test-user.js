const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createBlockedTestUser() {
  const testEmail = 'blocked-test@callejerusalen.com';
  const testPassword = 'TestBlocked123!';
  
  try {
    console.log('🔧 Creando usuario de prueba bloqueado...');
    
    // Intentar crear el usuario en Authentication
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: testEmail,
        password: testPassword,
        displayName: 'Usuario Bloqueado de Prueba'
      });
      console.log('✅ Usuario creado en Authentication:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️ Usuario ya existe en Authentication, obteniendo...');
        userRecord = await auth.getUserByEmail(testEmail);
        console.log('✅ Usuario existente encontrado:', userRecord.uid);
      } else {
        throw error;
      }
    }
    
    // Crear/actualizar documento en Firestore con estado BLOQUEADO
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: testEmail,
      displayName: 'Usuario Bloqueado de Prueba',
      role: 'comunidad',
      status: 'inactive', // ← BLOQUEADO
      isActive: false,     // ← BLOQUEADO
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      registrationStatus: 'approved',
      permissions: []
    }, { merge: true });
    
    console.log('✅ Documento de Firestore creado/actualizado con estado BLOQUEADO');
    
    // Verificar que está bloqueado
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    console.log('\n📋 DATOS DEL USUARIO CREADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', userData.email);
    console.log('Password:', testPassword);
    console.log('Status:', userData.status);
    console.log('isActive:', userData.isActive);
    console.log('Role:', userData.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n✅ Usuario de prueba bloqueado creado exitosamente!');
    console.log('\n🧪 PRUEBA AHORA:');
    console.log('1. Ve a: http://localhost:3000/login');
    console.log('2. Abre la consola del navegador (F12)');
    console.log('3. Ingresa:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('4. Haz click en "Iniciar Sesión"');
    console.log('5. DEBE aparecer un BANNER AMARILLO en la parte superior');
    console.log('\n✅ Si el banner NO aparece, copia y pega TODOS los logs de la consola del navegador.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createBlockedTestUser();

