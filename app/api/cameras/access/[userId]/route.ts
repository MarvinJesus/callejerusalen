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
    
    // Verificar que el usuario solo pueda ver su propio acceso
    if (decodedToken.uid !== params.userId) {
      return NextResponse.json({ error: 'No autorizado para ver este acceso' }, { status: 403 });
    }

    // Obtener acceso del usuario a las cámaras
    const userAccessDoc = await db.collection('cameraAccess').doc(params.userId).get();
    
    if (!userAccessDoc.exists) {
      return NextResponse.json({
        success: true,
        access: [],
        total: 0,
      });
    }

    const userAccessData = userAccessDoc.data() || {};
    const accessList = Object.keys(userAccessData).map(cameraId => ({
      cameraId,
      ...userAccessData[cameraId],
      grantedAt: userAccessData[cameraId].grantedAt?.toDate().toISOString(),
      expiresAt: userAccessData[cameraId].expiresAt?.toDate().toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      access: accessList,
      total: accessList.length,
    });

  } catch (error) {
    console.error('Error al obtener acceso del usuario a cámaras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener acceso' },
      { status: 500 }
    );
  }
}