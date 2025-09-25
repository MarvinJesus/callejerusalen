const fs = require('fs');
const path = require('path');

console.log('🧪 Prueba de Firebase Admin SDK');
console.log('==============================\n');

async function testFirebaseAdmin() {
  try {
    // Verificar variables de entorno
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Archivo .env.local no encontrado');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar si las credenciales están configuradas
    const hasClientEmail = envContent.includes('FIREBASE_CLIENT_EMAIL=') && envContent.split('FIREBASE_CLIENT_EMAIL=')[1].trim() !== '';
    const hasPrivateKey = envContent.includes('FIREBASE_PRIVATE_KEY=') && envContent.split('FIREBASE_PRIVATE_KEY=')[1].trim() !== '';
    
    console.log('📋 Estado de la configuración:');
    console.log(`FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅ Configurado' : '❌ No configurado'}\n`);

    if (!hasClientEmail || !hasPrivateKey) {
      console.log('⚠️  Firebase Admin SDK no está configurado completamente');
      console.log('📝 Ejecuta: node scripts/add-firebase-credentials.js');
      return;
    }

    // Intentar importar Firebase Admin
    console.log('🔄 Intentando inicializar Firebase Admin SDK...');
    
    // Simular la carga de variables de entorno
    require('dotenv').config({ path: envPath });
    
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');

    const firebaseAdminConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    console.log('📊 Configuración detectada:');
    console.log(`Project ID: ${firebaseAdminConfig.projectId}`);
    console.log(`Client Email: ${firebaseAdminConfig.clientEmail}`);
    console.log(`Private Key: ${firebaseAdminConfig.privateKey ? '✅ Presente' : '❌ Faltante'}\n`);

    let adminApp;
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin SDK inicializado correctamente');
    } else {
      adminApp = getApps()[0];
      console.log('✅ Firebase Admin SDK ya estaba inicializado');
    }

    const adminAuth = getAuth(adminApp);
    
    // Probar listar usuarios
    console.log('🔄 Probando listado de usuarios...');
    const listUsersResult = await adminAuth.listUsers(5);
    console.log(`✅ Usuarios encontrados: ${listUsersResult.users.length}`);
    
    if (listUsersResult.users.length > 0) {
      console.log('📋 Primeros usuarios:');
      listUsersResult.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.uid})`);
      });
    }

    console.log('\n🎉 ¡Firebase Admin SDK está funcionando correctamente!');
    console.log('💡 Ahora puedes eliminar usuarios completamente del sistema');

  } catch (error) {
    console.error('❌ Error al probar Firebase Admin SDK:', error.message);
    
    if (error.message.includes('credential')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que las credenciales estén correctas en .env.local');
      console.log('2. Asegúrate de que la clave privada esté entre comillas dobles');
      console.log('3. Verifica que los \\n estén incluidos en la clave privada');
    }
  }
}

testFirebaseAdmin();
