const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

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

async function updateUserToSuperAdmin() {
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Email del usuario a actualizar
    const userEmail = 'mar90jesus@gmail.com';
    const userPassword = 'Admin123!@#'; // Usar la contraseña actual del usuario

    console.log('🔧 Actualizando usuario a super administrador...');
    console.log('📧 Email:', userEmail);

    // Iniciar sesión para obtener el UID del usuario
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
    const user = userCredential.user;
    
    console.log('✅ Usuario autenticado:', user.uid);

    // Verificar si ya existe el perfil en Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Usuario ya existe, actualizar rol
      const currentData = userDoc.data();
      console.log('📋 Datos actuales:', {
        email: currentData.email,
        displayName: currentData.displayName,
        role: currentData.role,
        isActive: currentData.isActive
      });

      // Actualizar a super administrador
      await setDoc(userDocRef, {
        role: 'super_admin',
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
      }, { merge: true });

      console.log('✅ Usuario actualizado a super administrador');
    } else {
      // Usuario no existe en Firestore, crear perfil completo
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Super Administrador',
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
        ],
        registrationStatus: 'approved',
        approvedBy: 'system',
        approvedAt: new Date()
      };

      await setDoc(userDocRef, userProfile);
      console.log('✅ Perfil de super administrador creado en Firestore');
    }

    console.log('\n🎉 Usuario actualizado exitosamente!');
    console.log('📧 Email:', userEmail);
    console.log('👑 Rol: super_admin');
    console.log('🔑 UID:', user.uid);
    console.log('\n✅ Ahora puedes acceder al panel de administración en /admin');

    // Cerrar sesión
    await auth.signOut();

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 El usuario no existe en Firebase Authentication');
      console.log('   Ejecuta: npm run init-admin');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Contraseña incorrecta');
      console.log('   Verifica que la contraseña sea correcta');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Email inválido');
      console.log('   Verifica que el email sea correcto');
    } else {
      console.log('💡 Error inesperado:', error.message);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  updateUserToSuperAdmin();
}

module.exports = { updateUserToSuperAdmin };
