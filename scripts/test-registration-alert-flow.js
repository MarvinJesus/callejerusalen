#!/usr/bin/env node

/**
 * Script de prueba para verificar el flujo de alertas de registro pendiente
 * 
 * Este script:
 * 1. Crea un usuario de prueba con registro pendiente
 * 2. Verifica el estado en Firestore
 * 3. Proporciona instrucciones para probar en el navegador
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Inicializar Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  console.error('❌ Error: No se encontró el archivo firebase-service-account.json');
  console.error('   Por favor, asegúrate de tener el archivo en la raíz del proyecto.');
  process.exit(1);
}

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Crear interfaz para input del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createTestUser() {
  console.log('\n🧪 ====================================');
  console.log('   TEST DE ALERTA DE REGISTRO PENDIENTE');
  console.log('   ====================================\n');

  // Solicitar datos del usuario de prueba
  const email = await question('📧 Email del usuario de prueba (ej: test@example.com): ');
  const password = await question('🔑 Contraseña (mínimo 6 caracteres): ');
  const displayName = await question('👤 Nombre completo: ');

  if (password.length < 6) {
    console.error('\n❌ Error: La contraseña debe tener al menos 6 caracteres');
    rl.close();
    return;
  }

  console.log('\n⏳ Creando usuario de prueba...\n');

  try {
    // 1. Crear usuario en Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    console.log('✅ Usuario creado en Firebase Authentication');
    console.log(`   UID: ${userRecord.uid}`);

    // 2. Crear perfil en Firestore con registrationStatus: 'pending'
    const userProfile = {
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'comunidad',
      status: 'active',
      isActive: true,
      registrationStatus: 'pending', // ⭐ Estado pendiente
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      permissions: []
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    console.log('✅ Perfil creado en Firestore con registrationStatus: "pending"\n');

    // 3. Mostrar instrucciones de prueba
    console.log('🎉 ====================================');
    console.log('   USUARIO DE PRUEBA CREADO');
    console.log('   ====================================\n');
    console.log('📋 Credenciales del usuario de prueba:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID:      ${userRecord.uid}\n`);

    console.log('🧪 PRUEBAS A REALIZAR:\n');
    console.log('═══════════════════════════════════════\n');

    console.log('📝 PRUEBA 1: Iniciar sesión con registro pendiente');
    console.log('   1. Ir a http://localhost:3000/login');
    console.log('   2. Ingresar las credenciales del usuario de prueba');
    console.log('   3. Click en "Iniciar Sesión"');
    console.log('   4. VERIFICAR:');
    console.log('      ✓ Toast verde: "Inicio de sesión exitoso..."');
    console.log('      ✓ Redirección a la página principal');
    console.log('      ✓ Alerta global AMARILLA en la parte superior');
    console.log('      ✓ Mensaje: "Solicitud de Registro Pendiente"\n');

    console.log('📝 PRUEBA 2: Persistencia de la alerta');
    console.log('   1. Navegar a diferentes páginas:');
    console.log('      - /visitantes');
    console.log('      - /mapa');
    console.log('      - /visitantes/lugares');
    console.log('   2. VERIFICAR:');
    console.log('      ✓ La alerta amarilla aparece en TODAS las páginas');
    console.log('      ✓ La alerta no se puede cerrar manualmente');
    console.log('      ✓ El contenido no está oculto detrás de la alerta\n');

    console.log('📝 PRUEBA 3: Aprobar el registro');
    console.log('   1. Iniciar sesión como super admin');
    console.log('   2. Ir a http://localhost:3000/admin/super-admin/users');
    console.log('   3. Buscar el usuario de prueba');
    console.log('   4. Aprobar el registro');
    console.log('   5. Como usuario de prueba, recargar la página');
    console.log('   6. VERIFICAR:');
    console.log('      ✓ La alerta amarilla desaparece');
    console.log('      ✓ El usuario tiene acceso completo\n');

    console.log('═══════════════════════════════════════\n');

    const shouldApprove = await question('¿Deseas aprobar automáticamente este usuario ahora? (s/n): ');
    
    if (shouldApprove.toLowerCase() === 's' || shouldApprove.toLowerCase() === 'si') {
      await db.collection('users').doc(userRecord.uid).update({
        registrationStatus: 'approved',
        approvedBy: 'system',
        approvedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
      });
      console.log('\n✅ Usuario aprobado automáticamente');
      console.log('   El usuario ahora tiene acceso completo al sistema\n');
    }

    const shouldDelete = await question('\n¿Deseas eliminar este usuario de prueba? (s/n): ');
    
    if (shouldDelete.toLowerCase() === 's' || shouldDelete.toLowerCase() === 'si') {
      await auth.deleteUser(userRecord.uid);
      await db.collection('users').doc(userRecord.uid).delete();
      console.log('\n✅ Usuario de prueba eliminado\n');
    } else {
      console.log('\n⚠️  Recuerda eliminar el usuario de prueba cuando termines:\n');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${email}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error al crear usuario de prueba:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('\n⚠️  Ya existe un usuario con este email.');
      console.error('   ¿Deseas usar este email para probar?');
      
      const shouldContinue = await question('\n¿Continuar buscando el usuario existente? (s/n): ');
      
      if (shouldContinue.toLowerCase() === 's' || shouldContinue.toLowerCase() === 'si') {
        try {
          const userRecord = await auth.getUserByEmail(email);
          const userDoc = await db.collection('users').doc(userRecord.uid).get();
          const userData = userDoc.data();
          
          console.log('\n📋 Estado actual del usuario:');
          console.log(`   UID: ${userRecord.uid}`);
          console.log(`   Email: ${email}`);
          console.log(`   Registration Status: ${userData?.registrationStatus || 'no establecido'}`);
          console.log(`   Role: ${userData?.role || 'no establecido'}\n`);

          const shouldUpdate = await question('¿Deseas cambiar el estado a "pending" para probar? (s/n): ');
          
          if (shouldUpdate.toLowerCase() === 's' || shouldUpdate.toLowerCase() === 'si') {
            await db.collection('users').doc(userRecord.uid).update({
              registrationStatus: 'pending',
              updatedAt: admin.firestore.Timestamp.now()
            });
            console.log('\n✅ Estado actualizado a "pending"');
            console.log('   Ahora puedes probar el flujo de alerta\n');
          }
        } catch (searchError) {
          console.error('\n❌ Error al buscar usuario:', searchError.message);
        }
      }
    }
  } finally {
    rl.close();
  }
}

// Ejecutar el script
createTestUser()
  .then(() => {
    console.log('✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });

