import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      uid, // UID del usuario cuya solicitud se eliminará
      adminUid, // UID del administrador que elimina
    } = await request.json();

    if (!uid || !adminUid) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar que el admin existe y tiene permisos
    const adminRef = adminDb.collection('users').doc(adminUid);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Administrador no encontrado' },
        { status: 404 }
      );
    }

    const adminData = adminDoc.data();

    // Verificar que es admin o super_admin
    if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar solicitudes' },
        { status: 403 }
      );
    }

    // Buscar el registro en securityRegistrations
    const registrationsQuery = await adminDb
      .collection('securityRegistrations')
      .where('userId', '==', uid)
      .get();

    if (registrationsQuery.empty) {
      return NextResponse.json(
        { error: 'El usuario no tiene una solicitud de inscripción' },
        { status: 400 }
      );
    }

    const registrationDoc = registrationsQuery.docs[0];
    const registrationData = registrationDoc.data();

    // Eliminar el documento de securityRegistrations
    await registrationDoc.ref.delete();

    console.log('✅ Registro eliminado de securityRegistrations:', registrationDoc.id);

    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente',
      userEmail: registrationData.userEmail,
      userName: registrationData.userDisplayName,
      registrationId: registrationDoc.id,
    });
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

