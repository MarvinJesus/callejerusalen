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

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role, createdBy } = await request.json();

    if (!email || !password || !displayName || !role || !createdBy) {
      return NextResponse.json(
        { error: 'Email, contraseña, nombre, rol y creado por son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido
    const validRoles = ['visitante', 'comunidad', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // 🔐 PROTECCIÓN: Solo el super-admin principal puede asignar el rol de super_admin
    if (role === 'super_admin' && createdBy !== 'mar90jesus@gmail.com') {
      return NextResponse.json(
        { error: 'Solo el super administrador principal puede asignar el rol de Super Administrador' },
        { status: 403 }
      );
    }

    let userRecord: any = null;
    let userProfile: any = null;

    if (adminAuth && adminDb) {
      // Método con Firebase Admin SDK (recomendado)
      try {
        // Verificar si el email ya existe
        try {
          await adminAuth.getUserByEmail(email);
          return NextResponse.json(
            { error: 'El email ya está registrado en Firebase Authentication' },
            { status: 400 }
          );
        } catch (error: any) {
          if (error.code !== 'auth/user-not-found') {
            throw error;
          }
          // El usuario no existe, continuar con la creación
        }

        // Crear usuario en Firebase Authentication
        userRecord = await adminAuth.createUser({
          email: email,
          password: password,
          displayName: displayName,
          emailVerified: false
        });

        // Crear perfil en Firestore
        userProfile = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          role: role,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          registrationStatus: 'approved',
          approvedBy: createdBy,
          approvedAt: new Date()
        };

        await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

        console.log('✅ Usuario creado exitosamente con Firebase Admin SDK');

      } catch (adminError) {
        console.warn('Error con Firebase Admin SDK, usando método alternativo:', adminError);
        // Continuar con método alternativo
      }
    }

    if (!userRecord) {
      // Método alternativo sin Firebase Admin SDK
      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore, collection, query, where, getDocs, setDoc, doc } = require('firebase/firestore');
      const { createUserWithEmailAndPassword, updateProfile, signOut } = require('firebase/auth');

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
      const { getAuth } = require('firebase/auth');
      const auth = getAuth(app);

      // Verificar si el email ya existe en Firestore
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      if (!usersSnapshot.empty) {
        return NextResponse.json(
          { error: 'El email ya está registrado en el sistema' },
          { status: 400 }
        );
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar el perfil del usuario
      await updateProfile(user, { displayName });

      // Cerrar sesión inmediatamente para no afectar al super admin
      await signOut(auth);

      // Crear perfil en Firestore
      userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        role: role,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        registrationStatus: 'approved',
        approvedBy: createdBy,
        approvedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      userRecord = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      };

      console.log('✅ Usuario creado exitosamente con método alternativo (sin Firebase Admin SDK)');
    }

    // Log de la acción en el servidor
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'logs', 'system.log');
    
    // Asegurar que el directorio existe
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logEntry = {
      action: 'user_created',
      timestamp: new Date().toISOString(),
      userEmail: createdBy,
      details: {
        newUserEmail: email,
        newUserRole: role,
        newUserId: userRecord.uid
      }
    };
    
    // Agregar log al archivo
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: role
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al crear usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
