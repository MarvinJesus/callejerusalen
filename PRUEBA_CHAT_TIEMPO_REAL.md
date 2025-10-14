# Prueba Rápida: Chat de Emergencia en Tiempo Real

## Pasos para Probar la Solución

### 1. Iniciar el Servidor

```bash
npm run dev
```

Este comando inicia tanto el servidor Next.js como el servidor WebSocket.

### 2. Verificar la Conexión WebSocket

1. Abre el navegador en `http://localhost:3000`
2. Abre las **Herramientas de Desarrollo** (F12)
3. Ve a la pestaña **Console**
4. Busca el mensaje: `✅ WebSocket conectado: [socket-id]`

Si ves este mensaje, el WebSocket está funcionando correctamente.

### 3. Preparar dos usuarios

Para probar el chat en tiempo real, necesitas dos usuarios:

#### Opción A: Dos Navegadores Diferentes
- Usuario 1: Chrome (normal)
- Usuario 2: Chrome (ventana de incógnito) o Firefox

#### Opción B: Dos Perfiles de Chrome
- Abre Chrome
- Crea un nuevo perfil (Settings → Users → Add)
- Abre dos ventanas de Chrome, cada una con un perfil diferente

### 4. Crear una Alerta de Pánico

**En la ventana del Usuario 1:**

1. Inicia sesión con un usuario inscrito en el Plan de Seguridad
2. Ve a `/residentes/panico`
3. Asegúrate de tener la configuración de contactos lista
4. En la pestaña "Botón de Pánico", activa una alerta
5. Deberías ser redirigido a la página `/residentes/panico/activa/[id]`

### 5. Unirse al Chat como Usuario 2

**En la ventana del Usuario 2:**

1. Inicia sesión con un usuario que esté en los contactos del Usuario 1
2. Deberías ver un modal o notificación de la alerta de pánico
3. Haz clic en "Ver Detalles" o accede directamente a `/residentes/panico/activa/[id]`
   - (usa el mismo ID de la alerta que creó el Usuario 1)

### 6. Probar el Chat en Tiempo Real

**Usuario 1 envía un mensaje:**
```
"Hola, necesito ayuda urgente"
```

**Verificar:**
- ✅ El Usuario 2 debe ver el mensaje **INMEDIATAMENTE** sin refrescar la página
- ✅ El mensaje debe aparecer con el estilo correcto (rojo con efecto neón para el emisor)

**Usuario 2 responde:**
```
"Ya voy en camino, dame 2 minutos"
```

**Verificar:**
- ✅ El Usuario 1 debe ver la respuesta **INMEDIATAMENTE** sin refrescar
- ✅ El mensaje debe aparecer con el estilo correcto (azul si es tuyo, gris si es de otro)

**Continuar la conversación:**
- Envía varios mensajes de ida y vuelta
- Verifica que todos aparecen en tiempo real
- No debe ser necesario refrescar la página en ningún momento

### 7. Verificar los Logs en la Consola

**En la Consola del Navegador (Usuario 1):**
```
📚 Cargando mensajes históricos iniciales...
💬 Configurando chat WebSocket para alerta abc123 (Socket: xyz789, Conectado: true)
📡 Registrando listeners de WebSocket para chat...
💾 Mensaje guardado en Firestore: msg_id_123
💬 Nuevo mensaje recibido vía WebSocket: {...}
✅ Mensaje agregado al chat. Total mensajes: 1
```

**En la Consola del Navegador (Usuario 2):**
```
📚 Cargando mensajes históricos iniciales...
📚 Cargados 1 mensajes históricos
💬 Configurando chat WebSocket para alerta abc123 (Socket: xyz789, Conectado: true)
📡 Registrando listeners de WebSocket para chat...
💬 Nuevo mensaje recibido vía WebSocket: {...}
✅ Mensaje agregado al chat. Total mensajes: 2
```

**En la Consola del Servidor (Terminal):**
```
💬 Usuario [Usuario1] se unió al chat de alerta abc123
🏠 Sala: alert_chat_abc123
💬 Usuario [Usuario2] se unió al chat de alerta abc123
💬 Mensaje en chat abc123: Usuario1 -> Hola, necesito ayuda urgente
💬 Mensaje en chat abc123: Usuario2 -> Ya voy en camino, dame 2 minutos
```

### 8. Probar con Múltiples Usuarios (Opcional)

Si tienes acceso a más navegadores o dispositivos:

1. Abre la misma alerta en 3 o más ventanas (usuarios diferentes)
2. Envía mensajes desde cada usuario
3. Verifica que todos los usuarios ven todos los mensajes en tiempo real

### 9. Probar la Reconexión (Opcional)

**Simular pérdida de conexión:**

1. Con la alerta activa y el chat abierto
2. En la terminal del servidor, presiona `Ctrl+C` para detener el servidor
3. En el navegador, verifica que aparece el indicador "Offline" (icono rojo)
4. En la terminal, ejecuta `npm run dev` nuevamente
5. El navegador debería reconectarse automáticamente (icono verde)
6. Envía un mensaje y verifica que funciona

## Checklist de Verificación

### ✅ Funcionalidad Básica
- [ ] El servidor WebSocket se inicia correctamente
- [ ] Los usuarios pueden conectarse al WebSocket
- [ ] Se puede crear una alerta de pánico
- [ ] Los usuarios notificados pueden acceder a la página de la alerta

### ✅ Chat en Tiempo Real
- [ ] Los mensajes aparecen instantáneamente sin refrescar
- [ ] Los mensajes se muestran en el orden correcto
- [ ] Los estilos visuales son correctos (neón para emisor, azul para usuario, gris para otros)
- [ ] El scroll automático funciona (va al último mensaje)
- [ ] No hay mensajes duplicados

### ✅ Múltiples Usuarios
- [ ] Varios usuarios pueden estar en el mismo chat simultáneamente
- [ ] Todos ven todos los mensajes en tiempo real
- [ ] Los mensajes se distinguen correctamente por emisor

### ✅ Persistencia
- [ ] Los mensajes se guardan en Firestore
- [ ] Al refrescar la página, los mensajes históricos se cargan correctamente
- [ ] Los mensajes históricos se ordenan por timestamp

### ✅ Manejo de Errores
- [ ] Si el WebSocket se desconecta, aparece el indicador "Offline"
- [ ] El sistema intenta reconectarse automáticamente
- [ ] Los mensajes siguen funcionando después de reconectar

### ✅ UI/UX
- [ ] El indicador de conexión es visible (Wifi icono verde/rojo)
- [ ] El botón de enviar se deshabilita mientras se envía el mensaje
- [ ] Los mensajes tienen timestamps legibles
- [ ] La experiencia es fluida y sin retrasos notables

## Problemas Comunes y Soluciones

### ❌ Problema: "Socket no disponible o no conectado"

**Causa**: El servidor WebSocket no está iniciado o hay un error de conexión.

**Solución**:
1. Verifica que el servidor está corriendo: `npm run dev`
2. Verifica que el puerto 3000 está disponible
3. Revisa la consola del servidor en busca de errores

### ❌ Problema: Los mensajes no aparecen en tiempo real

**Causa**: Los listeners de WebSocket no se registraron correctamente.

**Solución**:
1. Abre la consola del navegador
2. Busca el mensaje "📡 Registrando listeners de WebSocket para chat..."
3. Si no aparece, verifica que `isConnected === true`
4. Recarga la página

### ❌ Problema: Mensajes duplicados

**Causa**: Los listeners se registraron múltiples veces.

**Solución**:
1. Este problema debería estar resuelto con la nueva implementación
2. Si persiste, verifica que no haya múltiples instancias del componente montadas
3. Verifica en la consola cuántas veces se ejecuta "📡 Registrando listeners..."

### ❌ Problema: "Error al enviar mensaje"

**Causa**: El socket se desconectó o hay un error en el servidor.

**Solución**:
1. Verifica el indicador de conexión (icono de Wifi)
2. Si está offline, espera a que se reconecte
3. Revisa la consola del servidor en busca de errores
4. Intenta refrescar la página

## Resultado Esperado

Si todo funciona correctamente:

1. ✅ Los usuarios pueden chatear en tiempo real sin retrasos
2. ✅ No es necesario refrescar la página para ver mensajes nuevos
3. ✅ Los mensajes se muestran con los estilos correctos
4. ✅ El sistema es estable y no presenta errores
5. ✅ La experiencia es fluida y profesional

## Siguiente Paso

Si la prueba es exitosa, el chat de emergencia está funcionando correctamente en tiempo real. 🎉

Si encuentras algún problema, revisa:
1. Los logs de la consola del navegador
2. Los logs de la consola del servidor
3. La sección "Problemas Comunes y Soluciones" arriba
4. El archivo `SOLUCION_CHAT_TIEMPO_REAL.md` para más detalles técnicos

