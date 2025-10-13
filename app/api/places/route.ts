import { NextRequest, NextResponse } from 'next/server';
import { getPlaces, Place } from '@/lib/places-service';

// GET - Obtener lugares públicos (solo activos)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API de lugares llamada');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let places = (await getPlaces()).filter(place => place.isActive);

    // Filtrar por categoría si se especifica
    if (category && category !== 'all') {
      places = places.filter(place => place.category === category);
    }

    // Filtrar por término de búsqueda si se especifica
    if (search) {
      const searchTerm = search.toLowerCase();
      places = places.filter(place =>
        place.name.toLowerCase().includes(searchTerm) ||
        place.description.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
      );
    }

    console.log(`✅ Devolviendo ${places.length} lugares`);
    return NextResponse.json({ places });
  } catch (error) {
    console.error('❌ Error al obtener lugares públicos:', error);
    
    // En caso de error de Firebase, devolver array vacío en lugar de 500
    if (error instanceof Error && error.message.includes('Firebase Admin no está disponible')) {
      console.log('⚠️ Firebase no disponible, devolviendo array vacío');
      return NextResponse.json({ places: [] });
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}