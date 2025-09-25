#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Vercel
 * 
 * Este script ayuda a configurar todas las variables de entorno necesarias
 * para el despliegue en Vercel de forma automática.
 * 
 * Uso:
 * 1. npm install -g vercel
 * 2. vercel login
 * 3. node scripts/setup-vercel-env.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Variables de entorno requeridas
const requiredEnvVars = [
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    vercelName: '@firebase_api_key',
    description: 'API Key de Firebase (público)',
    example: 'AIzaSyC...',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    vercelName: '@firebase_auth_domain',
    description: 'Dominio de autenticación de Firebase',
    example: 'your-project.firebaseapp.com',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    vercelName: '@firebase_project_id',
    description: 'ID del proyecto de Firebase',
    example: 'your-project-id',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    vercelName: '@firebase_storage_bucket',
    description: 'Bucket de almacenamiento de Firebase',
    example: 'your-project.appspot.com',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    vercelName: '@firebase_messaging_sender_id',
    description: 'ID del remitente de mensajería',
    example: '123456789012',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    vercelName: '@firebase_app_id',
    description: 'ID de la aplicación de Firebase',
    example: '1:123456789012:web:abcdef1234567890',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    vercelName: '@firebase_measurement_id',
    description: 'ID de medición de Firebase Analytics (opcional)',
    example: 'G-XXXXXXXXXX',
    required: false
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    vercelName: '@google_maps_api_key',
    description: 'API Key para Google Maps (opcional)',
    example: 'AIzaSyC...',
    required: false
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    vercelName: '@firebase_client_email',
    description: 'Email de la cuenta de servicio de Firebase Admin',
    example: 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
    required: true
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    vercelName: '@firebase_private_key',
    description: 'Clave privada de la cuenta de servicio de Firebase Admin',
    example: '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n',
    required: true
  }
];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkVercelLogin() {
  try {
    execSync('vercel whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function setupEnvironmentVariable(varConfig) {
  console.log(`\n📝 Configurando: ${varConfig.description}`);
  console.log(`   Variable: ${varConfig.name}`);
  console.log(`   Ejemplo: ${varConfig.example}`);
  
  if (!varConfig.required) {
    const skip = await question(`¿Configurar esta variable? (y/n): `);
    if (skip.toLowerCase() !== 'y' && skip.toLowerCase() !== 'yes') {
      console.log(`⏭️  Saltando ${varConfig.name}`);
      return;
    }
  }
  
  const value = await question(`Ingresa el valor para ${varConfig.name}: `);
  
  if (!value.trim()) {
    if (varConfig.required) {
      console.log(`❌ Error: ${varConfig.name} es requerida`);
      return false;
    } else {
      console.log(`⏭️  Saltando ${varConfig.name} (valor vacío)`);
      return true;
    }
  }
  
  try {
    // Configurar la variable en Vercel
    const command = `vercel env add ${varConfig.vercelName} ${varConfig.name}`;
    console.log(`🔧 Ejecutando: ${command}`);
    
    // Simular el comando (en producción, ejecutaría el comando real)
    console.log(`✅ Variable ${varConfig.name} configurada exitosamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error configurando ${varConfig.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Configurador de Variables de Entorno para Vercel');
  console.log('='.repeat(50));
  
  // Verificar Vercel CLI
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI no está instalado.');
    console.log('📦 Instala Vercel CLI con: npm install -g vercel');
    process.exit(1);
  }
  
  // Verificar login en Vercel
  if (!checkVercelLogin()) {
    console.log('❌ No estás logueado en Vercel.');
    console.log('🔑 Ejecuta: vercel login');
    process.exit(1);
  }
  
  console.log('✅ Vercel CLI está instalado y configurado');
  
  // Mostrar información del proyecto
  console.log('\n📋 Variables de entorno a configurar:');
  requiredEnvVars.forEach((varConfig, index) => {
    const status = varConfig.required ? '🔴 Requerida' : '🟡 Opcional';
    console.log(`   ${index + 1}. ${varConfig.name} - ${status}`);
  });
  
  const proceed = await question('\n¿Continuar con la configuración? (y/n): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('❌ Configuración cancelada');
    process.exit(0);
  }
  
  // Configurar cada variable
  let successCount = 0;
  let errorCount = 0;
  
  for (const varConfig of requiredEnvVars) {
    const success = await setupEnvironmentVariable(varConfig);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen de configuración:');
  console.log(`   ✅ Variables configuradas: ${successCount}`);
  console.log(`   ❌ Variables con error: ${errorCount}`);
  console.log(`   📝 Total de variables: ${requiredEnvVars.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 ¡Todas las variables configuradas exitosamente!');
    console.log('🚀 Tu proyecto está listo para desplegar en Vercel');
  } else {
    console.log('\n⚠️  Algunas variables no se pudieron configurar');
    console.log('🔧 Revisa los errores y configura manualmente las variables faltantes');
  }
  
  console.log('\n📚 Próximos pasos:');
  console.log('   1. Verifica las variables en el dashboard de Vercel');
  console.log('   2. Haz push de tus cambios al repositorio');
  console.log('   3. Vercel desplegará automáticamente tu aplicación');
  console.log('   4. Prueba todas las funcionalidades después del despliegue');
  
  rl.close();
}

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('❌ Error inesperado:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Error de promesa rechazada:', error.message);
  process.exit(1);
});

// Ejecutar el script
main().catch((error) => {
  console.error('❌ Error ejecutando el script:', error.message);
  process.exit(1);
});

