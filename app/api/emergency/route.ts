import { NextResponse } from 'next/server';
import { getEmergencyInfo } from '@/lib/emergency-service';

// GET - Información pública de emergencia (área segura)
export async function GET() {
  try {
    const data = await getEmergencyInfo();
    return NextResponse.json({ emergency: data });
  } catch (error) {
    console.error('❌ Error al obtener información de emergencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


