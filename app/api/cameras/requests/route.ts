import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
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

    // Solo los administradores pueden ver todas las solicitudes
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // Obtener todas las solicitudes
    const requestsSnapshot = await db.collection('cameraAccessRequests').get();

    const requests = requestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        cameraId: data.cameraId,
        cameraName: data.cameraName || 'Cámara sin nombre',
        reason: data.reason,
        status: data.status,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        requestedBy: data.requestedBy,
        userEmail: data.userEmail,
        userName: data.userName,
        reviewedAt: data.reviewedAt?.toDate(),
        reviewedBy: data.reviewedBy,
        reviewNotes: data.reviewNotes
      };
    }).sort((a, b) => {
      // Ordenar por fecha de solicitud descendente
      const dateA = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt);
      const dateB = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Estadísticas
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };

    return NextResponse.json({
      success: true,
      requests,
      stats
    });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}