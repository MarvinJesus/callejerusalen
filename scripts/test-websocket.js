/**
 * Script de prueba para verificar si el servidor WebSocket está funcionando
 */

const io = require('socket.io-client');

console.log('🔍 Probando conexión WebSocket...\n');

const socket = io('http://localhost:3000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('✅ WebSocket CONECTADO:', socket.id);
  console.log('✅ El servidor WebSocket está funcionando correctamente\n');
  
  // Registrar usuario de prueba
  socket.emit('register', {
    userId: 'test-user-123',
    securityPlanId: 'test-plan-456'
  });
  
  console.log('📤 Enviando registro de prueba...');
});

socket.on('registered', (data) => {
  console.log('✅ Registro exitoso:', data);
  console.log('\n🎉 ¡El sistema WebSocket está OPERATIVO!\n');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ ERROR DE CONEXIÓN:', error.message);
  console.error('\n⚠️ El servidor WebSocket NO está corriendo o no está configurado correctamente\n');
  console.log('💡 Solución:');
  console.log('   1. Detener el servidor actual (Ctrl+C)');
  console.log('   2. Ejecutar: npm run dev');
  console.log('   3. Esperar a que arranque completamente');
  console.log('   4. Volver a probar\n');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

setTimeout(() => {
  if (!socket.connected) {
    console.error('❌ TIMEOUT: No se pudo conectar al servidor WebSocket\n');
    console.log('⚠️ El servidor parece estar corriendo pero NO es el servidor con WebSocket\n');
    console.log('💡 Solución:');
    console.log('   1. Presionar Ctrl+C en la terminal donde corre el servidor');
    console.log('   2. Ejecutar: npm run dev');
    console.log('   3. Verificar en los logs que diga "Socket.io iniciado"\n');
    process.exit(1);
  }
}, 5000);


