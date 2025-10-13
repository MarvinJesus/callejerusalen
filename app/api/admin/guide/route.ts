import { NextRequest, NextResponse } from 'next/server';
import { getVisitorsGuideData, saveVisitorsGuideData } from '@/lib/history-service';

// GET - Obtener datos de la guía de visitantes (admin)
export async function GET() {
  try {
    console.log('🔍 API admin de guía de visitantes llamada');
    const guideData = await getVisitorsGuideData();
    console.log('✅ Devolviendo datos de guía de visitantes para admin');
    return NextResponse.json({ guideData });
  } catch (error) {
    console.error('❌ Error en API admin de guía de visitantes:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la guía de visitantes' },
      { status: 500 }
    );
  }
}

// POST - Guardar datos de la guía de visitantes (admin)
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API admin de guía de visitantes POST llamada');
    const body = await request.json();
    console.log('📝 Datos recibidos para guardar guía de visitantes:', JSON.stringify(body, null, 2));
    
    const guideData = await saveVisitorsGuideData(body);
    console.log('✅ Datos de guía de visitantes guardados exitosamente');
    
    return NextResponse.json({ 
      success: true, 
      guideData,
      message: 'Guía de visitantes actualizada exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error en API admin de guía de visitantes POST:', error);
    return NextResponse.json(
      { error: 'Error al guardar datos de la guía de visitantes' },
      { status: 500 }
    );
  }
}






