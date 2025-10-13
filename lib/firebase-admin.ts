import * as admin from 'firebase-admin';

// Inicializar Firebase Admin solo una vez
if (!admin.apps.length) {
  try {
    let credential;
    
    // Verificar si estamos en Vercel o si las variables de entorno están disponibles
    const isVercel = process.env.VERCEL === '1';
    const hasEnvVars = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;
    
    if (isVercel || hasEnvVars) {
      // En producción (Vercel) o cuando hay variables de entorno, usarlas
      console.log('🔧 Usando variables de entorno para Firebase Admin');
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Variables de entorno de Firebase no están configuradas correctamente');
      }
      
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || '',
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
      
      credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    } else {
      // En desarrollo, intentar usar archivo local
      console.log('🔧 Intentando usar archivo local para Firebase Admin');
      try {
        const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
        credential = admin.credential.cert(serviceAccount);
      } catch (fileError) {
        console.error('❌ No se pudo cargar el archivo de Firebase Admin:', fileError);
        throw new Error('Firebase Admin no está configurado. Archivo local no encontrado y variables de entorno no disponibles.');
      }
    }
    
    admin.initializeApp({
      credential
    });
    
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    // No lanzar el error aquí para evitar que rompa la aplicación
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

// Función helper para obtener la instancia de Firestore
export function getAdminDb() {
  return adminDb;
}

// Función helper para obtener la instancia de Auth
export function getAdminAuth() {
  return adminAuth;
}

// Exportar db como alias de adminDb para compatibilidad
export const db = adminDb;

export { adminDb, adminAuth, admin };
