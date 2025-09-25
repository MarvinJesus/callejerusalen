const fs = require('fs');
const path = require('path');

console.log('🔧 Configuración de Firebase Admin SDK');
console.log('=====================================\n');

// Verificar si existe .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ Archivo .env.local encontrado');
  
  // Leer contenido actual
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📄 Contenido actual del .env.local:');
  console.log('-----------------------------------');
  console.log(envContent);
} else {
  console.log('❌ Archivo .env.local no encontrado');
  console.log('📝 Creando archivo .env.local básico...');
  
  const basicEnv = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAyu56dDwIWM8bFKcJafAQf_2wWlsGMPNI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=callejerusalen-a78aa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=callejerusalen-a78aa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=callejerusalen-a78aa.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123841758904
NEXT_PUBLIC_FIREBASE_APP_ID=1:123841758904:web:66066ac1c3f993ec15d64d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-RXQWETVS6Q

# Google Maps API Key (opcional para mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCcI9BYEG7FnGOBGOvzfKXnipCj313sd0A

# Firebase Admin SDK (para operaciones del servidor)
# Obtén estas credenciales de: https://console.firebase.google.com/project/callejerusalen-a78aa/settings/serviceaccounts/adminsdk
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
`;

  fs.writeFileSync(envPath, basicEnv);
  console.log('✅ Archivo .env.local creado');
}

console.log('\n📋 PASOS PARA CONFIGURAR FIREBASE ADMIN SDK:');
console.log('==============================================');
console.log('1. Ve a: https://console.firebase.google.com/project/callejerusalen-a78aa/settings/serviceaccounts/adminsdk');
console.log('2. Haz clic en "Generar nueva clave privada"');
console.log('3. Descarga el archivo JSON');
console.log('4. Abre el archivo JSON descargado');
console.log('5. Copia los valores de:');
console.log('   - client_email → FIREBASE_CLIENT_EMAIL');
console.log('   - private_key → FIREBASE_PRIVATE_KEY');
console.log('6. Agrega estos valores al archivo .env.local');
console.log('7. Reinicia el servidor con: npm run dev');

console.log('\n🔍 Verificando configuración actual...');

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasClientEmail = envContent.includes('FIREBASE_CLIENT_EMAIL=') && envContent.split('FIREBASE_CLIENT_EMAIL=')[1].trim() !== '';
  const hasPrivateKey = envContent.includes('FIREBASE_PRIVATE_KEY=') && envContent.split('FIREBASE_PRIVATE_KEY=')[1].trim() !== '';
  
  console.log(`FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅ Configurado' : '❌ No configurado'}`);
  
  if (hasClientEmail && hasPrivateKey) {
    console.log('\n🎉 ¡Firebase Admin SDK está configurado correctamente!');
    console.log('💡 Reinicia el servidor para aplicar los cambios');
  } else {
    console.log('\n⚠️  Firebase Admin SDK no está completamente configurado');
    console.log('📝 Sigue los pasos arriba para completar la configuración');
  }
}

console.log('\n🧪 Para probar la configuración:');
console.log('1. Reinicia el servidor: npm run dev');
console.log('2. Ve a /admin en tu aplicación');
console.log('3. Intenta eliminar un usuario');
console.log('4. Verifica que aparezca "Eliminación completa" en los logs');
