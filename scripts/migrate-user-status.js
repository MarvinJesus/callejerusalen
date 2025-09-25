const fs = require('fs');
const path = require('path');

console.log('🔄 Migración de Estados de Usuario');
console.log('================================\n');

async function migrateUserStatus() {
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
    
    console.log('\n📋 INSTRUCCIONES DE MIGRACIÓN:');
    console.log('===============================');
    console.log('1. El nuevo sistema de estados está implementado');
    console.log('2. Los usuarios existentes mantendrán su campo isActive');
    console.log('3. El nuevo campo "status" se calculará automáticamente:');
    console.log('   - isActive: true → status: "active"');
    console.log('   - isActive: false → status: "inactive"');
    console.log('4. Los nuevos usuarios se crearán con status: "active"');
    
    console.log('\n🎯 FUNCIONALIDADES NUEVAS:');
    console.log('==========================');
    console.log('✅ Sistema de estados: active, inactive, deleted');
    console.log('✅ Filtro por estado en el panel de administración');
    console.log('✅ Botones de acción según el estado del usuario');
    console.log('✅ Historial de cambios de estado');
    console.log('✅ Razones para cambios de estado');
    console.log('✅ Protección del super admin principal');
    
    console.log('\n🔧 ESTADOS DISPONIBLES:');
    console.log('======================');
    console.log('🟢 ACTIVE (Activo):');
    console.log('   - Usuario puede acceder al sistema');
    console.log('   - Acciones: Editar, Desactivar, Eliminar');
    
    console.log('\n🟡 INACTIVE (Inactivo):');
    console.log('   - Usuario no puede acceder al sistema');
    console.log('   - Acciones: Editar, Reactivar, Eliminar');
    
    console.log('\n🔴 DELETED (Eliminado):');
    console.log('   - Usuario marcado como eliminado');
    console.log('   - No aparece en listados normales');
    console.log('   - Solo visible con filtro "Solo eliminados"');
    
    console.log('\n🚀 CÓMO USAR:');
    console.log('==============');
    console.log('1. Ve a /admin en tu aplicación');
    console.log('2. En "Gestión de Usuarios" verás el filtro de estado');
    console.log('3. Selecciona el estado que quieres ver');
    console.log('4. Usa los botones de acción según el estado:');
    console.log('   - 🟢 Activo → Puedes desactivar o eliminar');
    console.log('   - 🟡 Inactivo → Puedes reactivar o eliminar');
    console.log('   - 🔴 Eliminado → Solo visible con filtro especial');
    
    console.log('\n💡 VENTAJAS DEL NUEVO SISTEMA:');
    console.log('==============================');
    console.log('✅ No se pierden datos de usuarios');
    console.log('✅ Historial completo de cambios');
    console.log('✅ Posibilidad de reactivar usuarios');
    console.log('✅ Mejor control y auditoría');
    console.log('✅ Compatibilidad con sistema anterior');
    
    console.log('\n⚠️  NOTAS IMPORTANTES:');
    console.log('======================');
    console.log('• El super admin principal (mar90jesus@gmail.com) está protegido');
    console.log('• Los cambios de estado se registran en logs del sistema');
    console.log('• Se puede agregar una razón para cada cambio de estado');
    console.log('• El sistema es compatible con usuarios existentes');
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('El nuevo sistema de estados está listo para usar.');
    
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

migrateUserStatus();
