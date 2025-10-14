# Solución: Chat de Emergencia en Tiempo Real

## Problema Identificado

El chat de emergencia en la página `/residentes/panico/activa/[id]` no funcionaba en tiempo real. Los usuarios tenían que refrescar la página para ver los mensajes nuevos que llegaban.

## Causa Raíz

El problema estaba en cómo se configuraban los listeners de WebSocket en el componente:

1. **Dependencias incorrectas del useEffect**: El `useEffect` que configuraba los listeners de WebSocket incluía `loadHistoricalMessages` como dependencia, causando que se ejecutara múltiples veces innecesariamente.

2. **Verificación de conexión insuficiente**: No se verificaba correctamente si el socket estaba conectado antes de intentar unirse a la sala del chat.

3. **Carga duplicada de mensajes**: Había dos efectos diferentes intentando cargar mensajes históricos, causando confusión en el flujo.

4. **Timing de la conexión**: El useEffect se ejecutaba antes de que el socket estuviera completamente conectado, por lo que los listeners no se registraban correctamente.

## Solución Implementada

### 1. Separación de Responsabilidades

Se dividió el código en dos `useEffect` independientes:

#### A. Carga de Mensajes Históricos (Líneas 345-352)
```typescript
// Cargar mensajes históricos al montar el componente
useEffect(() => {
  if (!alertId || loading) {
    return;
  }
  
  console.log('📚 Cargando mensajes históricos iniciales...');
  loadHistoricalMessages();
}, [alertId, loading, loadHistoricalMessages]);
```

Este efecto se encarga **únicamente** de cargar los mensajes históricos desde Firestore cuando el componente se monta.

#### B. Configuración de WebSocket (Líneas 354-468)
```typescript
// WebSocket para chat de emergencia en tiempo real
useEffect(() => {
  if (!alertId || !user || !userProfile || loading) {
    console.log('⏳ Esperando condiciones para configurar chat WebSocket:', { 
      alertId: !!alertId, 
      user: !!user, 
      userProfile: !!userProfile, 
      loading 
    });
    return;
  }

  if (!socket || !isConnected) {
    console.log('⏳ Socket no disponible o no conectado, esperando...', { 
      socket: !!socket, 
      isConnected 
    });
    return;
  }

  console.log(`💬 Configurando chat WebSocket para alerta ${alertId}`);
  
  // ... Configuración de listeners
}, [alertId, user, userProfile, loading, socket, isConnected]);
```

Este efecto:
- Espera a que el socket esté disponible Y conectado antes de configurar los listeners
- Se ejecuta cuando cambia el estado de conexión del socket
- Limpia correctamente los listeners cuando se desmonta o cuando cambian las dependencias

### 2. Mejoras en la Verificación de Conexión

```typescript
if (!socket || !isConnected) {
  console.log('⏳ Socket no disponible o no conectado, esperando...', { 
    socket: !!socket, 
    isConnected 
  });
  return;
}
```

Ahora se verifica explícitamente que:
- El socket existe
- El socket está conectado (`isConnected === true`)

### 3. Logging Mejorado

Se agregaron más logs para facilitar el debug:
```typescript
console.log('💬 Nuevo mensaje recibido vía WebSocket:', message);
console.log(`✅ Mensaje agregado al chat. Total mensajes: ${newMessages.length}`);
console.log('📡 Registrando listeners de WebSocket para chat...');
console.log(`💬 Limpiando listeners y saliendo del chat de alerta ${alertId}`);
```

### 4. Prevención de Duplicados

El código ya tenía prevención de duplicados, pero ahora funciona correctamente porque los mensajes llegan en tiempo real:

```typescript
const exists = prev.some(msg => 
  msg.id === message.id || 
  (message.firestoreId && msg.id === message.firestoreId)
);
if (exists) {
  console.log('🔄 Mensaje duplicado ignorado:', message.id);
  return prev;
}
```

## Flujo de Funcionamiento Correcto

1. **Montaje del Componente**:
   - Se carga la información de la alerta desde Firestore
   - Se cargan los mensajes históricos del chat

2. **Conexión del WebSocket**:
   - El `WebSocketProvider` establece la conexión
   - Una vez conectado, se registra el usuario en el servidor

3. **Configuración del Chat**:
   - Cuando el socket está conectado Y el componente está listo
   - Se une a la sala específica de la alerta: `alert_chat_${alertId}`
   - Se registran los listeners para recibir mensajes en tiempo real

4. **Recepción de Mensajes**:
   - El usuario escribe un mensaje
   - Se guarda en Firestore (persistencia)
   - Se envía vía WebSocket al servidor
   - El servidor emite el mensaje a todos en la sala
   - Todos los clientes conectados reciben el mensaje instantáneamente
   - El mensaje se agrega al estado local sin necesidad de refrescar

5. **Cleanup**:
   - Cuando el usuario sale de la página
   - Se remueven todos los listeners
   - Se sale de la sala del chat
   - Se evitan memory leaks

## Cómo Probar la Solución

### Prueba 1: Chat en Tiempo Real entre Dos Usuarios

1. **Usuario A**: Inicia sesión y activa una alerta de pánico
2. **Usuario B**: Inicia sesión (en otra ventana/navegador) y verifica que recibe la alerta
3. **Usuario B**: Accede a la página de la alerta activa
4. **Usuario A**: Envía un mensaje en el chat
5. **Usuario B**: Debería ver el mensaje aparecer **inmediatamente** sin refrescar
6. **Usuario B**: Responde con un mensaje
7. **Usuario A**: Debería ver la respuesta **inmediatamente** sin refrescar

### Prueba 2: Múltiples Usuarios en el Chat

1. Abre la misma alerta activa en 3 ventanas diferentes (3 usuarios)
2. Envía mensajes desde cada ventana
3. Verifica que todos los usuarios ven todos los mensajes en tiempo real

### Prueba 3: Reconexión de WebSocket

1. Abre la página de alerta activa
2. En la consola del navegador, verifica que dice "WebSocket conectado"
3. Detén el servidor WebSocket (Ctrl+C en la terminal del servidor)
4. Verifica que aparece el indicador "Offline"
5. Reinicia el servidor
6. Verifica que se reconecta automáticamente
7. Envía un mensaje y verifica que funciona

## Archivos Modificados

- `app/residentes/panico/activa/[id]/page.tsx`
  - Líneas 344-468: Refactorización de los useEffect del chat
  - Separación de responsabilidades
  - Mejora en la verificación de conexión
  - Logging mejorado

## Verificación de Consola

Cuando el chat funciona correctamente, deberías ver en la consola del navegador:

```
📚 Cargando mensajes históricos iniciales...
📚 Cargados X mensajes históricos
💬 Configurando chat WebSocket para alerta abc123 (Socket: xyz789, Conectado: true)
📡 Registrando listeners de WebSocket para chat...
💬 Nuevo mensaje recibido vía WebSocket: { id: '...', message: '...', ... }
✅ Mensaje agregado al chat. Total mensajes: X
```

Y en la consola del servidor (`server.js`):

```
💬 Usuario [nombre] se unió al chat de alerta [alertId]
🏠 Sala: alert_chat_[alertId]
💬 Mensaje en chat [alertId]: [nombre] -> [mensaje]
```

## Notas Importantes

1. **Persistencia**: Los mensajes se guardan en Firestore (`panicChats` collection) para persistencia, y se envían vía WebSocket para tiempo real.

2. **Fallback**: Si el WebSocket no está disponible, los mensajes aún se guardan en Firestore, pero el usuario necesitará refrescar para verlos.

3. **Prevención de duplicados**: El sistema usa el `firestoreId` para evitar que un mensaje se muestre dos veces (una vez por WebSocket y otra por la carga de Firestore).

4. **Salas de chat**: Cada alerta tiene su propia sala de chat (`alert_chat_${alertId}`), por lo que los mensajes solo llegan a los usuarios involucrados en esa alerta específica.

5. **Cleanup automático**: Los listeners se limpian automáticamente cuando el usuario sale de la página, evitando memory leaks y mensajes duplicados.

## Solución Técnica Detallada

### Problema del Timing

**Antes:**
```typescript
// ❌ El socket podría no estar conectado aún
if (socket) {
  socket.emit('chat:join', ...);
  socket.on('chat:new_message', ...);
}
```

**Después:**
```typescript
// ✅ Esperamos a que el socket esté conectado
if (!socket || !isConnected) {
  return; // Esperar a que se conecte
}
socket.emit('chat:join', ...);
socket.on('chat:new_message', ...);
```

### Problema de las Dependencias

**Antes:**
```typescript
// ❌ loadHistoricalMessages causa re-ejecuciones innecesarias
}, [alertId, user, userProfile, loading, socket, loadHistoricalMessages]);
```

**Después:**
```typescript
// ✅ Separamos en dos efectos con dependencias correctas
// Efecto 1: Solo carga históricos
}, [alertId, loading, loadHistoricalMessages]);

// Efecto 2: Solo maneja WebSocket
}, [alertId, user, userProfile, loading, socket, isConnected]);
```

## Resultado Final

✅ **Chat funciona en tiempo real**
✅ **Los mensajes aparecen instantáneamente sin refrescar**
✅ **Soporte para múltiples usuarios simultáneos**
✅ **Reconexión automática del WebSocket**
✅ **Sin memory leaks**
✅ **Logging completo para debugging**
✅ **Fallback a Firestore si WebSocket falla**

## Próximos Pasos Recomendados

1. **Pruebas de carga**: Probar con muchos usuarios simultáneos
2. **Notificaciones de typing**: Agregar indicador "Usuario está escribiendo..."
3. **Confirmación de lectura**: Marcar mensajes como leídos
4. **Reacciones**: Permitir reaccionar a mensajes con emojis
5. **Mensajes multimedia**: Permitir enviar imágenes/videos en el chat

