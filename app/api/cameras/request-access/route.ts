import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Obtener información del usuario
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Verificar que el usuario tenga acceso al plan de seguridad
    const securityPlanDoc = await db.collection('securityRegistrations').doc(decodedToken.uid).get();
    if (!securityPlanDoc.exists || securityPlanDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Acceso al plan de seguridad requerido' }, { status: 403 });
    }

    const { userId, cameraId, reason } = await request.json();

    // Validar datos requeridos
    if (!userId || !cameraId || !reason) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que la cámara existe
    const cameraDoc = await db.collection('security_cameras').doc(cameraId).get();
    if (!cameraDoc.exists) {
      return NextResponse.json({ error: 'Cámara no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario no tenga ya una solicitud pendiente para esta cámara
    const existingRequestQuery = await db.collection('cameraAccessRequests')
      .where('userId', '==', userId)
      .where('cameraId', '==', cameraId)
      .where('status', '==', 'pending')
      .get();

    if (!existingRequestQuery.empty) {
      return NextResponse.json({ error: 'Ya tienes una solicitud pendiente para esta cámara' }, { status: 400 });
    }

    // Crear la solicitud
    const requestData = {
      userId,
      cameraId,
      reason: reason.trim(),
      status: 'pending',
      requestedAt: new Date(),
      requestedBy: userData?.email || 'Usuario',
      cameraName: cameraDoc.data()?.name || 'Cámara sin nombre',
      userEmail: userData?.email || 'Email no disponible',
      userName: userData?.displayName || userData?.email || 'Usuario sin nombre'
    };

    const requestRef = await db.collection('cameraAccessRequests').add(requestData);

    // Log de la acción
    await db.collection('systemLogs').add({
      action: 'camera_access_request_created',
      userId: decodedToken.uid,
      userEmail: userData?.email,
      cameraId,
      cameraName: cameraDoc.data()?.name,
      reason: reason.trim(),
      timestamp: new Date(),
      details: {
        requestId: requestRef.id,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada exitosamente',
      requestId: requestRef.id
    });

  } catch (error) {
    console.error('Error al crear solicitud de acceso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}