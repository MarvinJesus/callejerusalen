#!/usr/bin/env node

/**
 * Script para configurar Firebase Admin usando archivo JSON
 * Ejecutar con: node scripts/setup-firebase-admin.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupFirebaseAdmin() {
  console.log('🔧 Configuración de Firebase Admin');
  console.log('=====================================\n');

  try {
    // Preguntar por la ruta del archivo JSON
    const jsonPath = await question('📁 Ruta del archivo JSON de credenciales de Firebase Admin: ');
    
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ Error: El archivo no existe en la ruta especificada');
      process.exit(1);
    }

    // Leer el archivo JSON
    const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Verificar que el archivo tenga la estructura correcta
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('❌ Error: El archivo JSON no tiene la estructura correcta de Firebase Admin');
      process.exit(1);
    }

    // Crear el archivo de credenciales en el proyecto
    const credentialsPath = path.join(process.cwd(), 'firebase-service-account.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(serviceAccount, null, 2));

    console.log('✅ Archivo de credenciales creado:', credentialsPath);

    // Actualizar el archivo .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Variables de Firebase Admin
    const firebaseAdminVars = `
# Firebase Admin SDK (configurado automáticamente)
FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\n/g, '\\n')}"
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_CLIENT_ID=${serviceAccount.client_id}
`;

    // Agregar las variables si no existen
    if (!envContent.includes('FIREBASE_PROJECT_ID')) {
      envContent += firebaseAdminVars;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Variables de entorno actualizadas en .env.local');
    } else {
      console.log('ℹ️  Las variables de Firebase Admin ya existen en .env.local');
    }

    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('📋 Resumen:');
    console.log(`   - Proyecto: ${serviceAccount.project_id}`);
    console.log(`   - Email: ${serviceAccount.client_email}`);
    console.log(`   - Archivo de credenciales: ${credentialsPath}`);
    console.log('\n🚀 Ahora puedes ejecutar: npm run init-permissions');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupFirebaseAdmin();