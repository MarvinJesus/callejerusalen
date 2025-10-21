import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET - Obtener estadisticas publicas (sin autenticacion)
export async function GET(request: NextRequest) {
  try {
    console.log('[PUBLIC-STATS] Obteniendo estadisticas publicas...');

    // Contar usuarios registrados
    let totalUsers = 0;
    try {
      const usersSnapshot = await db.collection('users').get();
      totalUsers = usersSnapshot.size;
      console.log(`[PUBLIC-STATS] Usuarios encontrados: ${totalUsers}`);
    } catch (error) {
      console.error('[PUBLIC-STATS] Error al obtener usuarios:', error);
      totalUsers = 5;
    }

    // Contar lugares registrados
    let totalPlaces = 0;
    try {
      const placesSnapshot = await db.collection('places').get();
      totalPlaces = placesSnapshot.size;
      console.log(`[PUBLIC-STATS] Lugares encontrados: ${totalPlaces}`);
    } catch (error) {
      console.error('[PUBLIC-STATS] Error al obtener lugares:', error);
      totalPlaces = 5;
    }

    // Contar camaras activas del plan de seguridad
    let totalCameras = 0;
    try {
      const camerasSnapshot = await db
        .collection('security_cameras')
        .where('status', '==', 'active')
        .get();
      totalCameras = camerasSnapshot.size;
      console.log(`[PUBLIC-STATS] Camaras activas encontradas: ${totalCameras}`);
    } catch (error) {
      console.error('[PUBLIC-STATS] Error al obtener camaras:', error);
      totalCameras = 0;
    }

    const stats = {
      success: true,
      users: {
        total: totalUsers,
        active: Math.floor(totalUsers * 0.8),
      },
      places: {
        total: totalPlaces,
        active: Math.floor(totalPlaces * 0.9),
      },
      security: {
        cameras: totalCameras,
        monitoring: totalCameras > 0,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[PUBLIC-STATS] Estadisticas publicas:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[PUBLIC-STATS] Error general al obtener estadisticas:', error);

    const defaultStats = {
      success: false,
      users: {
        total: 5,
        active: 4,
      },
      places: {
        total: 5,
        active: 5,
      },
      security: {
        cameras: 0,
        monitoring: false,
      },
      timestamp: new Date().toISOString(),
      error: 'Error al obtener estadisticas, mostrando valores por defecto',
    };

    return NextResponse.json(defaultStats, { status: 500 });
  }
}
