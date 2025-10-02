import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { Permission, validatePermissions } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario sea super admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo los super administradores pueden gestionar permisos' }, { status: 403 });
    }

    const { targetUserId, permissions, action } = await request.json();

    if (!targetUserId || !permissions || !Array.isArray(permissions) || !action) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 });
    }

    // Validar permisos
    const validPermissions = validatePermissions(permissions);

    // Obtener información del usuario objetivo
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    
    // Verificar que no se esté modificando al super admin principal
    if (targetUserData?.email === 'mar90jesus@gmail.com') {
      return NextResponse.json({ error: 'No se puede modificar los permisos del super administrador principal' }, { status: 403 });
    }

    let updatedPermissions: Permission[] = [];

    if (action === 'assign') {
      // Asignar permisos
      const currentPermissions = targetUserData?.permissions || [];
      const combinedPermissions = [...currentPermissions, ...validPermissions];
      updatedPermissions = Array.from(new Set(combinedPermissions));
    } else if (action === 'revoke') {
      // Revocar permisos
      const currentPermissions = targetUserData?.permissions || [];
      updatedPermissions = currentPermissions.filter((p: Permission) => !validPermissions.includes(p));
    } else if (action === 'replace') {
      // Reemplazar todos los permisos
      updatedPermissions = validPermissions;
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Actualizar permisos en la base de datos
    await db.collection('users').doc(targetUserId).update({
      permissions: updatedPermissions,
      updatedAt: new Date()
    });

    // Log de la acción
    await db.collection('systemLogs').add({
      action: `permissions_${action}`,
      userId: decodedToken.uid,
      userEmail: userData.email,
      targetUserId,
      targetUserEmail: targetUserData.email,
      permissions: validPermissions,
      timestamp: new Date(),
      details: {
        action,
        permissions: validPermissions,
        previousPermissions: targetUserData?.permissions || [],
        newPermissions: updatedPermissions
      }
    });

    return NextResponse.json({
      success: true,
      message: `Permisos ${action === 'assign' ? 'asignados' : action === 'revoke' ? 'revocados' : 'actualizados'} correctamente`,
      permissions: updatedPermissions
    });

  } catch (error) {
    console.error('Error al gestionar permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario sea super admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo los super administradores pueden ver permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Obtener permisos del usuario objetivo
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();
    const permissions = targetUserData?.permissions || [];

    return NextResponse.json({
      success: true,
      permissions,
      user: {
        uid: targetUserId,
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
