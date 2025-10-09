const { execSync } = require('child_process');
const path = require('path');

async function deployFirestoreRules() {
  try {
    console.log('🚀 Desplegando reglas de Firestore...');
    
    const rulesPath = path.join(process.cwd(), 'firestore.rules');
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID no está configurado');
    }
    
    console.log('📋 Proyecto:', projectId);
    console.log('📁 Archivo de reglas:', rulesPath);
    
    // Verificar si Firebase CLI está instalado
    try {
      execSync('firebase --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools');
      return;
    }
    
    // Desplegar reglas
    const command = `firebase deploy --only firestore:rules --project ${projectId}`;
    console.log('🔧 Ejecutando:', command);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Reglas de Firestore desplegadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error al desplegar reglas de Firestore:', error.message);
    
    if (error.message.includes('not logged in')) {
      console.log('🔑 Necesitas iniciar sesión en Firebase CLI:');
      console.log('   firebase login');
    }
    
    if (error.message.includes('project')) {
      console.log('⚙️ Verifica que el proyecto esté configurado correctamente:');
      console.log('   firebase use --add');
    }
  }
}

deployFirestoreRules();
