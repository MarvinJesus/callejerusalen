import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { requestId, accessLevel = 'view', expiresAt, notes } = await request.json();

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verificar que el usuario sea administrador
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de administrador' }, { status: 403 });
    }

    // Obtener la solicitud
    const requestDoc = await db.collection('cameraAccessRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    if (requestData?.status !== 'pending') {
      return NextResponse.json({ error: 'La solicitud ya ha sido procesada' }, { status: 400 });
    }

    // Actualizar la solicitud como aprobada
    await db.collection('cameraAccessRequests').doc(requestId).update({
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      reviewNotes: notes || 'Acceso aprobado por administrador',
      accessLevel,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Otorgar acceso a la cámara
    const accessData = {
      [requestData.cameraId]: {
        accessLevel,
        grantedAt: new Date(),
        grantedBy: decodedToken.uid,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        requestId
      }
    };

    await db.collection('cameraAccess').doc(requestData.userId).set(accessData, { merge: true });

    // Notificar al usuario
    await db.collection('notifications').add({
      userId: requestData.userId,
      type: 'camera_access_approved',
      title: 'Acceso a Cámara Aprobado',
      message: `Tu solicitud de acceso a la cámara ${requestData.cameraId} ha sido aprobada`,
      data: {
        cameraId: requestData.cameraId,
        accessLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Acceso otorgado exitosamente'
    });

  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



