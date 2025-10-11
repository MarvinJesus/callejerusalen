import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { registrationId, adminUid, action, rejectionReason } = await request.json();

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

    // Actualizar el registro
    const updateData: any = {
      reviewedBy: adminUid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (action === 'approve') {
      updateData.status = 'active';
      updateData.reviewNotes = 'Aprobado por administrador';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.reviewNotes = rejectionReason || 'Rechazado por administrador';
    }

    await registrationRef.update(updateData);

    // Ya no actualizamos la colección users - toda la información está en securityRegistrations

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Registro aprobado exitosamente' 
        : 'Registro rechazado exitosamente'
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
