import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    const { registrationId, adminUid } = await request.json();

    if (!registrationId || !adminUid) {
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

    // Obtener el registro antes de eliminarlo
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

    // Eliminar el registro
    await registrationRef.delete();

    // Ya no actualizamos la colección users - toda la información está en securityRegistrations

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar el registro:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el registro' },
      { status: 500 }
    );
  }
}
