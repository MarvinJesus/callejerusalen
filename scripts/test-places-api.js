// Script para probar la API de lugares
const fetch = require('node-fetch');

async function testPlacesAPI() {
  try {
    console.log('🧪 Probando API de lugares...');
    
    // Probar endpoint de todos los lugares
    console.log('\n1. Probando GET /api/places');
    const response = await fetch('http://localhost:3000/api/places');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Respuesta exitosa: ${data.places.length} lugares encontrados`);
    
    // Mostrar los lugares encontrados
    data.places.forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.name} (ID: ${place.id})`);
    });
    
    // Probar endpoint de lugar específico con el primer ID
    if (data.places.length > 0) {
      const firstPlace = data.places[0];
      console.log(`\n2. Probando GET /api/places/${firstPlace.id}`);
      
      const placeResponse = await fetch(`http://localhost:3000/api/places/${firstPlace.id}`);
      
      if (!placeResponse.ok) {
        throw new Error(`HTTP ${placeResponse.status}: ${placeResponse.statusText}`);
      }
      
      const placeData = await placeResponse.json();
      console.log(`✅ Lugar específico encontrado: ${placeData.place.name}`);
      console.log(`   Descripción: ${placeData.place.description.substring(0, 100)}...`);
    }
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testPlacesAPI();