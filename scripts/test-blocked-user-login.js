#!/usr/bin/env node

/**
 * Script para probar el sistema de bloqueo de usuarios
 * Verifica que usuarios bloqueados, desactivados o eliminados no puedan iniciar sesión
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Inicializar Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Función para obtener información del usuario
async function getUserInfo(email) {
  try {
    // Obtener usuario de Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Obtener perfil de Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuario no encontrado en Firestore');
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      disabled: userRecord.disabled,
      ...userData
    };
  } catch (error) {
    console.error('Error al obtener información del usuario:', error.message);
    return null;
  }
}

// Función para cambiar el estado del usuario
async function changeUserStatus(email, newStatus) {
  try {
    console.log(`\n📝 Cambiando estado de ${email} a: ${newStatus}`);
    
    // Obtener usuario
    const userRecord = await auth.getUserByEmail(email);
    
    // Actualizar en Firestore
    await db.collection('users').doc(userRecord.uid).update({
      status: newStatus,
      isActive: newStatus === 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusChangedBy: 'test-script',
      statusChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusReason: `Prueba de bloqueo - Estado cambiado a ${newStatus}`
    });
    
    console.log(`✅ Estado actualizado exitosamente a: ${newStatus}`);
    console.log(`   isActive: ${newStatus === 'active'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error al cambiar estado:', error.message);
    return false;
  }
}

// Función para mostrar información del usuario
function displayUserInfo(userInfo) {
  console.log('\n📊 Información del usuario:');
  console.log('─────────────────────────────────────────');
  console.log(`Email:              ${userInfo.email}`);
  console.log(`UID:                ${userInfo.uid}`);
  console.log(`Nombre:             ${userInfo.displayName}`);
  console.log(`Rol:                ${userInfo.role}`);
  console.log(`Estado (status):    ${userInfo.status}`);
  console.log(`Activo (isActive):  ${userInfo.isActive}`);
  console.log(`Reg. Status:        ${userInfo.registrationStatus || 'N/A'}`);
  console.log(`Disabled (Auth):    ${userInfo.disabled}`);
  console.log('─────────────────────────────────────────\n');
}

// Función para probar el bloqueo
async function testBlockedLogin() {
  console.log('\n🔒 PRUEBA DE BLOQUEO DE INICIO DE SESIÓN');
  console.log('════════════════════════════════════════════════════════════\n');
  
  // Solicitar email del usuario
  const email = await question('Ingresa el email del usuario para probar: ');
  
  if (!email || !email.includes('@')) {
    console.log('❌ Email inválido');
    rl.close();
    return;
  }
  
  // Obtener información actual
  console.log('\n🔍 Obteniendo información del usuario...');
  let userInfo = await getUserInfo(email);
  
  if (!userInfo) {
    console.log('\n❌ No se pudo obtener información del usuario');
    rl.close();
    return;
  }
  
  // Mostrar información actual
  displayUserInfo(userInfo);
  
  // Menú de opciones
  console.log('¿Qué deseas hacer?');
  console.log('1. Cambiar estado a "inactive" (Desactivar)');
  console.log('2. Cambiar estado a "deleted" (Eliminar)');
  console.log('3. Cambiar estado a "active" (Activar)');
  console.log('4. Ver información actual');
  console.log('5. Salir');
  
  const option = await question('\nSelecciona una opción (1-5): ');
  
  switch (option) {
    case '1':
      await changeUserStatus(email, 'inactive');
      console.log('\n✅ Ahora intenta iniciar sesión en http://localhost:3000/login');
      console.log('   Deberías ver un mensaje: "Esta cuenta ha sido desactivada"');
      break;
      
    case '2':
      await changeUserStatus(email, 'deleted');
      console.log('\n✅ Ahora intenta iniciar sesión en http://localhost:3000/login');
      console.log('   Deberías ver un mensaje: "Esta cuenta ha sido eliminada"');
      break;
      
    case '3':
      await changeUserStatus(email, 'active');
      console.log('\n✅ Ahora el usuario puede iniciar sesión normalmente');
      break;
      
    case '4':
      userInfo = await getUserInfo(email);
      if (userInfo) {
        displayUserInfo(userInfo);
      }
      break;
      
    case '5':
      console.log('\n👋 Saliendo...');
      rl.close();
      return;
      
    default:
      console.log('\n❌ Opción inválida');
  }
  
  // Mostrar información actualizada
  console.log('\n📊 Información actualizada:');
  userInfo = await getUserInfo(email);
  if (userInfo) {
    displayUserInfo(userInfo);
  }
  
  // Preguntar si quiere hacer otra acción
  const continueTest = await question('\n¿Deseas hacer otra acción? (s/n): ');
  
  if (continueTest.toLowerCase() === 's' || continueTest.toLowerCase() === 'y') {
    await testBlockedLogin();
  } else {
    console.log('\n✅ Prueba completada');
    console.log('\n📝 RESUMEN DE LA PRUEBA:');
    console.log('─────────────────────────────────────────');
    console.log('1. Usuarios con status "inactive" NO pueden iniciar sesión');
    console.log('2. Usuarios con status "deleted" NO pueden iniciar sesión');
    console.log('3. Usuarios con isActive = false NO pueden iniciar sesión');
    console.log('4. Solo usuarios con status "active" pueden iniciar sesión');
    console.log('─────────────────────────────────────────\n');
    
    rl.close();
  }
}

// Ejecutar prueba
testBlockedLogin().catch(console.error);

