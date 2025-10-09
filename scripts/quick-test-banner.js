#!/usr/bin/env node

/**
 * Script de Prueba Rápida del Banner de Bloqueo
 * 
 * Este script te ayuda a probar rápidamente si el banner amarillo
 * aparece correctamente cuando un usuario bloqueado intenta iniciar sesión.
 * 
 * Uso:
 *   node scripts/quick-test-banner.js
 */

const readline = require('readline');
const admin = require('firebase-admin');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Inicializar Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  try {
    serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
  } catch (error2) {
    console.error(`${colors.red}❌ Error: No se encontró el archivo de credenciales de Firebase${colors.reset}`);
    console.error('Busca un archivo .json en la raíz del proyecto');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function findUsers() {
  console.log(`\n${colors.cyan}🔍 Buscando usuarios en Firestore...${colors.reset}`);
  
  const usersSnapshot = await db.collection('users').get();
  const users = [];
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      email: data.email,
      displayName: data.displayName,
      status: data.status || (data.isActive ? 'active' : 'inactive'),
      isActive: data.isActive,
      role: data.role
    });
  });
  
  console.log(`${colors.green}✅ Encontrados ${users.length} usuarios${colors.reset}\n`);
  return users;
}

async function showMenu() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.bright}${colors.yellow}🧪 PRUEBA RÁPIDA - BANNER DE BLOQUEO${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`${colors.cyan}Este script te permite:${colors.reset}`);
  console.log(`  1. Desactivar temporalmente un usuario`);
  console.log(`  2. Probar el login en el navegador`);
  console.log(`  3. Reactivar el usuario cuando termines\n`);
  
  console.log(`${colors.yellow}⚠️  IMPORTANTE:${colors.reset}`);
  console.log(`  - Asegúrate de tener el servidor corriendo: npm run dev`);
  console.log(`  - Ve a http://localhost:3000/login en tu navegador`);
  console.log(`  - Abre la consola del navegador (F12)\n`);
}

async function selectUser(users) {
  console.log(`${colors.cyan}📋 Usuarios disponibles:${colors.reset}\n`);
  
  users.forEach((user, index) => {
    const statusIcon = user.status === 'active' ? '✅' : '❌';
    const statusText = user.status === 'active' ? 'Activo' : user.status;
    console.log(`  ${index + 1}. ${statusIcon} ${user.email}`);
    console.log(`     ${colors.bright}${user.displayName}${colors.reset} | ${statusText} | ${user.role}`);
  });
  
  console.log('');
  const answer = await question(`${colors.cyan}Selecciona un usuario (1-${users.length}) o 'q' para salir: ${colors.reset}`);
  
  if (answer.toLowerCase() === 'q') {
    console.log(`${colors.yellow}👋 Saliendo...${colors.reset}`);
    rl.close();
    process.exit(0);
  }
  
  const index = parseInt(answer) - 1;
  if (index >= 0 && index < users.length) {
    return users[index];
  }
  
  console.log(`${colors.red}❌ Selección inválida${colors.reset}`);
  return await selectUser(users);
}

async function deactivateUser(user) {
  console.log(`\n${colors.yellow}⚙️  Desactivando usuario...${colors.reset}`);
  
  await db.collection('users').doc(user.id).update({
    status: 'inactive',
    isActive: false,
    statusChangedAt: admin.firestore.FieldValue.serverTimestamp(),
    statusChangedBy: 'test-script',
    statusReason: 'Prueba temporal del banner de bloqueo'
  });
  
  console.log(`${colors.green}✅ Usuario desactivado temporalmente${colors.reset}`);
}

async function reactivateUser(user) {
  console.log(`\n${colors.yellow}⚙️  Reactivando usuario...${colors.reset}`);
  
  await db.collection('users').doc(user.id).update({
    status: 'active',
    isActive: true,
    statusChangedAt: admin.firestore.FieldValue.serverTimestamp(),
    statusChangedBy: 'test-script',
    statusReason: 'Prueba completada, usuario reactivado'
  });
  
  console.log(`${colors.green}✅ Usuario reactivado${colors.reset}`);
}

async function main() {
  await showMenu();
  
  const users = await findUsers();
  if (users.length === 0) {
    console.log(`${colors.red}❌ No hay usuarios en la base de datos${colors.reset}`);
    rl.close();
    return;
  }
  
  const selectedUser = await selectUser(users);
  
  console.log(`\n${colors.bright}${colors.green}✅ Usuario seleccionado:${colors.reset}`);
  console.log(`   Email: ${selectedUser.email}`);
  console.log(`   Nombre: ${selectedUser.displayName}`);
  console.log(`   Estado actual: ${selectedUser.status}\n`);
  
  // Desactivar usuario
  await deactivateUser(selectedUser);
  
  // Instrucciones
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.bright}${colors.cyan}📝 INSTRUCCIONES PARA PROBAR:${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`${colors.yellow}1.${colors.reset} Abre tu navegador en: ${colors.cyan}http://localhost:3000/login${colors.reset}`);
  console.log(`${colors.yellow}2.${colors.reset} Abre la consola del navegador: ${colors.cyan}F12 → Console${colors.reset}`);
  console.log(`${colors.yellow}3.${colors.reset} Intenta iniciar sesión con:`);
  console.log(`   ${colors.bright}Email:${colors.reset} ${selectedUser.email}`);
  console.log(`   ${colors.bright}Password:${colors.reset} (la contraseña del usuario)`);
  console.log(`\n${colors.yellow}4.${colors.reset} ${colors.bright}${colors.green}VERIFICA QUE APAREZCA:${colors.reset}`);
  console.log(`   ${colors.green}✅${colors.reset} Banner amarillo en la parte superior`);
  console.log(`   ${colors.green}✅${colors.reset} Icono de advertencia (⚠️)`);
  console.log(`   ${colors.green}✅${colors.reset} Mensaje: "🚫 Acceso Denegado: Esta cuenta ha sido desactivada..."`);
  console.log(`   ${colors.green}✅${colors.reset} Botón X para cerrar`);
  console.log(`   ${colors.green}✅${colors.reset} Barra de progreso moviéndose`);
  console.log(`   ${colors.green}✅${colors.reset} Banner visible durante 10 segundos`);
  
  console.log(`\n${colors.yellow}5.${colors.reset} ${colors.bright}EN LA CONSOLA DEL NAVEGADOR BUSCA:${colors.reset}`);
  console.log(`   ${colors.cyan}"🚨 USUARIO BLOQUEADO DETECTADO"${colors.reset}`);
  console.log(`   ${colors.cyan}"⚡ Llamando a showAlert AHORA..."${colors.reset}`);
  console.log(`   ${colors.cyan}"✅ showAlert ejecutado"${colors.reset}`);
  console.log(`   ${colors.cyan}"➕ Mostrando alerta:"${colors.reset}`);
  
  console.log(`\n${'='.repeat(60)}\n`);
  
  // Esperar confirmación
  await question(`${colors.yellow}Presiona ENTER cuando hayas terminado de probar...${colors.reset}`);
  
  // Preguntar si quiere reactivar
  const reactivate = await question(`\n${colors.cyan}¿Reactivar el usuario? (s/n): ${colors.reset}`);
  
  if (reactivate.toLowerCase() === 's' || reactivate.toLowerCase() === 'si') {
    await reactivateUser(selectedUser);
    console.log(`\n${colors.green}✅ Usuario restaurado a su estado original${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Usuario quedó desactivado${colors.reset}`);
    console.log(`${colors.yellow}   Puedes reactivarlo manualmente desde el panel de admin${colors.reset}`);
  }
  
  console.log(`\n${colors.green}✅ Prueba completada${colors.reset}\n`);
  rl.close();
}

// Ejecutar
main().catch(error => {
  console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});

