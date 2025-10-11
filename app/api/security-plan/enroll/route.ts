import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { uid, agreedToTerms } = await request.json();

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

    // Verificar que el usuario existe
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verificar que el usuario sea de tipo comunidad
    if (userData.role !== 'comunidad' && userData.role !== 'admin' && userData.role !== 'super_admin') {
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

    // Actualizar el perfil del usuario con la inscripción al plan
    await updateDoc(userRef, {
      securityPlan: {
        enrolled: true,
        enrolledAt: new Date(),
        agreedToTerms: true,
      },
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: '¡Te has inscrito exitosamente en el Plan de Seguridad de la Comunidad!',
      securityPlan: {
        enrolled: true,
        enrolledAt: new Date(),
        agreedToTerms: true,
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

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      enrolled: userData.securityPlan?.enrolled || false,
      enrolledAt: userData.securityPlan?.enrolledAt || null,
      agreedToTerms: userData.securityPlan?.agreedToTerms || false,
    });
  } catch (error) {
    console.error('Error al verificar inscripción:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado de inscripción' },
      { status: 500 }
    );
  }
}

