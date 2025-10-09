const fs = require('fs');
const path = require('path');

function checkFirebaseAdmin() {
  console.log('🔍 Verificando configuración de Firebase Admin...');
  
  // Verificar archivo JSON
  const jsonPath = path.join(process.cwd(), 'callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
  console.log('📁 Buscando archivo JSON en:', jsonPath);
  
  if (fs.existsSync(jsonPath)) {
    console.log('✅ Archivo JSON encontrado');
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('📋 Configuración del archivo JSON:');
      console.log('  - Project ID:', serviceAccount.project_id);
      console.log('  - Client Email:', serviceAccount.client_email);
      console.log('  - Private Key ID:', serviceAccount.private_key_id);
    } catch (error) {
      console.error('❌ Error al leer archivo JSON:', error.message);
    }
  } else {
    console.log('❌ Archivo JSON no encontrado');
  }
  
  // Verificar variables de entorno
  console.log('\n🔧 Verificando variables de entorno:');
  const envVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_CLIENT_ID'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: No configurado`);
    }
  });
  
  // Verificar variables públicas de Firebase
  console.log('\n🌐 Verificando variables públicas de Firebase:');
  const publicVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  publicVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: No configurado`);
    }
  });
  
  console.log('\n📝 Recomendaciones:');
  if (!fs.existsSync(jsonPath) && !process.env.FIREBASE_PROJECT_ID) {
    console.log('1. Configura las variables de entorno de Firebase Admin');
    console.log('2. O coloca el archivo JSON de service account en la raíz del proyecto');
    console.log('3. Ejecuta: npm run init-admin para configurar Firebase Admin');
  }
}

checkFirebaseAdmin();
