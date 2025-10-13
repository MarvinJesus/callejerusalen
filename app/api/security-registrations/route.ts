import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los registros de securityRegistrations
    const registrationsSnapshot = await adminDb.collection('securityRegistrations').get();
    
    const registrations = registrationsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convertir timestamps de Firestore a fechas ISO
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Error al obtener registros de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al cargar los registros de seguridad' },
      { status: 500 }
    );
  }
}
