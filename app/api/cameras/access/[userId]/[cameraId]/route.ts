import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; cameraId: string } }
) {
  try {
    const { userId, cameraId } = params;

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verificar que el usuario solo pueda ver su propio acceso o que sea admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (decodedToken.uid !== userId && userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado para ver este acceso' }, { status: 403 });
    }

    // Obtener acceso específico a la cámara
    const accessDoc = await db.collection('cameraAccess').doc(userId).get();
    if (!accessDoc.exists) {
      return NextResponse.json({ error: 'No tienes acceso a esta cámara' }, { status: 404 });
    }

    const accessData = accessDoc.data();
    const cameraAccess = accessData?.[cameraId];

    if (!cameraAccess) {
      return NextResponse.json({ error: 'No tienes acceso a esta cámara' }, { status: 404 });
    }

    const access = {
      cameraId,
      accessLevel: cameraAccess.accessLevel || 'view',
      grantedAt: cameraAccess.grantedAt?.toDate() || new Date(),
      grantedBy: cameraAccess.grantedBy || 'system',
      expiresAt: cameraAccess.expiresAt?.toDate() || null
    };

    return NextResponse.json({
      success: true,
      access: access
    });

  } catch (error) {
    console.error('Error al obtener acceso a cámara:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
