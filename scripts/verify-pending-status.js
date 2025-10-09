#!/usr/bin/env node

/**
 * Script de Verificación: Estado Pending en Registro
 * 
 * Este script verifica que los usuarios se registren con status='pending'
 * y no con 'inactive'.
 * 
 * Uso:
 *   node scripts/verify-pending-status.js
 */

const admin = require('firebase-admin');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Inicializar Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../firebase-service-account.json');
} catch (error) {
  try {
    serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
  } catch (error2) {
    console.error(`${colors.red}❌ Error: No se encontró el archivo de credenciales de Firebase${colors.reset}`);
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyPendingUsers() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${colors.bright}${colors.cyan}🔍 VERIFICACIÓN DE ESTADO PENDING${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`${colors.yellow}Este script verifica que:${colors.reset}`);
  console.log(`  1. Los usuarios nuevos se registren con status='pending'`);
  console.log(`  2. El campo registrationStatus también sea 'pending'`);
  console.log(`  3. isActive sea false hasta aprobación\n`);

  console.log(`${'─'.repeat(70)}\n`);

  // Obtener usuarios con registrationStatus='pending'
  console.log(`${colors.cyan}📋 Buscando usuarios con registrationStatus='pending'...${colors.reset}\n`);

  const usersSnapshot = await db.collection('users')
    .where('registrationStatus', '==', 'pending')
    .get();

  console.log(`${colors.green}✅ Encontrados ${usersSnapshot.size} usuarios con registrationStatus='pending'${colors.reset}\n`);

  if (usersSnapshot.empty) {
    console.log(`${colors.yellow}ℹ️  No hay usuarios pendientes en este momento.${colors.reset}`);
    console.log(`${colors.yellow}   Puedes crear uno en: http://localhost:3000/register${colors.reset}\n`);
  } else {
    console.log(`${colors.cyan}📊 Detalles de usuarios pendientes:${colors.reset}\n`);
    
    let correctCount = 0;
    let incorrectCount = 0;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const isCorrect = data.status === 'pending' && data.isActive === false;
      
      if (isCorrect) {
        correctCount++;
        console.log(`${colors.green}✅${colors.reset} ${data.email}`);
        console.log(`   ${colors.bright}Status:${colors.reset} ${colors.green}${data.status}${colors.reset} (correcto)`);
        console.log(`   ${colors.bright}isActive:${colors.reset} ${data.isActive === false ? colors.green + 'false' : colors.red + 'true'}${colors.reset}`);
        console.log(`   ${colors.bright}registrationStatus:${colors.reset} ${data.registrationStatus}`);
        console.log(`   ${colors.bright}Creado:${colors.reset} ${new Date(data.createdAt._seconds * 1000).toLocaleString()}\n`);
      } else {
        incorrectCount++;
        console.log(`${colors.red}❌${colors.reset} ${data.email}`);
        console.log(`   ${colors.bright}Status:${colors.reset} ${data.status === 'pending' ? colors.green : colors.red}${data.status}${colors.reset} ${data.status !== 'pending' ? '(debería ser pending)' : ''}`);
        console.log(`   ${colors.bright}isActive:${colors.reset} ${data.isActive === false ? colors.green : colors.red}${data.isActive}${colors.reset} ${data.isActive !== false ? '(debería ser false)' : ''}`);
        console.log(`   ${colors.bright}registrationStatus:${colors.reset} ${data.registrationStatus}`);
        console.log(`   ${colors.bright}Creado:${colors.reset} ${new Date(data.createdAt._seconds * 1000).toLocaleString()}\n`);
      }
    });

    console.log(`${'─'.repeat(70)}\n`);
    console.log(`${colors.bright}📊 RESUMEN:${colors.reset}`);
    console.log(`   Total: ${usersSnapshot.size}`);
    console.log(`   ${colors.green}✅ Correctos: ${correctCount}${colors.reset}`);
    console.log(`   ${colors.red}❌ Incorrectos: ${incorrectCount}${colors.reset}\n`);

    if (incorrectCount > 0) {
      console.log(`${colors.red}⚠️  HAY USUARIOS CON ESTADO INCORRECTO${colors.reset}`);
      console.log(`${colors.yellow}   Estos usuarios se registraron antes de la corrección.${colors.reset}\n`);
    }
  }

  console.log(`${'='.repeat(70)}`);
  console.log(`${colors.bright}${colors.cyan}🧪 PRUEBA MANUAL RECOMENDADA${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`${colors.yellow}Para verificar que la corrección funciona:${colors.reset}\n`);

  console.log(`${colors.cyan}1.${colors.reset} Ve a: ${colors.bright}http://localhost:3000/register${colors.reset}\n`);

  console.log(`${colors.cyan}2.${colors.reset} Registra un nuevo usuario de prueba:`);
  console.log(`   Email: test-pending@ejemplo.com`);
  console.log(`   Nombre: Usuario Prueba Pending`);
  console.log(`   Contraseña: test123456\n`);

  console.log(`${colors.cyan}3.${colors.reset} Después de registrarte, ejecuta este script nuevamente:\n`);
  console.log(`   ${colors.bright}node scripts/verify-pending-status.js${colors.reset}\n`);

  console.log(`${colors.cyan}4.${colors.reset} Verifica que el nuevo usuario tenga:\n`);
  console.log(`   ${colors.green}✅${colors.reset} status: 'pending'`);
  console.log(`   ${colors.green}✅${colors.reset} isActive: false`);
  console.log(`   ${colors.green}✅${colors.reset} registrationStatus: 'pending'\n`);

  console.log(`${colors.cyan}5.${colors.reset} Intenta hacer login con ese usuario:\n`);
  console.log(`   ${colors.green}✅${colors.reset} Debe permitir el login`);
  console.log(`   ${colors.green}✅${colors.reset} Debe mostrar banner amarillo de 15 segundos`);
  console.log(`   ${colors.green}✅${colors.reset} Mensaje: "⏳ Cuenta Pendiente de Aprobación..."\n`);

  console.log(`${'='.repeat(70)}`);
  console.log(`${colors.bright}${colors.green}✅ LO QUE DEBERÍA PASAR:${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`${colors.green}ANTES (incorrecto):${colors.reset}`);
  console.log(`  Usuario se registra → status='inactive' ❌`);
  console.log(`  Usuario intenta login → Rechazado ❌\n`);

  console.log(`${colors.green}AHORA (correcto):${colors.reset}`);
  console.log(`  Usuario se registra → status='pending' ✅`);
  console.log(`  Usuario intenta login → Permitido ✅`);
  console.log(`  Banner amarillo aparece → 15 segundos ✅`);
  console.log(`  Usuario puede navegar con acceso limitado ✅\n`);

  console.log(`${'='.repeat(70)}`);
  console.log(`${colors.bright}${colors.cyan}📝 LOGS A BUSCAR EN CONSOLA DEL NAVEGADOR${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`${colors.yellow}Durante el registro:${colors.reset}`);
  console.log(`  ${colors.cyan}"📝 Iniciando proceso de registro..."${colors.reset}`);
  console.log(`  ${colors.cyan}"✅ Usuario registrado exitosamente"${colors.reset}`);
  console.log(`  ${colors.cyan}"🚪 Cerrando sesión para redirigir al login..."${colors.reset}\n`);

  console.log(`${colors.yellow}Durante el login:${colors.reset}`);
  console.log(`  ${colors.cyan}"⏳ Usuario con registro PENDING detectado"${colors.reset}`);
  console.log(`  ${colors.cyan}"✅ Login permitido para usuario con status: pending"${colors.reset}`);
  console.log(`  ${colors.cyan}"✅ Banner amarillo mostrado para usuario pending"${colors.reset}\n`);

  console.log(`${colors.yellow}En AuthContext:${colors.reset}`);
  console.log(`  ${colors.cyan}"⏳ Usuario con status PENDING - Sesión permitida: [email]"${colors.reset}\n`);

  console.log(`${'='.repeat(70)}\n`);
  console.log(`${colors.bright}${colors.green}✅ Verificación completada${colors.reset}\n`);
}

// Ejecutar
verifyPendingUsers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  });

