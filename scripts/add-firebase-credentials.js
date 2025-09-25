const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Agregar Credenciales de Firebase Admin SDK');
console.log('============================================\n');

const envPath = path.join(process.cwd(), '.env.local');

// Función para hacer preguntas
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function addCredentials() {
  try {
    console.log('📋 Para obtener las credenciales:');
    console.log('1. Ve a: https://console.firebase.google.com/project/callejerusalen-a78aa/settings/serviceaccounts/adminsdk');
    console.log('2. Haz clic en "Generar nueva clave privada"');
    console.log('3. Descarga el archivo JSON');
    console.log('4. Abre el archivo JSON y copia los valores\n');

    const clientEmail = await askQuestion('📧 FIREBASE_CLIENT_EMAIL (ej: firebase-adminsdk-xxxxx@callejerusalen-a78aa.iam.gserviceaccount.com): ');
    
    if (!clientEmail || !clientEmail.includes('@')) {
      console.log('❌ Email no válido');
      rl.close();
      return;
    }

    const privateKey = await askQuestion('🔐 FIREBASE_PRIVATE_KEY (pega toda la clave privada incluyendo -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----): ');
    
    if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('❌ Clave privada no válida');
      rl.close();
      return;
    }

    // Leer archivo .env.local actual
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Agregar las credenciales si no existen
    if (!envContent.includes('FIREBASE_CLIENT_EMAIL=')) {
      envContent += '\n# Firebase Admin SDK (para operaciones del servidor)\n';
      envContent += `FIREBASE_CLIENT_EMAIL=${clientEmail}\n`;
    } else {
      // Reemplazar valor existente
      envContent = envContent.replace(/FIREBASE_CLIENT_EMAIL=.*/g, `FIREBASE_CLIENT_EMAIL=${clientEmail}`);
    }

    if (!envContent.includes('FIREBASE_PRIVATE_KEY=')) {
      envContent += `FIREBASE_PRIVATE_KEY="${privateKey}"\n`;
    } else {
      // Reemplazar valor existente
      envContent = envContent.replace(/FIREBASE_PRIVATE_KEY=.*/g, `FIREBASE_PRIVATE_KEY="${privateKey}"`);
    }

    // Escribir archivo actualizado
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Credenciales agregadas exitosamente al .env.local');
    console.log('🔄 Reinicia el servidor con: npm run dev');
    console.log('🧪 Prueba eliminando un usuario para verificar la eliminación completa');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

addCredentials();
