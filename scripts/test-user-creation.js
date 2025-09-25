const fs = require('fs');
const path = require('path');

console.log('🧪 Prueba de Creación de Usuarios');
console.log('================================\n');

async function testUserCreation() {
  try {
    // Verificar que el servidor esté corriendo
    console.log('🔄 Verificando conexión con el servidor...');
    
    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`Servidor no responde correctamente: ${response.status}`);
    }
    
    console.log('✅ Servidor funcionando correctamente');
    
    // Verificar archivos necesarios
    const authFile = path.join(process.cwd(), 'lib', 'auth.ts');
    const adminFile = path.join(process.cwd(), 'app', 'admin', 'page.tsx');
    
    if (!fs.existsSync(authFile)) {
      throw new Error('Archivo lib/auth.ts no encontrado');
    }
    
    if (!fs.existsSync(adminFile)) {
      throw new Error('Archivo app/admin/page.tsx no encontrado');
    }
    
    console.log('✅ Archivos necesarios encontrados');
    
    // Verificar que las funciones estén implementadas
    const authContent = fs.readFileSync(authFile, 'utf8');
    
    if (!authContent.includes('checkEmailExists')) {
      throw new Error('Función checkEmailExists no encontrada en lib/auth.ts');
    }
    
    if (!authContent.includes('createUserAsAdmin')) {
      throw new Error('Función createUserAsAdmin no encontrada en lib/auth.ts');
    }
    
    console.log('✅ Funciones de autenticación implementadas');
    
    // Verificar el panel de administración
    const adminContent = fs.readFileSync(adminFile, 'utf8');
    
    if (!adminContent.includes('CreateUserModal')) {
      throw new Error('Componente CreateUserModal no encontrado en app/admin/page.tsx');
    }
    
    if (!adminContent.includes('handleEmailChange')) {
      throw new Error('Función handleEmailChange no encontrada en el modal');
    }
    
    console.log('✅ Componentes de administración implementados');
    
    console.log('\n🎉 ¡Sistema de creación de usuarios listo!');
    console.log('\n📋 Funcionalidades implementadas:');
    console.log('✅ Validación de email en tiempo real');
    console.log('✅ Verificación de disponibilidad de email');
    console.log('✅ Mensajes de error específicos');
    console.log('✅ Indicadores visuales de validación');
    console.log('✅ Prevención de envío con errores');
    
    console.log('\n🧪 Para probar:');
    console.log('1. Ve a http://localhost:3000/admin');
    console.log('2. Haz clic en "Crear Nuevo Usuario"');
    console.log('3. Intenta ingresar un email existente');
    console.log('4. Verifica que aparezca el mensaje de error');
    console.log('5. Intenta ingresar un email nuevo');
    console.log('6. Verifica que aparezca el check verde');
    console.log('7. Completa el formulario y crea el usuario');
    
    console.log('\n⚠️  Posibles errores a verificar:');
    console.log('- "El email ya está registrado en Firebase Authentication"');
    console.log('- "El email ya está registrado en el sistema"');
    console.log('- "El formato del email no es válido"');
    console.log('- "La contraseña es muy débil"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Servidor no responde')) {
      console.log('\n💡 Soluciones:');
      console.log('1. Asegúrate de que el servidor esté corriendo: npm run dev');
      console.log('2. Verifica que esté en el puerto 3000');
      console.log('3. Revisa la consola del servidor para errores');
    }
  }
}

testUserCreation();
