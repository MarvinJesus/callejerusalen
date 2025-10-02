import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Permission, validatePermissions } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Obteniendo permisos del usuario ${userId}`);

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || [];

    console.log(`✅ Permisos obtenidos para usuario ${userId}:`, permissions);

    return NextResponse.json({
      success: true,
      permissions: permissions
    });

  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { permissions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Lista de permisos requerida' },
        { status: 400 }
      );
    }

    console.log(`🔧 Actualizando permisos del usuario ${userId}:`, permissions);

    // Validar permisos
    const validPermissions = validatePermissions(permissions);
    
    if (validPermissions.length !== permissions.length) {
      return NextResponse.json(
        { error: 'Algunos permisos no son válidos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar permisos
    await db.collection('users').doc(userId).update({
      permissions: validPermissions,
      updatedAt: new Date()
    });

    console.log(`✅ Permisos actualizados para usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Permisos actualizados exitosamente',
      permissions: validPermissions
    });

  } catch (error) {
    console.error('Error al actualizar permisos del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { permissions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Lista de permisos requerida' },
        { status: 400 }
      );
    }

    console.log(`➕ Agregando permisos al usuario ${userId}:`, permissions);

    // Validar permisos
    const validPermissions = validatePermissions(permissions);

    // Obtener permisos actuales
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentPermissions = userData?.permissions || [];

    // Combinar permisos (sin duplicados)
    const newPermissions = Array.from(new Set([...currentPermissions, ...validPermissions]));

    // Actualizar permisos
    await db.collection('users').doc(userId).update({
      permissions: newPermissions,
      updatedAt: new Date()
    });

    console.log(`✅ Permisos agregados al usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Permisos agregados exitosamente',
      permissions: newPermissions
    });

  } catch (error) {
    console.error('Error al agregar permisos al usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { permissions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Lista de permisos requerida' },
        { status: 400 }
      );
    }

    console.log(`➖ Removiendo permisos del usuario ${userId}:`, permissions);

    // Obtener permisos actuales
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentPermissions = userData?.permissions || [];

    // Remover permisos especificados
    const newPermissions = currentPermissions.filter(
      (permission: Permission) => !permissions.includes(permission)
    );

    // Actualizar permisos
    await db.collection('users').doc(userId).update({
      permissions: newPermissions,
      updatedAt: new Date()
    });

    console.log(`✅ Permisos removidos del usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Permisos removidos exitosamente',
      permissions: newPermissions
    });

  } catch (error) {
    console.error('Error al remover permisos del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

