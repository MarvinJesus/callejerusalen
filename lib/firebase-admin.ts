import * as admin from 'firebase-admin';

// Inicializar Firebase Admin solo una vez
if (!admin.apps.length) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../callejerusalen-a78aa-firebase-adminsdk-fbsvc-8b0a2b1499.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

// Función helper para obtener la instancia de Firestore
export function getAdminDb() {
  return adminDb;
}

// Exportar db como alias de adminDb para compatibilidad
export const db = adminDb;

export { adminDb, adminAuth, admin };
