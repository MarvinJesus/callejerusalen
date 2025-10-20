import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { requestId, reason } = await request.json();

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

    // Actualizar la solicitud como rechazada
    await db.collection('cameraAccessRequests').doc(requestId).update({
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      reviewNotes: reason || 'Solicitud rechazada por administrador'
    });

    // Notificar al usuario
    await db.collection('notifications').add({
      userId: requestData.userId,
      type: 'camera_access_rejected',
      title: 'Acceso a Cámara Rechazado',
      message: `Tu solicitud de acceso a la cámara ${requestData.cameraId} ha sido rechazada`,
      data: {
        cameraId: requestData.cameraId,
        reason: reason || 'Solicitud rechazada por administrador'
      },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud rechazada exitosamente'
    });

  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



