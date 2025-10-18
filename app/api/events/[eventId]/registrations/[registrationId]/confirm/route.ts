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
        { error: 'ID de evento y ID de registro requeridos' },
        { status: 400 }
      );
    }

    console.log(`✅ Confirmando inscripción del registro ${registrationId} para el evento ${eventId}`);

    // Actualizar el estado del registro a 'confirmed'
    await updateRegistrationStatus(registrationId, 'confirmed');

    console.log(`✅ Inscripción confirmada exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Usuario re-inscrito exitosamente'
    });

  } catch (error) {
    console.error('Error al confirmar inscripción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}












