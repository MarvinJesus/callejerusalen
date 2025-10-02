import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: any = null;
let adminDb: any = null;

// Configuración de Firebase Admin
const initializeFirebaseAdmin = () => {
  try {
    // Verificar si ya está inicializado
    if (adminApp) {
      return { adminApp, adminAuth, adminDb };
    }

    // Verificar si ya existe una app con el nombre DEFAULT
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      console.log('✅ Firebase Admin reutilizado correctamente');
      return { adminApp, adminAuth, adminDb };
    }

    // Usar archivo JSON como configuración principal
    let serviceAccount;
    try {
      const serviceAccountPath = require('path').join(process.cwd(), 'callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
      serviceAccount = require(serviceAccountPath);
      console.log('🔧 Usando configuración de Firebase Admin desde archivo JSON');
    } catch (fileError) {
      console.warn('⚠️ No se pudo cargar archivo JSON, intentando variables de entorno...');
      
      // Fallback a variables de entorno
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };
        console.log('🔧 Usando configuración de Firebase Admin desde variables de entorno');
      } else {
        throw new Error('No se encontró configuración válida de Firebase Admin');
      }
    }

    // Inicializar Firebase Admin
    adminApp = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: serviceAccount.project_id
    });

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);

    console.log('✅ Firebase Admin inicializado correctamente');
    return { adminApp, adminAuth, adminDb };

  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    throw error;
  }
};

// Función para obtener instancias de Firebase Admin (lazy initialization)
const getFirebaseAdmin = () => {
  if (!adminApp) {
    const { adminApp: app, adminAuth: auth, adminDb: db } = initializeFirebaseAdmin();
    adminApp = app;
    adminAuth = auth;
    adminDb = db;
  }
  return { adminApp, adminAuth, adminDb };
};

// Exportar funciones para obtener las instancias
export const getAdminApp = () => getFirebaseAdmin().adminApp;
export const getAdminAuth = () => getFirebaseAdmin().adminAuth;
export const getAdminDb = () => getFirebaseAdmin().adminDb;

// Exportar instancias directas (para compatibilidad)
export const db = getFirebaseAdmin().adminDb;
export { adminAuth, adminApp };
export default adminApp;