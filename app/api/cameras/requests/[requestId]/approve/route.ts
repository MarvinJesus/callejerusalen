import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verificar que el usuario es administrador
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden aprobar solicitudes' }, { status: 403 });
    }

    const { reviewNotes } = await request.json();

    // Verificar que la solicitud existe
    const requestDoc = await db.collection('cameraAccessRequests').doc(params.requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
    // Verificar que la solicitud está pendiente
    if (requestData?.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitud ya ha sido procesada' }, { status: 409 });
    }

    // Actualizar la solicitud
    await db.collection('cameraAccessRequests').doc(params.requestId).update({
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      reviewNotes: reviewNotes || 'Solicitud aprobada'
    });

    // Crear el acceso a la cámara para el usuario
    const userAccessRef = db.collection('cameraAccess').doc(requestData.userId);
    const userAccessDoc = await userAccessRef.get();
    
    const currentAccess = userAccessDoc.exists ? userAccessDoc.data() : {};
    const updatedAccess = {
      ...currentAccess,
      [requestData.cameraId]: {
        accessLevel: 'view',
        grantedAt: new Date(),
        grantedBy: decodedToken.uid,
        expiresAt: null // Acceso permanente por ahora
      }
    };

    await userAccessRef.set(updatedAccess);

    console.log(`✅ Solicitud de acceso aprobada: ${params.requestId} por admin ${decodedToken.uid}`);

    return NextResponse.json({
      success: true,
      message: 'Solicitud aprobada exitosamente'
    });

  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



