const fs = require('fs');
const path = require('path');

console.log('🚀 Configuración Rápida de Firebase Admin SDK');
console.log('============================================\n');

const envPath = path.join(process.cwd(), '.env.local');

// Plantilla para agregar al .env.local
const firebaseAdminTemplate = `

# Firebase Admin SDK (para operaciones del servidor)
# Obtén estas credenciales de: https://console.firebase.google.com/project/callejerusalen-a78aa/settings/serviceaccounts/adminsdk
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@callejerusalen-a78aa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
`;

// Leer archivo actual
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Verificar si ya tiene las credenciales
if (envContent.includes('FIREBASE_CLIENT_EMAIL=')) {
  console.log('⚠️  Firebase Admin SDK ya está configurado en .env.local');
  
  // Verificar si están vacías
  const hasClientEmail = envContent.includes('FIREBASE_CLIENT_EMAIL=') && 
                        envContent.split('FIREBASE_CLIENT_EMAIL=')[1].split('\n')[0].trim() !== '';
  const hasPrivateKey = envContent.includes('FIREBASE_PRIVATE_KEY=') && 
                       envContent.split('FIREBASE_PRIVATE_KEY=')[1].split('\n')[0].trim() !== '';
  
  if (hasClientEmail && hasPrivateKey) {
    console.log('✅ Las credenciales están configuradas');
    console.log('💡 Si aún no funciona, verifica que las credenciales sean correctas');
  } else {
    console.log('❌ Las credenciales están vacías');
    console.log('📝 Necesitas agregar los valores reales');
  }
} else {
  // Agregar plantilla
  envContent += firebaseAdminTemplate;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Plantilla agregada al .env.local');
  console.log('📝 Ahora necesitas reemplazar los valores de ejemplo con los reales');
}

console.log('\n📋 INSTRUCCIONES DETALLADAS:');
console.log('=============================');
console.log('1. Ve a: https://console.firebase.google.com/project/callejerusalen-a78aa/settings/serviceaccounts/adminsdk');
console.log('2. Haz clic en "Generar nueva clave privada"');
console.log('3. Descarga el archivo JSON');
console.log('4. Abre el archivo JSON descargado');
console.log('5. Copia el valor de "client_email"');
console.log('6. Copia el valor de "private_key" (incluyendo las líneas -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----)');
console.log('7. Reemplaza en .env.local:');
console.log('   - firebase-adminsdk-xxxxx@callejerusalen-a78aa.iam.gserviceaccount.com → tu client_email');
console.log('   - YOUR_PRIVATE_KEY_HERE → tu private_key');
console.log('8. Reinicia el servidor: npm run dev');

console.log('\n🧪 DESPUÉS DE CONFIGURAR:');
console.log('=========================');
console.log('1. Reinicia el servidor');
console.log('2. Ve a /admin en tu aplicación');
console.log('3. Intenta eliminar un usuario');
console.log('4. Verifica en la consola que aparezca "Eliminación completa"');
console.log('5. Verifica en Firebase Console que el usuario se elimine de Authentication');

console.log('\n📄 Contenido actual del .env.local:');
console.log('====================================');
console.log(envContent);
