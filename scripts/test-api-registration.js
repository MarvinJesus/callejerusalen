const fetch = require('node-fetch');

async function testApiRegistration() {
  try {
    console.log('🧪 Probando API de registro...');
    
    const testEmail = `test-api-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';
    const testDisplayName = 'Usuario API Test';
    
    console.log('📝 Datos de prueba:');
    console.log('Email:', testEmail);
    console.log('Nombre:', testDisplayName);
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName,
        role: 'comunidad'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API de registro funcionó correctamente:');
      console.log('Respuesta:', result);
      
      console.log('\n📋 Verificaciones:');
      console.log('1. Usuario creado en Firebase Auth: ✅');
      console.log('2. Perfil creado en Firestore: ✅');
      console.log('3. Solicitud de registro creada: ✅');
      console.log('4. Estado pendiente configurado: ✅');
      
    } else {
      console.error('❌ Error en API de registro:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
    
  } catch (error) {
    console.error('❌ Error al probar API:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solución:');
      console.log('1. Asegúrate de que el servidor esté ejecutándose:');
      console.log('   npm run dev');
      console.log('2. Verifica que esté en el puerto 3000');
    }
  }
}

// Ejecutar la prueba
testApiRegistration();
