import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Obteniendo información del usuario ${userId}`);

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    console.log(`✅ Usuario obtenido: ${userData?.email}`);

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        email: userData?.email || '',
        name: userData?.name || userData?.displayName || 'Usuario sin nombre',
        role: userData?.role || 'visitante',
        status: userData?.status || 'active',
        phone: userData?.phone || '',
        address: userData?.address || '',
        permissions: userData?.permissions || [],
        createdAt: userData?.createdAt?.toDate() || new Date(),
        updatedAt: userData?.updatedAt?.toDate() || new Date()
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

