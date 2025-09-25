import { NextRequest, NextResponse } from 'next/server';

// Verificar si Firebase Admin SDK está configurado
const isFirebaseAdminConfigured = () => {
  return process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
};

// Inicializar Firebase Admin solo si está configurado
let adminAuth: any = null;
let adminDb: any = null;

if (isFirebaseAdminConfigured()) {
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');

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

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.warn('Firebase Admin SDK no está configurado correctamente:', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid, deletedBy } = await request.json();

    if (!uid || !deletedBy) {
      return NextResponse.json(
        { error: 'UID y deletedBy son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si es el super admin principal
    if (deletedBy === 'mar90jesus@gmail.com') {
      return NextResponse.json(
        { error: 'No se puede eliminar al super administrador principal' },
        { status: 403 }
      );
    }

    let userData: any = null;
    let deletionMethod = '';

    if (adminAuth && adminDb) {
      // Método completo con Firebase Admin SDK
      try {
        const userRecord = await adminAuth.getUser(uid);
        const userDoc = await adminDb.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
          return NextResponse.json(
            { error: 'Usuario no encontrado en Firestore' },
            { status: 404 }
          );
        }

        userData = userDoc.data();

        // Verificar si es el super admin principal
        if (userData?.email === 'mar90jesus@gmail.com') {
          return NextResponse.json(
            { error: 'No se puede eliminar al super administrador principal' },
            { status: 403 }
          );
        }

        // Eliminar usuario de Firebase Authentication
        await adminAuth.deleteUser(uid);

        // Eliminar documento de Firestore
        await adminDb.collection('users').doc(uid).delete();

        deletionMethod = 'completa (Firebase Auth + Firestore)';
      } catch (adminError) {
        console.warn('Error con Firebase Admin SDK, usando método alternativo:', adminError);
        // Continuar con método alternativo
      }
    }

    if (!userData) {
      // Método alternativo sin Firebase Admin SDK
      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore, doc, getDoc, deleteDoc } = require('firebase/firestore');

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      };

      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      const db = getFirestore(app);
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return NextResponse.json(
          { error: 'Usuario no encontrado en Firestore' },
          { status: 404 }
        );
      }

      userData = userDoc.data();

      // Verificar si es el super admin principal
      if (userData?.email === 'mar90jesus@gmail.com') {
        return NextResponse.json(
          { error: 'No se puede eliminar al super administrador principal' },
          { status: 403 }
        );
      }

      // Solo eliminar de Firestore (el usuario seguirá en Firebase Auth pero sin acceso)
      await deleteDoc(doc(db, 'users', uid));

      deletionMethod = 'parcial (solo Firestore - configure Firebase Admin SDK para eliminación completa)';
    }

    // Log de la acción
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'System action: user_deleted',
      details: {
        action: 'user_deleted',
        userId: deletedBy,
        userEmail: deletedBy,
        details: {
          deletedUserEmail: userData?.email,
          deletedUserRole: userData?.role,
          deletedUserId: uid,
          deletionMethod: deletionMethod
        },
        timestamp: new Date().toISOString()
      },
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Guardar log en archivo
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'logs', 'system.log');
    
    // Asegurar que el directorio existe
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Agregar log al archivo
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    return NextResponse.json({
      success: true,
      message: `Usuario eliminado exitosamente (${deletionMethod})`,
      deletedUser: {
        email: userData?.email,
        role: userData?.role,
        uid: uid
      },
      deletionMethod: deletionMethod
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al eliminar usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
