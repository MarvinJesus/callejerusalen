import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      uid, // UID del usuario a aprobar/rechazar
      adminUid, // UID del administrador que aprueba/rechaza
      action, // 'approve' o 'reject'
      rejectionReason // Solo para 'reject'
    } = await request.json();

    if (!uid || !adminUid || !action) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser "approve" o "reject"' },
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
        { error: 'No tienes permisos para aprobar/rechazar inscripciones' },
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

    // Actualizar el estado de la inscripción en securityRegistrations
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === 'approve') {
      updateData.status = 'active';
      updateData.reviewedBy = adminUid;
      updateData.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updateData.status = 'rejected';
      updateData.reviewedBy = adminUid;
      updateData.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.reviewNotes = rejectionReason || 'No se proporcionó razón';
    }

    await registrationDoc.ref.update(updateData);

    console.log(`✅ Registro ${action === 'approve' ? 'aprobado' : 'rechazado'} en securityRegistrations:`, registrationDoc.id);

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Inscripción aprobada exitosamente' 
        : 'Inscripción rechazada',
      action,
      userEmail: registrationData.userEmail,
      userName: registrationData.userDisplayName,
      registrationId: registrationDoc.id,
    });
  } catch (error) {
    console.error('Error al procesar aprobación/rechazo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

