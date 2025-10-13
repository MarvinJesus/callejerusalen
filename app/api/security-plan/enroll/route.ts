import { NextRequest, NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      uid, 
      agreedToTerms,
      phoneNumber,
      address,
      availability,
      skills,
      otherSkills 
    } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'UID de usuario requerido' },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: 'Debes aceptar los términos del Plan de Seguridad' },
        { status: 400 }
      );
    }

    if (!phoneNumber || !address || !availability) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos una habilidad' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verificar que el usuario sea de tipo comunidad
    if (!userData || (userData.role !== 'comunidad' && userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Solo los residentes pueden inscribirse en el Plan de Seguridad' },
        { status: 403 }
      );
    }

    // Verificar que el usuario esté activo
    if (userData.status !== 'active') {
      return NextResponse.json(
        { error: 'Tu cuenta debe estar activa para inscribirte en el Plan de Seguridad' },
        { status: 403 }
      );
    }

    // IMPORTANTE: Verificar que NO esté ya inscrito en securityRegistrations
    const existingRegistrationsQuery = await adminDb
      .collection('securityRegistrations')
      .where('userId', '==', uid)
      .get();

    if (!existingRegistrationsQuery.empty) {
      const existingReg = existingRegistrationsQuery.docs[0].data();
      const status = existingReg.status;
      
      if (status === 'pending') {
        return NextResponse.json(
          { error: 'Ya tienes una solicitud pendiente de aprobación' },
          { status: 400 }
        );
      } else if (status === 'active') {
        return NextResponse.json(
          { error: 'Ya estás inscrito en el Plan de Seguridad' },
          { status: 400 }
        );
      } else if (status === 'rejected') {
        return NextResponse.json(
          { error: 'Tu solicitud fue rechazada. Contacta al administrador para volver a aplicar' },
          { status: 400 }
        );
      }
    }

    // Crear documento en la colección securityRegistrations
    const registrationData = {
      userId: uid,
      userDisplayName: userData.displayName || '',
      userEmail: userData.email || '',
      phoneNumber,
      address,
      availability,
      skills,
      otherSkills: otherSkills || '',
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const registrationRef = await adminDb.collection('securityRegistrations').add(registrationData);

    console.log('✅ Registro creado en securityRegistrations:', registrationRef.id);

    return NextResponse.json({
      success: true,
      message: '¡Tu solicitud ha sido enviada! Un administrador la revisará pronto.',
      registrationId: registrationRef.id,
      securityPlan: {
        id: registrationRef.id,
        status: 'pending',
        phoneNumber,
        address,
        availability,
        skills,
        otherSkills: otherSkills || '',
      },
    });
  } catch (error) {
    console.error('Error al inscribir en el plan de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al procesar la inscripción' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar el estado de inscripción
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'UID de usuario requerido' },
        { status: 400 }
      );
    }

    // Buscar en securityRegistrations
    const registrationsQuery = await adminDb
      .collection('securityRegistrations')
      .where('userId', '==', uid)
      .get();

    if (registrationsQuery.empty) {
      return NextResponse.json({
        enrolled: false,
        enrolledAt: null,
        status: null,
      });
    }

    const registration = registrationsQuery.docs[0].data();

    return NextResponse.json({
      enrolled: true,
      enrolledAt: registration.submittedAt || registration.createdAt || null,
      status: registration.status,
      registrationId: registrationsQuery.docs[0].id,
    });
  } catch (error) {
    console.error('Error al verificar inscripción:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado de inscripción' },
      { status: 500 }
    );
  }
}

