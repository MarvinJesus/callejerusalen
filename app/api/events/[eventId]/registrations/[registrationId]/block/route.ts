import { NextRequest, NextResponse } from 'next/server';
import { updateRegistrationStatus } from '@/lib/event-registration-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; registrationId: string } }
) {
  try {
    const { eventId, registrationId } = params;

    if (!eventId || !registrationId) {
      return NextResponse.json(
        { error: 'ID del evento y registro requeridos' },
        { status: 400 }
      );
    }

    console.log(`🚫 Bloqueando registro ${registrationId} del evento ${eventId}`);

    const success = await updateRegistrationStatus(
      registrationId,
      'blocked'
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Error al bloquear el registro' },
        { status: 500 }
      );
    }

    console.log(`✅ Registro ${registrationId} bloqueado exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Registro bloqueado exitosamente'
    });

  } catch (error) {
    console.error('Error al bloquear registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

