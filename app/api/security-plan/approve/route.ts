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

    // Verificar que el usuario a aprobar/rechazar existe
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verificar que el usuario tiene una solicitud pendiente
    if (!userData || !userData.securityPlan || !userData.securityPlan.enrolled) {
      return NextResponse.json(
        { error: 'El usuario no tiene una solicitud de inscripción' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la inscripción
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === 'approve') {
      updateData['securityPlan.status'] = 'approved';
      updateData['securityPlan.approvedBy'] = adminUid;
      updateData['securityPlan.approvedAt'] = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updateData['securityPlan.status'] = 'rejected';
      updateData['securityPlan.rejectedBy'] = adminUid;
      updateData['securityPlan.rejectedAt'] = admin.firestore.FieldValue.serverTimestamp();
      updateData['securityPlan.rejectionReason'] = rejectionReason || 'No se proporcionó razón';
    }

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Inscripción aprobada exitosamente' 
        : 'Inscripción rechazada',
      action,
      userEmail: userData.email,
      userName: userData.displayName,
    });
  } catch (error) {
    console.error('Error al procesar aprobación/rechazo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

