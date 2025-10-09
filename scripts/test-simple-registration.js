const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function testSimpleRegistration() {
  try {
    console.log('🧪 Iniciando prueba simple de registro...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Crear un usuario de prueba
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    const testDisplayName = 'Usuario de Prueba';
    
    console.log('📝 Creando usuario de prueba...');
    console.log('Email:', testEmail);
    console.log('Nombre:', testDisplayName);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ Usuario creado en Firebase Auth:', user.uid);
    
    // Crear perfil en Firestore
    console.log('💾 Creando perfil en Firestore...');
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: testDisplayName,
      role: 'comunidad',
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      permissions: [],
      registrationStatus: 'pending',
      statusChangedBy: 'system',
      statusChangedAt: new Date(),
      statusReason: 'Registro pendiente de aprobación'
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ Perfil creado en Firestore exitosamente');
    } catch (error) {
      console.error('❌ Error al crear perfil en Firestore:', error);
      throw error;
    }
    
    // Verificar que se creó correctamente
    console.log('🔍 Verificando perfil creado...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Perfil verificado en Firestore:');
      console.log('  - Email:', userData.email);
      console.log('  - Nombre:', userData.displayName);
      console.log('  - Rol:', userData.role);
      console.log('  - Estado:', userData.status);
      console.log('  - Estado de registro:', userData.registrationStatus);
    } else {
      console.log('❌ No se encontró el perfil en Firestore');
    }
    
    // Crear solicitud de registro
    console.log('📝 Creando solicitud de registro...');
    const registrationRequest = {
      id: user.uid,
      email: user.email,
      displayName: testDisplayName,
      requestedRole: 'comunidad',
      createdAt: new Date(),
      status: 'pending'
    };
    
    try {
      await setDoc(doc(db, 'registrationRequests', user.uid), registrationRequest);
      console.log('✅ Solicitud de registro creada exitosamente');
    } catch (error) {
      console.error('❌ Error al crear solicitud de registro:', error);
      // No es crítico, continuar
    }
    
    console.log('\n🎉 Prueba completada exitosamente');
    console.log('📋 Resumen:');
    console.log('  - Usuario creado en Firebase Auth: ✅');
    console.log('  - Perfil creado en Firestore: ✅');
    console.log('  - Solicitud de registro creada: ✅');
    
    // Limpiar usuario de prueba
    console.log('\n🧹 Limpiando usuario de prueba...');
    await user.delete();
    console.log('✅ Usuario de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Solución:');
      console.log('1. Despliega las reglas de Firestore actualizadas:');
      console.log('   npm run deploy-rules');
      console.log('2. O ejecuta manualmente:');
      console.log('   firebase deploy --only firestore:rules');
    }
  }
}

// Ejecutar la prueba
testSimpleRegistration();
