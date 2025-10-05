import { NextRequest, NextResponse } from 'next/server';
import { getVisitorsGuideData } from '@/lib/history-service';

// GET - Obtener datos de la guía de visitantes (público)
export async function GET() {
  try {
    console.log('🔍 API pública de guía de visitantes llamada');
    const guideData = await getVisitorsGuideData();
    console.log('✅ Devolviendo datos de guía de visitantes públicos');
    return NextResponse.json({ guideData });
  } catch (error) {
    console.error('❌ Error en API pública de guía de visitantes:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la guía de visitantes' },
      { status: 500 }
    );
  }
}



