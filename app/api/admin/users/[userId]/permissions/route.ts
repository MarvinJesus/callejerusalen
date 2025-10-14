import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { Permission } from '@/lib/permissions';

// Validar permisos
function validatePermissions(permissions: any[]): Permission[] {
  const validPermissions: Permission[] = [];
  
  // Lista de permisos válidos (debería coincidir con lib/permissions.ts)
  const allValidPermissions = [
    // Users
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_status',
    // Registrations
    'registrations.view', 'registrations.approve', 'registrations.reject',
    // Security
    'security.view', 'security.manage', 'security.alerts',
    // Permissions
    'permissions.view', 'permissions.assign', 'permissions.revoke',
    // Reports
    'reports.view', 'reports.export',
    // Analytics
    'analytics.view', 'analytics.export',
    // Logs
    'logs.view', 'logs.export',
    // Community
    'community.view', 'community.edit', 'community.events', 'community.places', 'community.services',
    // Settings
    'settings.view', 'settings.edit'
  ];

  permissions.forEach(permission => {
    if (typeof permission === 'string' && allValidPermissions.includes(permission as Permission)) {
      validPermissions.push(permission as Permission);
    }
  });

  return validPermissions;
}

// PUT - Actualizar permisos de un usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
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
      return NextResponse.json({ error: 'Solo administradores pueden gestionar permisos' }, { status: 403 });
    }

    const { permissions } = await request.json();

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permisos requeridos como array' }, { status: 400 });
    }

    // Validar permisos
    const validPermissions = validatePermissions(permissions);

    // Obtener información del usuario objetivo
    const targetUserDoc = await db.collection('users').doc(params.userId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    
    if (!targetUserData) {
      return NextResponse.json({ error: 'Datos del usuario no encontrados' }, { status: 404 });
    }
    
    // Verificar que no se esté modificando al super admin principal
    if (targetUserData.email === 'mar90jesus@gmail.com') {
      return NextResponse.json({ 
        error: 'No se puede modificar los permisos del super administrador principal (mar90jesus@gmail.com)' 
      }, { status: 403 });
    }

    // Actualizar permisos en la base de datos
    await db.collection('users').doc(params.userId).update({
      permissions: validPermissions,
      updatedAt: new Date()
    });

    // Log de la acción
    await db.collection('systemLogs').add({
      action: 'permissions_update',
      userId: decodedToken.uid,
      userEmail: userData.email,
      targetUserId: params.userId,
      targetUserEmail: targetUserData.email,
      permissions: validPermissions,
      timestamp: new Date(),
      details: {
        action: 'replace',
        permissions: validPermissions,
        previousPermissions: targetUserData?.permissions || [],
        newPermissions: validPermissions
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Permisos actualizados correctamente',
      permissions: validPermissions
    });

  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener permisos de un usuario
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
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
      return NextResponse.json({ error: 'Solo administradores pueden ver permisos' }, { status: 403 });
    }

    // Obtener permisos del usuario objetivo
    const targetUserDoc = await db.collection('users').doc(params.userId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    
    if (!targetUserData) {
      return NextResponse.json({ error: 'Datos del usuario no encontrados' }, { status: 404 });
    }
    
    const permissions = targetUserData.permissions || [];

    return NextResponse.json({
      success: true,
      permissions,
      user: {
        uid: params.userId,
        email: targetUserData.email,
        displayName: targetUserData.displayName,
        role: targetUserData.role
      }
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}