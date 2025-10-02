import { NextRequest, NextResponse } from 'next/server';
import { getEventRegistrationStats, getEventRegistrations } from '@/lib/event-registration-service';

// GET - Obtener estadísticas de inscripciones de un evento
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Validaciones básicas
    if (!eventId || eventId.trim() === '') {
      return NextResponse.json({ error: 'ID del evento es requerido' }, { status: 400 });
    }

    console.log(`📊 Obteniendo estadísticas del evento ${eventId}`);

    const stats = await getEventRegistrationStats(eventId);
    const registrations = await getEventRegistrations(eventId);

    return NextResponse.json({ 
      success: true, 
      totalRegistrations: stats.totalRegistrations,
      confirmedRegistrations: stats.confirmedRegistrations,
      pendingRegistrations: stats.pendingRegistrations,
      cancelledRegistrations: stats.cancelledRegistrations,
      blockedRegistrations: stats.blockedRegistrations,
      lastUpdated: stats.lastUpdated,
      registrations: registrations.filter(r => r.status === 'confirmed'), // Solo inscripciones confirmadas
      message: 'Estadísticas obtenidas exitosamente' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error al obtener estadísticas del evento:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
