import { NextRequest, NextResponse } from 'next/server';
import { registerUserToEvent, unregisterUserFromEvent, getUserEventRegistration } from '@/lib/event-registration-service';

// POST - Inscribir usuario a un evento
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await request.json();
    const { userId, userEmail, userName, notes } = body;

    // Validaciones básicas
    if (!eventId || eventId.trim() === '') {
      return NextResponse.json({ error: 'ID del evento es requerido' }, { status: 400 });
    }

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 });
    }

    if (!userEmail || userEmail.trim() === '') {
      return NextResponse.json({ error: 'Email del usuario es requerido' }, { status: 400 });
    }

    if (!userName || userName.trim() === '') {
      return NextResponse.json({ error: 'Nombre del usuario es requerido' }, { status: 400 });
    }

    console.log(`📝 Inscribiendo usuario ${userId} al evento ${eventId}`);

    const registration = await registerUserToEvent(eventId, userId, userEmail, userName, notes);

    return NextResponse.json({ 
      success: true, 
      registration,
      message: 'Usuario inscrito exitosamente al evento' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error al inscribir usuario al evento:', error);
    
    if (error.message === 'El usuario ya está inscrito a este evento') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// DELETE - Desinscribir usuario de un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await request.json();
    const { userId } = body;

    // Validaciones básicas
    if (!eventId || eventId.trim() === '') {
      return NextResponse.json({ error: 'ID del evento es requerido' }, { status: 400 });
    }

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 });
    }

    console.log(`📝 Desinscribiendo usuario ${userId} del evento ${eventId}`);

    const success = await unregisterUserFromEvent(eventId, userId);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Usuario desinscrito exitosamente del evento' 
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: 'Error al desinscribir usuario' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error al desinscribir usuario del evento:', error);
    
    if (error.message === 'El usuario no está inscrito a este evento') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// GET - Verificar estado de inscripción del usuario
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validaciones básicas
    if (!eventId || eventId.trim() === '') {
      return NextResponse.json({ error: 'ID del evento es requerido' }, { status: 400 });
    }

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'ID del usuario es requerido' }, { status: 400 });
    }

    console.log(`📝 Verificando inscripción del usuario ${userId} al evento ${eventId}`);

    const registration = await getUserEventRegistration(eventId, userId);

    return NextResponse.json({ 
      success: true, 
      isRegistered: !!registration && registration.status === 'confirmed',
      registrationStatus: registration?.status || null,
      registration: registration || null
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error al verificar inscripción del usuario:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
