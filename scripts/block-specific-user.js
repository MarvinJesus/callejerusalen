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

async function blockUser(email) {
  try {
    console.log(`🔧 Bloqueando usuario: ${email}`);
    
    // Obtener el usuario por email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Usuario encontrado:', userRecord.uid);
    
    // Actualizar en Firestore
    await db.collection('users').doc(userRecord.uid).update({
      status: 'inactive',
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Usuario bloqueado exitosamente');
    
    // Verificar
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    console.log('\n📋 ESTADO DEL USUARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', userData.email);
    console.log('Status:', userData.status);
    console.log('isActive:', userData.isActive);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Email del usuario a bloquear
const emailToBlock = process.argv[2] || 'mar90jesus@ggmail.com';
blockUser(emailToBlock);

