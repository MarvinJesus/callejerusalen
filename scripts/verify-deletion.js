const fs = require('fs');
const path = require('path');

console.log('🔍 Verificador de Eliminación de Usuarios');
console.log('========================================\n');

async function verifyDeletion() {
  try {
    // Verificar configuración
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Archivo .env.local no encontrado');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar credenciales
    const hasClientEmail = envContent.includes('FIREBASE_CLIENT_EMAIL=') && 
                          !envContent.split('FIREBASE_CLIENT_EMAIL=')[1].split('\n')[0].includes('xxxxx');
    const hasPrivateKey = envContent.includes('FIREBASE_PRIVATE_KEY=') && 
                         !envContent.split('FIREBASE_PRIVATE_KEY=')[1].includes('YOUR_PRIVATE_KEY_HERE');
    
    console.log('📋 Estado de la configuración:');
    console.log(`FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅ Configurado' : '❌ No configurado (aún tiene valores de ejemplo)'}`);
    console.log(`FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅ Configurado' : '❌ No configurado (aún tiene valores de ejemplo)'}\n`);

    if (!hasClientEmail || !hasPrivateKey) {
      console.log('⚠️  Necesitas reemplazar los valores de ejemplo con las credenciales reales');
      console.log('📝 Sigue las instrucciones del script anterior');
      return;
    }

    // Cargar variables de entorno
    require('dotenv').config({ path: envPath });

    // Inicializar Firebase Admin
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');

    const firebaseAdminConfig = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    let adminApp;
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      adminApp = getApps()[0];
    }

    const adminAuth = getAuth(adminApp);
    
    console.log('🔄 Probando conexión con Firebase Admin SDK...');
    
    // Listar usuarios actuales
    const listUsersResult = await adminAuth.listUsers(10);
    console.log(`✅ Conexión exitosa! Usuarios encontrados: ${listUsersResult.users.length}\n`);
    
    if (listUsersResult.users.length > 0) {
      console.log('📋 Usuarios actuales en Firebase Authentication:');
      listUsersResult.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.uid})`);
      });
    }

    console.log('\n🎉 ¡Firebase Admin SDK está configurado y funcionando!');
    console.log('💡 Ahora puedes:');
    console.log('   1. Reiniciar el servidor: npm run dev');
    console.log('   2. Ir a /admin en tu aplicación');
    console.log('   3. Eliminar usuarios (se eliminarán completamente)');
    console.log('   4. Verificar que desaparezcan de Firebase Console');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('credential')) {
      console.log('\n💡 Posibles problemas:');
      console.log('1. Las credenciales no son correctas');
      console.log('2. La clave privada no está bien formateada');
      console.log('3. Los \\n no están incluidos en la clave privada');
      console.log('\n📝 Verifica que en .env.local tengas:');
      console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nTU_CLAVE_AQUI\\n-----END PRIVATE KEY-----\\n"');
    }
  }
}

verifyDeletion();
