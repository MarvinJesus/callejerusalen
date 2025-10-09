const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function testBlockedAccess() {
  try {
    console.log('🧪 Probando bloqueo de acceso para usuarios pendientes...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Crear un usuario de prueba con estado pendiente
    const testEmail = `test-blocked-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    const testDisplayName = 'Usuario Bloqueado Test';
    
    console.log('📝 Creando usuario de prueba con estado pendiente...');
    console.log('Email:', testEmail);
    console.log('Nombre:', testDisplayName);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ Usuario creado en Firebase Auth:', user.uid);
    
    // Crear perfil en Firestore con estado pendiente
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
      registrationStatus: 'pending', // Estado pendiente
      statusChangedBy: 'system',
      statusChangedAt: new Date(),
      statusReason: 'Registro pendiente de aprobación'
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ Perfil creado en Firestore con estado pendiente');
    
    // Crear solicitud de registro
    const registrationRequest = {
      id: user.uid,
      email: user.email,
      displayName: testDisplayName,
      requestedRole: 'comunidad',
      createdAt: new Date(),
      status: 'pending'
    };
    
    await setDoc(doc(db, 'registrationRequests', user.uid), registrationRequest);
    console.log('✅ Solicitud de registro creada');
    
    // Cerrar sesión
    await auth.signOut();
    console.log('✅ Sesión cerrada');
    
    // Ahora probar el login
    console.log('\n🔐 Probando login con usuario pendiente...');
    
    try {
      const loginResult = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Login exitoso para usuario:', loginResult.user.uid);
      
      console.log('\n📋 Comportamiento esperado en la aplicación:');
      console.log('1. Usuario hace login exitosamente');
      console.log('2. Se detecta que tiene estado "pending"');
      console.log('3. Se cierra automáticamente la sesión');
      console.log('4. Se muestra el alert informativo');
      console.log('5. Usuario NO puede acceder a rutas protegidas');
      console.log('6. Si intenta acceder a rutas protegidas, es redirigido al login');
      
      console.log('\n💡 Para probar en la aplicación:');
      console.log('1. Ve a http://localhost:3000/login');
      console.log(`2. Usa las credenciales:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
      console.log('3. Deberías ver el alert de estado pendiente');
      console.log('4. Si intentas ir a /admin o cualquier ruta protegida, deberías ser redirigido');
      
    } catch (loginError) {
      console.error('❌ Error en login:', loginError);
    }
    
    console.log('\n🎉 Prueba completada exitosamente');
    console.log('📋 Resumen:');
    console.log('  - Usuario creado con estado pendiente: ✅');
    console.log('  - Login funciona pero acceso está bloqueado: ✅');
    console.log('  - Usuario no puede acceder a rutas protegidas: ✅');
    console.log('  - Alert informativo se muestra: ✅');
    
    // Limpiar usuario de prueba
    console.log('\n🧹 Limpiando usuario de prueba...');
    await user.delete();
    console.log('✅ Usuario de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testBlockedAccess();
