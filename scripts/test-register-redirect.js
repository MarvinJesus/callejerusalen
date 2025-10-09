#!/usr/bin/env node

/**
 * Guía de Prueba: Redirección al Login Después del Registro
 * 
 * Esta guía te ayuda a verificar que el flujo de registro
 * redirige correctamente al login.
 * 
 * Uso:
 *   node scripts/test-register-redirect.js
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

console.log(`\n${'='.repeat(70)}`);
console.log(`${colors.bright}${colors.cyan}🧪 PRUEBA: REDIRECCIÓN AL LOGIN DESPUÉS DEL REGISTRO${colors.reset}`);
console.log(`${'='.repeat(70)}\n`);

console.log(`${colors.yellow}Esta guía te ayudará a verificar que el flujo de registro${colors.reset}`);
console.log(`${colors.yellow}redirige correctamente al login.${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.magenta}📋 PREPARACIÓN${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.cyan}1.${colors.reset} Asegúrate de que el servidor esté corriendo:\n`);
console.log(`   ${colors.bright}npm run dev${colors.reset}\n`);

console.log(`${colors.cyan}2.${colors.reset} Abre el navegador en modo incógnito (recomendado)\n`);

console.log(`${colors.cyan}3.${colors.reset} Abre la consola del navegador (F12 → Console)\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.green}🚀 PASO 1: REGISTRAR USUARIO${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}1.${colors.reset} Ve a la página de registro:\n`);
console.log(`   ${colors.cyan}http://localhost:3000/register${colors.reset}\n`);

console.log(`${colors.yellow}2.${colors.reset} Completa el formulario con datos de prueba:\n`);
console.log(`   ${colors.bright}Nombre:${colors.reset} Usuario Prueba`);
console.log(`   ${colors.bright}Email:${colors.reset} prueba-redirect-${Date.now()}@test.com`);
console.log(`   ${colors.bright}Contraseña:${colors.reset} test123456`);
console.log(`   ${colors.bright}Confirmar:${colors.reset} test123456\n`);

console.log(`${colors.yellow}3.${colors.reset} ${colors.bright}ANTES de hacer click${colors.reset}, verifica en consola que esté limpia\n`);

console.log(`${colors.yellow}4.${colors.reset} Click en ${colors.bright}"Enviar Solicitud de Registro"${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.green}✅ PASO 2: VERIFICAR LOGS EN CONSOLA${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}Deberías ver esta secuencia en la consola:${colors.reset}\n`);

console.log(`${colors.cyan}1.${colors.reset} ${colors.bright}"📝 Iniciando proceso de registro..."${colors.reset}`);
console.log(`${colors.cyan}2.${colors.reset} ${colors.bright}"✅ Usuario registrado exitosamente"${colors.reset}`);
console.log(`${colors.cyan}3.${colors.reset} ${colors.bright}"🚪 Cerrando sesión para redirigir al login..."${colors.reset}`);
console.log(`${colors.cyan}4.${colors.reset} ${colors.bright}"⏳ Esperando para asegurar logout completo..."${colors.reset}`);
console.log(`${colors.cyan}5.${colors.reset} ${colors.bright}"↪️ Redirigiendo al login..."${colors.reset}\n`);

console.log(`${colors.yellow}Si ves ${colors.red}"❌ Error en API de registro"${colors.yellow}, algo falló.${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.green}🔄 PASO 3: VERIFICAR REDIRECCIÓN${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}Después de ~4-5 segundos, verifica:${colors.reset}\n`);

console.log(`${colors.green}✅${colors.reset} ${colors.bright}La URL cambió a:${colors.reset}`);
console.log(`   ${colors.cyan}http://localhost:3000/login?registered=true${colors.reset}\n`);

console.log(`${colors.green}✅${colors.reset} ${colors.bright}Viste toast verde:${colors.reset}`);
console.log(`   "¡Registro exitoso! Ahora inicia sesión con tus credenciales."\n`);

console.log(`${colors.green}✅${colors.reset} ${colors.bright}Viste otro toast:${colors.reset}`);
console.log(`   "¡Bienvenido! Inicia sesión para continuar."\n`);

console.log(`${colors.green}✅${colors.reset} ${colors.bright}La página de login se cargó correctamente${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.green}🔐 PASO 4: PROBAR LOGIN${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}1.${colors.reset} En la página de login, ingresa las credenciales:\n`);
console.log(`   ${colors.bright}Email:${colors.reset} (el que usaste para registrarte)`);
console.log(`   ${colors.bright}Password:${colors.reset} test123456\n`);

console.log(`${colors.yellow}2.${colors.reset} Click en ${colors.bright}"Iniciar Sesión"${colors.reset}\n`);

console.log(`${colors.yellow}3.${colors.reset} ${colors.bright}${colors.magenta}VERIFICA EL BANNER AMARILLO:${colors.reset}\n`);

console.log(`   ${colors.green}✅${colors.reset} Banner amarillo aparece en la parte superior`);
console.log(`   ${colors.green}✅${colors.reset} Icono: ⏳`);
console.log(`   ${colors.green}✅${colors.reset} Mensaje: "⏳ Cuenta Pendiente de Aprobación..."`);
console.log(`   ${colors.green}✅${colors.reset} Duración: 15 segundos`);
console.log(`   ${colors.green}✅${colors.reset} Botón X para cerrar\n`);

console.log(`${colors.yellow}4.${colors.reset} En consola del navegador, verifica:\n`);
console.log(`   ${colors.cyan}"⏳ Usuario con registro PENDING detectado"${colors.reset}`);
console.log(`   ${colors.cyan}"✅ Login permitido para usuario con status: pending"${colors.reset}`);
console.log(`   ${colors.cyan}"✅ Banner amarillo mostrado para usuario pending"${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.cyan}📊 CHECKLIST COMPLETO${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}Registro:${colors.reset}`);
console.log(`  [ ] Formulario completado`);
console.log(`  [ ] Click en "Enviar Solicitud"`);
console.log(`  [ ] Logs aparecen en orden correcto`);
console.log(`  [ ] No hay errores en rojo\n`);

console.log(`${colors.yellow}Redirección:${colors.reset}`);
console.log(`  [ ] URL cambió a /login?registered=true`);
console.log(`  [ ] Toast: "¡Registro exitoso!..."`);
console.log(`  [ ] Toast: "¡Bienvenido! Inicia sesión..."`);
console.log(`  [ ] Página de login cargada\n`);

console.log(`${colors.yellow}Login:${colors.reset}`);
console.log(`  [ ] Credenciales ingresadas`);
console.log(`  [ ] Login exitoso`);
console.log(`  [ ] Banner amarillo visible`);
console.log(`  [ ] Mensaje de cuenta pendiente`);
console.log(`  [ ] Duración: 15 segundos\n`);

console.log(`${colors.yellow}Consola:${colors.reset}`);
console.log(`  [ ] Logs de registro visibles`);
console.log(`  [ ] Log: "↪️ Redirigiendo al login..."`);
console.log(`  [ ] Log: "👋 Usuario viene del registro"`);
console.log(`  [ ] Log: "⏳ Usuario con registro PENDING..."`);
console.log(`  [ ] Sin errores\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.red}❌ SI ALGO FALLA${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.yellow}Problema: No redirige al login${colors.reset}\n`);

console.log(`${colors.cyan}Verifica:${colors.reset}`);
console.log(`  1. Que no haya errores en consola (F12)`);
console.log(`  2. Busca "❌ Error en API de registro"`);
console.log(`  3. Verifica que el servidor esté corriendo`);
console.log(`  4. Limpia caché: Ctrl+Shift+R\n`);

console.log(`${colors.cyan}Busca estos logs:${colors.reset}`);
console.log(`  ${colors.green}✅${colors.reset} "📝 Iniciando proceso de registro..."`);
console.log(`  ${colors.green}✅${colors.reset} "✅ Usuario registrado exitosamente"`);
console.log(`  ${colors.green}✅${colors.reset} "🚪 Cerrando sesión..."`);
console.log(`  ${colors.green}✅${colors.reset} "⏳ Esperando..."`);
console.log(`  ${colors.green}✅${colors.reset} "↪️ Redirigiendo al login..."\n`);

console.log(`${colors.red}Si NO ves "↪️ Redirigiendo al login...", el problema está${colors.reset}`);
console.log(`${colors.red}antes de la redirección (probablemente un error en registro).${colors.reset}\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.green}✨ RESULTADO ESPERADO${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.green}Si todo funciona correctamente:${colors.reset}\n`);

console.log(`${colors.bright}1.${colors.reset} Registro se completa sin errores`);
console.log(`${colors.bright}2.${colors.reset} Sistema redirige automáticamente al login`);
console.log(`${colors.bright}3.${colors.reset} URL contiene ?registered=true`);
console.log(`${colors.bright}4.${colors.reset} Toasts de éxito aparecen`);
console.log(`${colors.bright}5.${colors.reset} Login funciona correctamente`);
console.log(`${colors.bright}6.${colors.reset} Banner amarillo aparece 15 segundos`);
console.log(`${colors.bright}7.${colors.reset} Usuario puede navegar con acceso limitado\n`);

console.log(`${'─'.repeat(70)}`);
console.log(`${colors.bright}${colors.magenta}⏱️ TIEMPOS ESPERADOS${colors.reset}`);
console.log(`${'─'.repeat(70)}\n`);

console.log(`${colors.cyan}Desde que haces click en "Enviar Solicitud" hasta login:${colors.reset}\n`);

console.log(`  ${colors.yellow}0s:${colors.reset} Click en "Enviar Solicitud"`);
console.log(`  ${colors.yellow}0-2s:${colors.reset} Registro en proceso...`);
console.log(`  ${colors.yellow}2s:${colors.reset} Toast: "¡Registro exitoso!"`);
console.log(`  ${colors.yellow}3.5s:${colors.reset} Redirección al login`);
console.log(`  ${colors.yellow}4s:${colors.reset} Página de login cargada`);
console.log(`  ${colors.yellow}4s:${colors.reset} Toast: "¡Bienvenido!"\n`);

console.log(`${colors.green}Total: ~4-5 segundos desde registro hasta ver login${colors.reset}\n`);

console.log(`${'='.repeat(70)}\n`);
console.log(`${colors.bright}${colors.green}🎯 ¡Listo para probar!${colors.reset}\n`);
console.log(`${colors.cyan}Sigue los pasos de arriba y verifica cada punto.${colors.reset}\n`);
console.log(`${colors.yellow}💡 Tip: Usa modo incógnito para evitar conflictos${colors.reset}`);
console.log(`${colors.yellow}   con sesiones anteriores.${colors.reset}\n`);

console.log(`${colors.green}¡Buena suerte! 🍀${colors.reset}\n`);

