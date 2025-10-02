// Script para probar la funcionalidad de lugares desde el navegador
console.log('🧪 Script de prueba de la interfaz de lugares');
console.log('');

console.log('📋 Instrucciones para probar:');
console.log('');
console.log('1. 🌐 Página de Visitantes:');
console.log('   - Abre: http://localhost:3000/visitantes/lugares');
console.log('   - Deberías ver 3 lugares: Mirador de la Cruz, Pulpería El Progreso, Parque Central');
console.log('   - Prueba los filtros por categoría');
console.log('   - Prueba la búsqueda');
console.log('');

console.log('2. ⚙️ Página Administrativa:');
console.log('   - Abre: http://localhost:3000/admin/places');
console.log('   - Deberías ver los mismos 3 lugares en la interfaz administrativa');
console.log('   - Prueba crear un nuevo lugar con el botón "Nuevo Lugar"');
console.log('   - Prueba editar un lugar existente');
console.log('   - Prueba activar/desactivar lugares');
console.log('');

console.log('3. 🔗 Navegación:');
console.log('   - Desde el navbar, los administradores deberían ver el enlace "Lugares"');
console.log('   - Los visitantes deberían ver el enlace "Lugares" en la sección de visitantes');
console.log('');

console.log('4. 📱 Responsive:');
console.log('   - Prueba en diferentes tamaños de pantalla');
console.log('   - Verifica que los formularios se vean bien en móvil');
console.log('');

console.log('✅ Si todo funciona correctamente, el módulo de lugares está completo!');
console.log('');

// Función para probar la API directamente
async function testAPI() {
  try {
    console.log('🔍 Probando APIs...');
    
    // Probar API pública
    const publicResponse = await fetch('http://localhost:3000/api/places');
    const publicData = await publicResponse.json();
    console.log(`✅ API pública: ${publicData.places.length} lugares`);
    
    // Probar API administrativa
    const adminResponse = await fetch('http://localhost:3000/api/admin/places');
    const adminData = await adminResponse.json();
    console.log(`✅ API administrativa: ${adminData.places.length} lugares`);
    
    console.log('');
    console.log('🎉 ¡Las APIs funcionan correctamente!');
    
  } catch (error) {
    console.error('❌ Error al probar APIs:', error);
  }
}

// Ejecutar prueba de API si estamos en el navegador
if (typeof window !== 'undefined') {
  testAPI();
}
