import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cameraId = params.id;

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Buscar la cámara en Firestore
    const cameraDoc = await db.collection('security_cameras').doc(cameraId).get();
    if (!cameraDoc.exists) {
      return NextResponse.json({ error: 'Cámara no encontrada' }, { status: 404 });
    }

    const data = cameraDoc.data();
    const camera = {
      id: cameraDoc.id,
      name: data?.name || 'Cámara sin nombre',
      location: data?.location || 'Ubicación no especificada',
      description: data?.description || 'Sin descripción',
      streamUrl: data?.streamUrl || '',
      status: data?.status === 'active' ? 'online' : 'offline',
      accessLevel: data?.accessLevel || 'restricted',
      coordinates: {
        lat: data?.coordinates?.lat || 0,
        lng: data?.coordinates?.lng || 0
      },
      lastSeen: data?.lastSeen?.toDate() || new Date(),
      thumbnail: data?.thumbnail || null,
      resolution: data?.resolution || '1920x1080',
      fps: data?.fps || 30,
      recordingEnabled: data?.recordingEnabled !== false,
      createdAt: data?.createdAt?.toDate() || new Date(),
      createdBy: data?.createdBy || 'system'
    };

    // Obtener información del usuario
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // Verificar que el usuario tenga acceso al plan de seguridad
    const securityPlanDoc = await db.collection('securityPlans').doc(decodedToken.uid).get();
    if (!securityPlanDoc.exists || securityPlanDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Acceso al plan de seguridad requerido' }, { status: 403 });
    }

    // Verificar acceso específico a la cámara
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      // Para cámaras privadas y restringidas, verificar acceso específico
      if (camera.accessLevel === 'private' || camera.accessLevel === 'restricted') {
        const userAccessDoc = await db.collection('cameraAccess').doc(decodedToken.uid).get();
        const userAccess = userAccessDoc.exists ? userAccessDoc.data() : {};
        
        if (!userAccess[cameraId]) {
          return NextResponse.json({ error: 'No tienes acceso a esta cámara' }, { status: 403 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      camera: camera
    });

  } catch (error) {
    console.error('Error al obtener cámara:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
