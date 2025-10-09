import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role = 'comunidad' } = await request.json();

    console.log('🚀 API Route: Iniciando registro de usuario:', { email, displayName, role });

    // Validar datos de entrada
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Obtener instancias de Firebase Admin
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Verificar si el email ya existe
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // El usuario no existe, continuar con la creación
    }

    console.log('📝 Creando usuario en Firebase Auth...');
    
    // Crear usuario en Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    console.log('✅ Usuario creado en Firebase Auth:', userRecord.uid);

    // Crear perfil en Firestore con estado pendiente
    console.log('💾 Creando perfil en Firestore...');
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role,
      status: 'pending', // ✅ Usuario pendiente hasta aprobación
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false, // No activo hasta aprobación
      permissions: [], // Sin permisos hasta aprobación
      registrationStatus: 'pending', // Estado de registro pendiente
      // Campos adicionales para el sistema de estados
      statusChangedBy: 'system',
      statusChangedAt: new Date(),
      statusReason: 'Registro pendiente de aprobación'
    };

    console.log('📋 Datos del perfil a crear:', userProfile);

    // Crear perfil en Firestore usando Firebase Admin SDK
    await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
    console.log('✅ Perfil creado en Firestore exitosamente');

    // Crear solicitud de registro
    console.log('📝 Creando solicitud de registro...');
    const registrationRequest = {
      id: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      requestedRole: role,
      createdAt: new Date(),
      status: 'pending'
    };

    console.log('📋 Datos de la solicitud a crear:', registrationRequest);

    // Crear solicitud de registro en Firestore
    await adminDb.collection('registrationRequests').doc(userRecord.uid).set(registrationRequest);
    console.log('✅ Solicitud de registro creada exitosamente');

    // Log de la acción
    try {
      const logEntry = {
        action: 'registration_request_created',
        timestamp: new Date().toISOString(),
        userEmail: email,
        details: {
          displayName,
          requestedRole: role,
          userId: userRecord.uid
        }
      };

      // Agregar log al archivo
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'logs', 'system.log');
      
      // Asegurar que el directorio existe
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
      console.log('✅ Log de acción creado');
    } catch (logError) {
      console.warn('⚠️ Error al crear log de acción:', logError);
      // No es crítico, continuar
    }

    console.log('🎉 Registro completado exitosamente para:', email);

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente. Debe esperar aprobación del administrador.',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: role,
        registrationStatus: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Error en API de registro:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al registrar usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
