import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Verificar que el usuario solo pueda ver sus propias solicitudes
    if (decodedToken.uid !== params.userId) {
      return NextResponse.json({ error: 'No autorizado para ver estas solicitudes' }, { status: 403 });
    }

    // Obtener solicitudes del usuario
    const requestsSnapshot = await db.collection('cameraAccessRequests')
      .where('userId', '==', params.userId)
      .get();

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate().toISOString(),
      reviewedAt: doc.data().reviewedAt?.toDate()?.toISOString() || null,
    })).sort((a, b) => {
      // Ordenar por fecha de solicitud descendente
      const dateA = new Date(a.requestedAt || 0);
      const dateB = new Date(b.requestedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      success: true,
      requests,
      total: requests.length,
    });

  } catch (error) {
    console.error('Error al obtener solicitudes del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener solicitudes' },
      { status: 500 }
    );
  }
}