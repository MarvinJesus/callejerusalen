import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Permission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Obteniendo lista de usuarios para administración');

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
    console.error('Error al obtener usuarios:', error);
    
    // En caso de error de Firebase, devolver array vacío en lugar de 500
    if (error instanceof Error && (
      error.message.includes('Firebase Admin no está disponible') ||
      error.message.includes('Failed to initialize Firebase Admin') ||
      error.message.includes('Cannot read properties')
    )) {
      console.log('⚠️ Firebase no disponible, devolviendo array vacío');
      return NextResponse.json({
        success: true,
        users: []
      });
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

