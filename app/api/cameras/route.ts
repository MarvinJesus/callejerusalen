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
    
    // Verificar que el usuario tenga acceso al plan de seguridad (excepto administradores)
    // TEMPORAL: Comentado para testing - descomentar en producción
    /*
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      const securityPlanDoc = await db.collection('securityPlans').doc(decodedToken.uid).get();
      if (!securityPlanDoc.exists || securityPlanDoc.data()?.status !== 'active') {
        return NextResponse.json({ error: 'Acceso al plan de seguridad requerido' }, { status: 403 });
      }
    }
    */

    // Obtener cámaras desde Firestore
    const camerasSnapshot = await db.collection('security_cameras').get();
    console.log(`📹 Cargando ${camerasSnapshot.docs.length} cámaras desde Firestore`);
    
    const allCameras = camerasSnapshot.docs.map(doc => {
      const data = doc.data();
      const camera = {
        id: doc.id,
        name: data.name || 'Cámara sin nombre',
        location: data.location || 'Ubicación no especificada',
        description: data.description || 'Sin descripción',
        streamUrl: data.streamUrl || '',
        status: data.status === 'active' ? 'online' : 'offline',
        accessLevel: data.accessLevel || 'restricted',
        coordinates: {
          lat: data.coordinates?.lat || 0,
          lng: data.coordinates?.lng || 0
        },
        lastSeen: data.lastSeen?.toDate() || new Date(),
        thumbnail: data.thumbnail || null,
        resolution: data.resolution || '1920x1080',
        fps: data.fps || 30,
        recordingEnabled: data.recordingEnabled !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy || 'system'
      };
      
      console.log(`📷 Cámara: ${camera.name} - Coordenadas: ${camera.coordinates.lat}, ${camera.coordinates.lng} - Estado: ${camera.status}`);
      return camera;
    });

    // Filtrar cámaras según el nivel de acceso del usuario
    let availableCameras = allCameras;
    
    // Los administradores pueden ver todas las cámaras
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      // Los residentes solo pueden ver cámaras públicas y las que tienen acceso específico
      const userAccessDoc = await db.collection('cameraAccess').doc(decodedToken.uid).get();
      const userAccess = userAccessDoc.exists ? userAccessDoc.data() : {};
      
      availableCameras = allCameras.filter(camera => {
        // Siempre mostrar cámaras públicas
        if (camera.accessLevel === 'public') {
          return true;
        }
        
        // Mostrar cámaras restringidas si el usuario tiene acceso
        if (camera.accessLevel === 'restricted' && userAccess[camera.id]) {
          return true;
        }
        
        // Mostrar cámaras privadas solo si el usuario tiene acceso específico
        if (camera.accessLevel === 'private' && userAccess[camera.id]) {
          return true;
        }
        
        return false;
      });
    }

    return NextResponse.json({
      success: true,
      cameras: availableCameras,
      total: availableCameras.length
    });

  } catch (error) {
    console.error('Error al obtener cámaras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
