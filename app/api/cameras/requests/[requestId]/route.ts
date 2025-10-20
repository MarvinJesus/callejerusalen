import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Obtener información del usuario
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Solo los administradores pueden gestionar solicitudes
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { action, reviewNotes } = await request.json();
    console.log('🔍 API - Procesando solicitud:', { requestId: params.requestId, action, reviewNotes });

    // Validar acción
    if (!action || !['approve', 'reject'].includes(action)) {
      console.log('❌ API - Acción no válida:', action);
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Obtener la solicitud
    const requestDoc = await db.collection('cameraAccessRequests').doc(params.requestId).get();
    if (!requestDoc.exists) {
      console.log('❌ API - Solicitud no encontrada:', params.requestId);
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    console.log('📋 API - Estado actual de la solicitud:', requestData?.status);
    
    // Verificar que la solicitud esté en un estado válido para procesar
    if (!['pending', 'approved', 'rejected'].includes(requestData?.status)) {
      console.log('❌ API - La solicitud no puede ser procesada. Estado actual:', requestData?.status);
      return NextResponse.json({ error: 'La solicitud no puede ser procesada en su estado actual' }, { status: 400 });
    }

    // Si la solicitud está aprobada y se intenta aprobar de nuevo, no permitir
    if (requestData?.status === 'approved' && action === 'approve') {
      console.log('❌ API - La solicitud ya está aprobada');
      return NextResponse.json({ error: 'La solicitud ya está aprobada' }, { status: 400 });
    }

    // Si la solicitud está rechazada y se intenta rechazar de nuevo, no permitir
    if (requestData?.status === 'rejected' && action === 'reject') {
      console.log('❌ API - La solicitud ya está rechazada');
      return NextResponse.json({ error: 'La solicitud ya está rechazada' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewTime = new Date();
    const isDisapproving = requestData?.status === 'approved' && action === 'reject';
    const isReapproving = requestData?.status === 'rejected' && action === 'approve';

    // Actualizar la solicitud
    const updateData: any = {
      status: newStatus,
      reviewedAt: reviewTime,
      reviewedBy: userData?.email || 'Administrador'
    };

    // Solo agregar reviewNotes si tiene valor
    if (reviewNotes && reviewNotes.trim()) {
      updateData.reviewNotes = reviewNotes.trim();
    }

    await db.collection('cameraAccessRequests').doc(params.requestId).update(updateData);

    // Si se aprueba (nueva aprobación o re-aprobación), agregar acceso a la cámara
    if (action === 'approve') {
      const userAccessRef = db.collection('cameraAccess').doc(requestData.userId);
      await userAccessRef.set({
        [requestData.cameraId]: {
          accessLevel: 'view',
          grantedAt: reviewTime,
          grantedBy: userData?.email || 'Administrador',
          requestId: params.requestId,
          isReapproval: isReapproving
        }
      }, { merge: true });
    }

    // Si se desaprueba (cambia de approved a rejected), remover acceso a la cámara
    if (isDisapproving) {
      const userAccessRef = db.collection('cameraAccess').doc(requestData.userId);
      const userAccessDoc = await userAccessRef.get();
      
      if (userAccessDoc.exists) {
        const userAccessData = userAccessDoc.data();
        if (userAccessData && userAccessData[requestData.cameraId]) {
          // Remover el acceso específico a esta cámara
          const updatedAccess = { ...userAccessData };
          delete updatedAccess[requestData.cameraId];
          
          if (Object.keys(updatedAccess).length === 0) {
            // Si no hay más accesos, eliminar el documento completo
            await userAccessRef.delete();
          } else {
            // Actualizar el documento con los accesos restantes
            await userAccessRef.set(updatedAccess);
          }
        }
      }
    }

    // Log de la acción
    let logAction = `camera_access_request_${action}d`;
    if (isDisapproving) {
      logAction = 'camera_access_request_disapproved';
    } else if (isReapproving) {
      logAction = 'camera_access_request_reapproved';
    }

    const logData: any = {
      action: logAction,
      userId: decodedToken.uid,
      userEmail: userData?.email,
      targetUserId: requestData.userId,
      targetUserEmail: requestData.userEmail,
      cameraId: requestData.cameraId,
      cameraName: requestData.cameraName,
      requestId: params.requestId,
      timestamp: reviewTime,
      details: {
        action,
        previousStatus: requestData?.status,
        newStatus,
        isDisapproving,
        isReapproving
      }
    };

    // Solo agregar reviewNotes si tiene valor
    if (reviewNotes && reviewNotes.trim()) {
      logData.reviewNotes = reviewNotes.trim();
      logData.details.reviewNotes = reviewNotes.trim();
    }

    await db.collection('systemLogs').add(logData);

    console.log('✅ API - Solicitud procesada exitosamente:', { requestId: params.requestId, newStatus });
    
    let message;
    if (isDisapproving) {
      message = 'Solicitud desaprobada exitosamente';
    } else if (isReapproving) {
      message = 'Solicitud re-aprobada exitosamente';
    } else {
      message = `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`;
    }

    return NextResponse.json({
      success: true,
      message,
      status: newStatus,
      isDisapproving,
      isReapproving
    });

  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Obtener información del usuario
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Solo los administradores pueden eliminar solicitudes
    if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // Obtener la solicitud antes de eliminar
    const requestDoc = await db.collection('cameraAccessRequests').doc(params.requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = requestDoc.data();

    // Eliminar la solicitud
    await db.collection('cameraAccessRequests').doc(params.requestId).delete();

    // Log de la acción
    await db.collection('systemLogs').add({
      action: 'camera_access_request_deleted',
      userId: decodedToken.uid,
      userEmail: userData?.email,
      targetUserId: requestData?.userId,
      targetUserEmail: requestData?.userEmail,
      cameraId: requestData?.cameraId,
      cameraName: requestData?.cameraName,
      requestId: params.requestId,
      timestamp: new Date(),
      details: {
        deletedBy: userData?.email,
        requestStatus: requestData?.status
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

