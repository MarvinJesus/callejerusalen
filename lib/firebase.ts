import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from './firebase-config';

// Usar la configuración con valores por defecto

// Inicializar Firebase solo en el cliente
let app: any = null;
let auth: any = null;
let db: any = null;
let analytics: any = null;

if (typeof window !== 'undefined') {
  try {
    // Solo inicializar en el cliente
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    console.log('✅ Firebase inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
  }
}

export { auth, db, analytics };
export default app;
