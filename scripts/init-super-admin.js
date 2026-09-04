const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Configuración de Firebase (usar las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function createSuperAdmin() {
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Credenciales del super administrador
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'mar90jesus@gmail.com';
    const superAdminPassword = 'Admin123!@#';
    const superAdminName = 'Super Administrador';

    console.log('🔧 Inicializando super administrador...');

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      superAdminEmail, 
      superAdminPassword
    );
    
    const user = userCredential.user;
    console.log('✅ Usuario creado en Firebase Auth:', user.uid);

    // Crear perfil en Firestore
    const userProfile = {
      uid: user.uid,
      email: superAdminEmail,
      displayName: superAdminName,
      role: 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: [
        'manage_users',
        'manage_roles',
        'view_analytics',
        'manage_security',
        'system_settings',
        'access_admin_panel'
      ]
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('✅ Perfil de super administrador creado en Firestore');

    console.log('\n🎉 Super administrador creado exitosamente!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Contraseña:', superAdminPassword);
    console.log('👑 Rol: super_admin');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión!');

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  El super administrador ya existe');
    } else {
      console.error('❌ Error al crear super administrador:', error);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createSuperAdmin();
}

module.exports = { createSuperAdmin };

