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

    // IMPORTANTE: Verificar que NO esté ya inscrito
    if (userData.securityPlan && userData.securityPlan.enrolled) {
      const status = userData.securityPlan.status;
      if (status === 'pending') {
        return NextResponse.json(
          { error: 'Ya tienes una solicitud pendiente de aprobación' },
          { status: 400 }
        );
      } else if (status === 'approved') {
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

    // Actualizar el perfil del usuario con la inscripción al plan
    // IMPORTANTE: La inscripción queda como 'pending' hasta que un admin la apruebe
    await userRef.update({
      'securityPlan.enrolled': true,
      'securityPlan.enrolledAt': admin.firestore.FieldValue.serverTimestamp(),
      'securityPlan.agreedToTerms': true,
      'securityPlan.phoneNumber': phoneNumber,
      'securityPlan.address': address,
      'securityPlan.availability': availability,
      'securityPlan.skills': skills,
      'securityPlan.otherSkills': otherSkills || '',
      'securityPlan.status': 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: '¡Tu solicitud ha sido enviada! Un administrador la revisará pronto.',
      securityPlan: {
        enrolled: true,
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

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      enrolled: userData?.securityPlan?.enrolled || false,
      enrolledAt: userData?.securityPlan?.enrolledAt || null,
      agreedToTerms: userData?.securityPlan?.agreedToTerms || false,
    });
  } catch (error) {
    console.error('Error al verificar inscripción:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado de inscripción' },
      { status: 500 }
    );
  }
}

