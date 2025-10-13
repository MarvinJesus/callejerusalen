import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { registrationId, adminUid, reviewNotes } = await request.json();

    if (!registrationId || !adminUid || !reviewNotes) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el admin tiene permisos
    const adminDoc = await adminDb.collection('users').doc(adminUid).get();
    const adminData = adminDoc.data();

    if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    // Obtener el registro actual
    const registrationRef = adminDb.collection('securityRegistrations').doc(registrationId);
    const registrationDoc = await registrationRef.get();

    if (!registrationDoc.exists) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    const registrationData = registrationDoc.data();
    if (!registrationData) {
      return NextResponse.json(
        { error: 'Datos del registro no encontrados' },
        { status: 404 }
      );
    }

    // Verificar que el registro esté rechazado (solo se pueden editar comentarios de rechazados)
    if (registrationData.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Solo se pueden editar comentarios de solicitudes rechazadas' },
        { status: 400 }
      );
    }

    // Actualizar solo las notas de revisión y la fecha de actualización
    await registrationRef.update({
      reviewNotes: reviewNotes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Comentario actualizado en securityRegistrations:', registrationId);

    return NextResponse.json({
      success: true,
      message: 'Comentario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el comentario' },
      { status: 500 }
    );
  }
}
