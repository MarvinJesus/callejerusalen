import { NextRequest, NextResponse } from 'next/server';
import { saveEmergencyInfo } from '@/lib/emergency-service';
import { adminAuth, db } from '@/lib/firebase-admin';

// PUT - Crear/Actualizar información de emergencia (solo admin o super_admin)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();
    if (!userDoc.exists || !['admin', 'super_admin'].includes(userData?.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const required = ['title', 'description', 'safeAreaName', 'map'];
    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `Falta el campo requerido: ${key}` }, { status: 400 });
      }
    }
    if (typeof body.map?.lat !== 'number' || typeof body.map?.lng !== 'number') {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    const saved = await saveEmergencyInfo({
      title: body.title,
      subtitle: body.subtitle || '',
      description: body.description,
      safeAreaName: body.safeAreaName,
      safeAreaAddress: body.safeAreaAddress || '',
      imageUrl: body.imageUrl || '',
      tips: Array.isArray(body.tips) ? body.tips : [],
      instructions: Array.isArray(body.instructions) ? body.instructions : [],
      map: { lat: Number(body.map.lat), lng: Number(body.map.lng), zoom: body.map.zoom ? Number(body.map.zoom) : 16 },
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, emergency: saved });
  } catch (error) {
    console.error('❌ Error al guardar información de emergencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


