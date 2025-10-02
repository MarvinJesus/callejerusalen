import { NextRequest, NextResponse } from 'next/server';
import { getPlaces, addPlace, Place } from '@/lib/places-service';

// GET - Obtener todos los lugares
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API admin de lugares llamada');
    
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const places = await getPlaces();
    console.log(`✅ Devolviendo ${places.length} lugares para admin`);
    return NextResponse.json({ places });
  } catch (error) {
    console.error('❌ Error al obtener lugares:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo lugar
export async function POST(request: NextRequest) {
  try {
    console.log('📝 API admin crear lugar llamada');
    
    // TODO: Implementar verificación de autenticación de administrador
    // const authResult = await verifyAdminToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    console.log('📝 Datos recibidos para crear lugar:', JSON.stringify(body, null, 2));
    
    const { name, description, category, address, hours, rating, image, images, phone, website, characteristics, activities, coordinates } = body;

    // Validaciones con logging detallado
    const missingFields = [];
    if (!name || name.trim() === '') missingFields.push('name');
    if (!description || description.trim() === '') missingFields.push('description');
    if (!category || category.trim() === '') missingFields.push('category');
    if (!address || address.trim() === '') missingFields.push('address');
    if (!hours || hours.trim() === '') missingFields.push('hours');
    // La imagen es opcional, solo validamos si está presente
    // if (!image || image.trim() === '') missingFields.push('image');
    if (!coordinates) missingFields.push('coordinates');
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields);
      return NextResponse.json({ 
        error: 'Faltan campos requeridos', 
        missingFields: missingFields 
      }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      console.log('❌ Rating inválido:', rating);
      return NextResponse.json({ error: 'La calificación debe estar entre 0 y 5' }, { status: 400 });
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      console.log('❌ Coordenadas inválidas:', coordinates);
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }

    const newPlace = await addPlace({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      address: address.trim(),
      hours: hours.trim(),
      rating: Number(rating),
      image: image?.trim() || '',
      images: images || [],
      phone: phone?.trim() || '',
      website: website?.trim() || '',
      characteristics: characteristics || [],
      activities: activities || [],
      coordinates: {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      },
      isActive: true,
    });

    console.log(`✅ Lugar creado: ${newPlace.name}`);
    return NextResponse.json({ 
      success: true, 
      id: newPlace.id,
      message: 'Lugar creado exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error al crear lugar:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}