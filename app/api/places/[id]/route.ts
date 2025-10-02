import { NextRequest, NextResponse } from 'next/server';
import { getPlaceById } from '@/lib/places-service';

// GET - Obtener un lugar específico (público)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 API pública obtener lugar ${params.id}`);
    
    const place = await getPlaceById(params.id);
    
    if (!place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    // Solo devolver lugares activos para la API pública
    if (!place.isActive) {
      return NextResponse.json({ error: 'Lugar no disponible' }, { status: 404 });
    }

    console.log(`✅ Lugar encontrado: ${place.name}`);
    return NextResponse.json({ place });
  } catch (error) {
    console.error('❌ Error al obtener lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
