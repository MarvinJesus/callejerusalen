import { NextRequest, NextResponse } from 'next/server';
import { getHistoryPageData } from '@/lib/history-service';

// GET - Obtener servicios locales
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API de servicios locales llamada');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const historyData = await getHistoryPageData();
    
    if (!historyData) {
      console.log('❌ No se encontraron datos de historia, devolviendo servicios vacíos');
      return NextResponse.json({ services: [] });
    }

    let services = historyData.services.filter(service => service.isActive);

    // Filtrar por categoría si se especifica
    if (category && category !== 'all') {
      services = services.filter(service => service.category === category);
    }

    // Filtrar por término de búsqueda si se especifica
    if (search) {
      const searchTerm = search.toLowerCase();
      services = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.address.toLowerCase().includes(searchTerm)
      );
    }

    console.log(`✅ Devolviendo ${services.length} servicios locales`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('❌ Error al obtener servicios locales:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
