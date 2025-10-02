import { NextRequest, NextResponse } from 'next/server';
import { getHistoryPageData, saveHistoryPageData, HistoryPageData } from '@/lib/history-service';

// GET - Obtener datos de la página de historia
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API admin de historia llamada');
    
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
    
    console.log('✅ Devolviendo datos de historia para admin');
    return NextResponse.json({ historyData }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener datos de historia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}

// POST - Crear o actualizar datos de la página de historia
export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    console.log('📝 Datos recibidos para guardar historia:', JSON.stringify(body, null, 2));
    
    const { title, subtitle, periods, traditions, places, events, gallery, services, exploreLinks, isActive } = body;

    // Validaciones básicas
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'El título es requerido' }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    if (!subtitle || subtitle.trim() === '') {
      return NextResponse.json({ error: 'El subtítulo es requerido' }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    const historyData: Omit<HistoryPageData, 'id'> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      periods: periods || [],
      traditions: traditions || [],
      places: places || [],
      events: events || [],
      gallery: gallery || [],
      services: services || [],
      exploreLinks: exploreLinks || [],
      isActive: isActive !== false,
    };

    const savedHistoryData = await saveHistoryPageData(historyData);

    console.log(`✅ Datos de historia guardados: ${savedHistoryData.title}`);
    return NextResponse.json({ 
      success: true, 
      id: savedHistoryData.id, 
      message: 'Datos de historia guardados exitosamente' 
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('❌ Error al guardar datos de historia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }
}
