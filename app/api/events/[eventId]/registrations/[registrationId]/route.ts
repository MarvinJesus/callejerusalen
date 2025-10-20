import { NextRequest, NextResponse } from 'next/server';
import { deleteEventRegistration } from '@/lib/event-registration-service';

export async function DELETE(
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

    console.log(`🗑️ Eliminando registro ${registrationId} del evento ${eventId} permanentemente`);

    // Eliminar el registro permanentemente
    await deleteEventRegistration(registrationId);

    console.log(`✅ Registro eliminado permanentemente`);

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado permanentemente'
    });

  } catch (error) {
    console.error('Error al eliminar registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
















