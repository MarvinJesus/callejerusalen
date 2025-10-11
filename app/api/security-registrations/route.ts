import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los registros de securityRegistrations
    const registrationsSnapshot = await adminDb.collection('securityRegistrations').get();
    
    const registrations = registrationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
