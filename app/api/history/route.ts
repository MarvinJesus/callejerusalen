import { NextRequest, NextResponse } from 'next/server';
import { getHistoryPageData, HistoryPageData } from '@/lib/history-service';

// GET - Obtener datos públicos de la página de historia
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API pública de historia llamada');
    
    const historyData = await getHistoryPageData();
    
    if (!historyData) {
      console.log('❌ No se encontraron datos de historia, devolviendo datos por defecto');
      // Devolver datos por defecto si no hay datos en Firebase
      const defaultHistoryData = {
        title: 'Historia de Calle Jerusalén',
        subtitle: 'Descubre la rica historia y tradiciones que han moldeado nuestra comunidad a lo largo de los años.',
        periods: [],
        traditions: [],
        places: [],
        events: [],
        gallery: [],
        services: [],
        exploreLinks: [],
        isActive: true,
      };
      return NextResponse.json({ historyData: defaultHistoryData }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    if (!historyData.isActive) {
      console.log('❌ Datos de historia inactivos');
      return NextResponse.json({ error: 'Datos de historia no disponibles' }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }
    
    console.log('✅ Devolviendo datos de historia públicos');
    return NextResponse.json({ historyData }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener datos públicos de historia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}
