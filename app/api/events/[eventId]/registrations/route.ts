import { NextRequest, NextResponse } from 'next/server';
import { getEventRegistrations } from '@/lib/event-registration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID del evento requerido' },
        { status: 400 }
      );
    }

    console.log(`📋 Obteniendo inscripciones del evento ${eventId}`);

    const registrations = await getEventRegistrations(eventId);

    console.log(`✅ Obtenidas ${registrations.length} inscripciones del evento ${eventId}`);

    return NextResponse.json({
      success: true,
      registrations: registrations.map(reg => ({
        id: reg.id,
        eventId: reg.eventId,
        userId: reg.userId,
        userEmail: reg.userEmail,
        userName: reg.userName,
        registrationDate: reg.registrationDate,
        status: reg.status,
        notes: reg.notes,
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error al obtener inscripciones del evento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



















