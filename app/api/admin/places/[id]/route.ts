import { NextRequest, NextResponse } from 'next/server';
import { getPlaceById, updatePlace, deletePlace } from '@/lib/places-service';

// GET - Obtener un lugar específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 API admin obtener lugar ${params.id}`);
    
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const place = await getPlaceById(params.id);
    
    if (!place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    console.log(`✅ Lugar encontrado: ${place.name}`);
    return NextResponse.json({ place });
  } catch (error) {
    console.error('❌ Error al obtener lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar un lugar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📝 API admin actualizar lugar ${params.id}`);
    
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const body = await request.json();
        const { name, description, category, address, hours, rating, image, images, phone, website, characteristics, activities, coordinates, isActive } = body;

    // Validaciones
    if (!name || !description || !category || !address || !hours || !image || !coordinates) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'La calificación debe estar entre 0 y 5' }, { status: 400 });
    }

    if (!coordinates.lat || !coordinates.lng) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      address: address.trim(),
      hours: hours.trim(),
      rating: Number(rating),
      image: image.trim(),
      images: images || [],
      phone: phone?.trim() || '',
      website: website?.trim() || '',
      characteristics: characteristics || [],
      activities: activities || [],
      coordinates: {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      },
      isActive: isActive !== undefined ? isActive : true,
    };

    const updatedPlace = await updatePlace(params.id, updateData);
    
    if (!updatedPlace) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    console.log(`✅ Lugar actualizado: ${updateData.name}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Lugar actualizado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error al actualizar lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un lugar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🗑️ API admin eliminar lugar ${params.id}`);
    
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const deletedPlace = await deletePlace(params.id);
    
    if (!deletedPlace) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    console.log(`✅ Lugar eliminado: ${deletedPlace.name}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Lugar eliminado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error al eliminar lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}