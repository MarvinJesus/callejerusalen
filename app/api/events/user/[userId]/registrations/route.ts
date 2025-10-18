import { NextRequest, NextResponse } from 'next/server';
import { getUserEventRegistrations } from '@/lib/event-registration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    console.log(`📋 Obteniendo inscripciones del usuario ${userId}`);

    const registrations = await getUserEventRegistrations(userId);

    console.log(`✅ Obtenidas ${registrations.length} inscripciones del usuario ${userId}`);

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
    console.error('Error al obtener inscripciones del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}












