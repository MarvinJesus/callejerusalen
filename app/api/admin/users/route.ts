import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { Permission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo lista de usuarios para administración');

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario sea admin o super admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData || (userData.role !== 'super_admin' && userData.role !== 'admin')) {
      return NextResponse.json({ error: 'Solo administradores pueden ver usuarios' }, { status: 403 });
    }

    console.log(`👤 Usuario autenticado: ${userData.email} (${userData.role})`);

    const usersSnapshot = await db.collection('users').get();
    const users: any[] = [];

    usersSnapshot.forEach((doc: any) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email || '',
        name: userData.name || userData.displayName || 'Usuario sin nombre',
        role: userData.role || 'visitante',
        status: userData.status || 'active',
        permissions: userData.permissions || [],
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      });
    });

    // Ordenar por fecha de creación (más recientes primero)
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`✅ Obtenidos ${users.length} usuarios`);

    return NextResponse.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    
    // Verificar si es un error de autenticación
    if (error instanceof Error) {
      if (error.message.includes('Token de autorización requerido')) {
        return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
      }
      if (error.message.includes('Usuario no encontrado')) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      if (error.message.includes('Solo administradores pueden ver usuarios')) {
        return NextResponse.json({ error: 'Solo administradores pueden ver usuarios' }, { status: 403 });
      }
      if (error.message.includes('Firebase Admin no está disponible') ||
          error.message.includes('Failed to initialize Firebase Admin') ||
          error.message.includes('Cannot read properties')) {
        console.log('⚠️ Firebase no disponible, devolviendo array vacío');
        return NextResponse.json({
          success: true,
          users: []
        });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario sea admin o super admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData || (userData.role !== 'super_admin' && userData.role !== 'admin')) {
      return NextResponse.json({ error: 'Solo administradores pueden crear usuarios' }, { status: 403 });
    }

    const { email, name, role, permissions } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    console.log(`➕ Creando nuevo usuario: ${email}`);

    // Verificar si el usuario ya existe
    const existingUser = await db.collection('users').where('email', '==', email).get();
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 409 }
      );
    }

    // Crear nuevo usuario
    const newUser = {
      email,
      name,
      role,
      status: 'active',
      permissions: permissions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userRef = await db.collection('users').add(newUser);

    console.log(`✅ Usuario creado con ID: ${userRef.id}`);

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      userId: userRef.id
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

