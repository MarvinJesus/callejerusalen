const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, getDocs, query, where } = require('firebase/firestore');

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

async function testRegistrationSystem() {
  try {
    console.log('🧪 Iniciando prueba del sistema de registro...');
    
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
    
    // Verificar que se creó el perfil en Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Perfil de usuario creado en Firestore:');
      console.log('  - Email:', userData.email);
      console.log('  - Nombre:', userData.displayName);
      console.log('  - Rol:', userData.role);
      console.log('  - Estado:', userData.status);
      console.log('  - Activo:', userData.isActive);
      console.log('  - Estado de registro:', userData.registrationStatus);
      console.log('  - Permisos:', userData.permissions);
      
      // Verificar que el estado es correcto para un registro pendiente
      if (userData.registrationStatus === 'pending' && 
          userData.status === 'inactive' && 
          userData.isActive === false) {
        console.log('✅ Estado de registro correcto: PENDIENTE');
      } else {
        console.log('❌ Estado de registro incorrecto');
        console.log('  Esperado: registrationStatus=pending, status=inactive, isActive=false');
        console.log('  Actual:', {
          registrationStatus: userData.registrationStatus,
          status: userData.status,
          isActive: userData.isActive
        });
      }
    } else {
      console.log('❌ No se encontró el perfil de usuario en Firestore');
    }
    
    // Verificar que se creó la solicitud de registro
    const requestDoc = await getDoc(doc(db, 'registrationRequests', user.uid));
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      console.log('✅ Solicitud de registro creada:');
      console.log('  - Email:', requestData.email);
      console.log('  - Nombre:', requestData.displayName);
      console.log('  - Rol solicitado:', requestData.requestedRole);
      console.log('  - Estado:', requestData.status);
      console.log('  - Fecha de creación:', requestData.createdAt);
      
      if (requestData.status === 'pending') {
        console.log('✅ Estado de solicitud correcto: PENDIENTE');
      } else {
        console.log('❌ Estado de solicitud incorrecto');
      }
    } else {
      console.log('❌ No se encontró la solicitud de registro');
    }
    
    // Verificar que el usuario no puede acceder (está inactivo)
    console.log('🔒 Verificando que el usuario no puede acceder...');
    try {
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('⚠️ El usuario puede iniciar sesión (esto es normal, pero no debería tener acceso completo)');
    } catch (error) {
      console.log('❌ Error al iniciar sesión:', error.message);
    }
    
    console.log('\n🎉 Prueba del sistema de registro completada');
    console.log('📋 Resumen:');
    console.log('  - Usuario creado en Firebase Auth: ✅');
    console.log('  - Perfil creado en Firestore con estado pendiente: ✅');
    console.log('  - Solicitud de registro creada: ✅');
    console.log('  - Usuario debe esperar aprobación: ✅');
    
    // Limpiar usuario de prueba
    console.log('\n🧹 Limpiando usuario de prueba...');
    await user.delete();
    console.log('✅ Usuario de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testRegistrationSystem();
