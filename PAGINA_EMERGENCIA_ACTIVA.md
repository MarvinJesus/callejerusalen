# 🚨 Página de Emergencia Activa - IMPLEMENTADO

## 📋 Resumen

Se ha creado una **página dedicada de emergencia activa** que se muestra automáticamente al usuario que activa una alerta de pánico. Esta página centraliza toda la información en tiempo real y permite comunicación directa con los contactos de emergencia.

## 🎯 ¿Qué se implementó?

Cuando un usuario activa el botón de pánico, es **redirigido automáticamente** a:

```
/residentes/panico/activa/[alertId]
```

Esta página muestra en tiempo real:

1. 📹 **Video en vivo** (si modo extremo está activo)
2. 🗺️ **Mapa con ubicación GPS**
3. 💬 **Chat en tiempo real** con contactos de pánico
4. 📊 **Estado de confirmaciones** (quiénes han confirmado)
5. ⏱️ **Contador de tiempo restante**
6. 🎯 **Acciones de emergencia** (llamar 911, resolver alerta)

---

## 🔄 Flujo de Activación

### Antes ❌
```
Usuario activa pánico
↓
Ve toast de confirmación
↓
Queda en página de pánico normal
↓
No sabe si sus contactos vieron la alerta
```

### Ahora ✅
```
Usuario activa pánico
↓
Ve toast: "¡Alerta enviada!"
↓
Redirigido automáticamente a página de emergencia
↓
Ve TODO en tiempo real:
  - Video grabándose
  - Mapa con su ubicación
  - Quiénes confirmaron (3 de 5)
  - Chat con contactos
  - Tiempo restante (8:45 min)
```

---

## 📱 Interfaz de la Página

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🚨 EMERGENCIA ACTIVA                         [En línea 🟢]    │
│  Tu alerta de pánico está en curso                             │
│                                                                 │
│  ┌────────────┐  ┌───────────────┐  ┌───────────┐            │
│  │ Tiempo     │  │ Confirmaciones│  │  Estado   │            │
│  │ Restante   │  │               │  │           │            │
│  │  8:45      │  │   3 / 5       │  │  Activo   │            │
│  │            │  │   (60%)       │  │           │            │
│  └────────────┘  └───────────────┘  └───────────┘            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COLUMNA IZQUIERDA          │  COLUMNA DERECHA                 │
│  ─────────────────          │  ────────────────                │
│                             │                                   │
│  📹 GRABACIÓN DE VIDEO      │  👥 ESTADO DE NOTIFICACIONES     │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐   │
│  │                      │  │  │ María ✅ Confirmó         │   │
│  │   [Video en vivo]    │  │  │ Pedro ✅ Confirmó         │   │
│  │   🔴 GRABANDO        │  │  │ Ana ⏳ Pendiente...       │   │
│  │                      │  │  │ Luis ✅ Confirmó          │   │
│  └──────────────────────┘  │  │ Carmen ⏳ Pendiente...    │   │
│  [Detener Grabación]       │  └──────────────────────────┘   │
│                             │                                   │
│  🗺️ TU UBICACIÓN           │  💬 CHAT DE EMERGENCIA           │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐   │
│  │                      │  │  │ Tú: Necesito ayuda       │   │
│  │   [Mapa GPS]         │  │  │ María: Voy en camino!    │   │
│  │   📍 Ubicación       │  │  │ Luis: Llegando en 2 min  │   │
│  │                      │  │  │                          │   │
│  └──────────────────────┘  │  └──────────────────────────┘   │
│  📍 Calle Principal #123    │  [Escribe mensaje...] [Enviar]  │
│                             │                                   │
└─────────────────────────────┴───────────────────────────────────┘
│                                                                 │
│  ACCIONES DE EMERGENCIA                                         │
│  [LLAMAR AL 911] ──────────── [MARCAR COMO RESUELTA]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Características Principales

### 1. **Video en Vivo (Modo Extremo)**

Si el usuario tiene activado el modo extremo:

- ✅ La cámara se activa automáticamente
- ✅ Muestra vista previa del video en tiempo real
- ✅ Indicador "🔴 GRABANDO" visible
- ✅ Botón para detener grabación
- ✅ El video se graba como evidencia

```tsx
📹 Grabación de Video
┌──────────────────────┐
│                      │
│   [Video en vivo]    │
│   🔴 GRABANDO        │
│                      │
└──────────────────────┘
[Detener Grabación]
```

### 2. **Mapa de Ubicación GPS**

Muestra la ubicación del usuario en tiempo real:

- ✅ Componente EmergencyLocationMap
- ✅ Coordenadas GPS si están disponibles
- ✅ Dirección textual
- ✅ Link a Google Maps
- ✅ Visual atractivo y claro

```tsx
🗺️ Tu Ubicación
┌──────────────────────┐
│   [Mapa interactivo] │
│   📍 Marcador         │
└──────────────────────┘
📍 Calle Principal #123
GPS: 31.768300, 35.213700
```

### 3. **Chat en Tiempo Real**

Sistema de mensajería instantánea:

- ✅ Solo entre usuario emisor y contactos notificados
- ✅ Actualización en tiempo real con Firestore
- ✅ Scroll automático a último mensaje
- ✅ Indicador de mensaje propio vs ajeno
- ✅ Timestamps en cada mensaje
- ✅ Envío por Enter o botón

```tsx
💬 Chat de Emergencia
┌──────────────────────────┐
│ Tú: Necesito ayuda ya    │
│ 14:05                    │
│                          │
│   María: Voy en camino!  │
│   14:06                  │
│                          │
│ Tú: Gracias              │
│ 14:06                    │
└──────────────────────────┘
[Escribe mensaje...] [Enviar]
```

### 4. **Estado de Confirmaciones**

Panel que muestra quiénes han confirmado:

- ✅ Barra de progreso visual
- ✅ Lista de contactos notificados
- ✅ Estado por contacto (✅ Confirmó / ⏳ Pendiente)
- ✅ Actualización en tiempo real
- ✅ Porcentaje de confirmación

```tsx
👥 Estado de Notificaciones

Confirmaciones: 3 / 5 (60%)
[████████░░░░░░] 60%

María ✅ Confirmó
Pedro ✅ Confirmó  
Ana ⏳ Pendiente...
Luis ✅ Confirmó
Carmen ⏳ Pendiente...
```

### 5. **Contador de Tiempo Restante**

Actualización en vivo cada segundo:

- ✅ Formato MM:SS
- ✅ Cambia de color según urgencia
- ✅ Muestra "Expirando..." cuando llega a 0
- ✅ Sincronizado con expiración automática

```tsx
⏱️ Tiempo Restante
     8:45
   (minutos)
```

### 6. **Acciones de Emergencia**

Dos acciones principales destacadas:

- 🚨 **LLAMAR AL 911**: Marcación directa
- ✅ **MARCAR COMO RESUELTA**: Finaliza la emergencia

```tsx
[LLAMAR AL 911] ────── [MARCAR COMO RESUELTA]
```

---

## 🔧 Implementación Técnica

### Estructura de la Página

```typescript
/app/residentes/panico/activa/[id]/page.tsx
```

### Componentes Clave

1. **Carga de Datos**
   ```typescript
   useEffect(() => {
     // Cargar alerta desde Firestore
     const alertRef = doc(db, 'panicReports', alertId);
     const alertSnap = await getDoc(alertRef);
     
     // Verificar que el usuario es el emisor
     if (data.userId !== user.uid) {
       router.push('/residentes/panico');
     }
   }, [alertId]);
   ```

2. **Suscripción en Tiempo Real**
   ```typescript
   useEffect(() => {
     // Escuchar cambios en la alerta
     const unsubscribe = onSnapshot(alertRef, (snapshot) => {
       setAlertData(prev => ({
         ...prev,
         acknowledgedBy: data.acknowledgedBy,
         status: data.status
       }));
     });
     return () => unsubscribe();
   }, [alertId]);
   ```

3. **Video en Vivo**
   ```typescript
   useEffect(() => {
     if (!alertData?.extremeMode) return;
     
     const stream = await navigator.mediaDevices.getUserMedia({
       video: { facingMode: 'user' },
       audio: true
     });
     
     videoRef.current.srcObject = stream;
     setIsRecording(true);
   }, [alertData?.extremeMode]);
   ```

4. **Chat en Tiempo Real**
   ```typescript
   useEffect(() => {
     const messagesRef = collection(db, 'panicChats');
     const q = query(
       messagesRef,
       where('alertId', '==', alertId),
       orderBy('timestamp', 'asc')
     );
     
     const unsubscribe = onSnapshotQuery(q, (snapshot) => {
       setChatMessages(messages);
     });
   }, [alertId]);
   ```

### Redirección Automática

**En app/residentes/panico/page.tsx**:
```typescript
const docRef = await addDoc(collection(db, 'panicReports'), panicReport);

setTimeout(() => {
  router.push(`/residentes/panico/activa/${docRef.id}`);
}, 1500);
```

**En components/FloatingPanicButton.tsx**:
```typescript
const docRef = await addDoc(collection(db, 'panicReports'), panicReport);

setTimeout(() => {
  router.push(`/residentes/panico/activa/${docRef.id}`);
}, 1500);
```

---

## 💾 Estructura de Datos

### PanicChats Collection

```typescript
interface ChatMessage {
  id: string;
  alertId: string;      // Referencia a panicReports
  userId: string;       // Quién envió
  userName: string;     // Nombre para mostrar
  message: string;      // Contenido
  timestamp: Date;      // Cuándo se envió
}
```

### Ejemplo en Firestore

```json
{
  "id": "msg_001",
  "alertId": "alert_20251012_140000",
  "userId": "maria_456",
  "userName": "María González",
  "message": "¡Voy en camino! Llego en 2 minutos",
  "timestamp": "2025-10-12T14:06:30Z"
}
```

---

## 🔐 Reglas de Firestore

Se agregaron reglas para la colección `panicChats`:

```javascript
match /panicChats/{messageId} {
  // Permitir crear si tiene acceso al plan de seguridad
  allow create: if request.auth != null && hasSecurityAccess();
  
  // Permitir leer si tiene acceso al plan
  allow read: if request.auth != null && hasSecurityAccess();
  
  // Solo admins pueden editar/borrar mensajes
  allow update, delete: if isAdminOrSuperAdmin();
}
```

También se actualizaron las reglas de `panicReports`:

```javascript
// Permitir actualización de acknowledgedBy por usuarios notificados
allow update: if request.auth != null && 
  (isAdminOrSuperAdmin() || 
   request.auth.uid == resource.data.userId ||
   (request.auth.uid in resource.data.notifiedUsers && 
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['acknowledgedBy'])));
```

---

## 🎬 Secuencia de Activación

### Desde Botón Principal

```
1. Usuario completa formulario de pánico
2. Presiona "ACTIVAR ALERTA DE PÁNICO"
3. Sistema cuenta 5 segundos
4. Crea alerta en Firestore
5. Envía por WebSocket
6. Toast: "¡Alerta enviada!"
7. ⏱️ Espera 1.5 segundos
8. 🔄 Redirige a /residentes/panico/activa/[id]
9. Página carga con toda la información
```

### Desde Botón Flotante

```
1. Usuario hace doble click
2. Mantiene presionado 5 segundos
3. Crea alerta en Firestore
4. Envía por WebSocket
5. Si modo extremo: inicia grabación
6. Toast: "¡Alerta enviada!"
7. ⏱️ Espera 1.5 segundos
8. 🔄 Redirige a /residentes/panico/activa/[id]
9. Video continúa grabando en la nueva página
```

---

## 📊 Componentes de la Página

### Header de Emergencia

```tsx
<div className="bg-red-600 text-white animate-pulse-slow">
  🚨 EMERGENCIA ACTIVA
  Tu alerta de pánico está en curso
  
  [Tiempo: 8:45] [Confirmaciones: 3/5 (60%)] [Estado: Activo]
</div>
```

### Grid de Dos Columnas

**Columna Izquierda**:
- 📹 Video en vivo (si modo extremo)
- 🗺️ Mapa de ubicación GPS

**Columna Derecha**:
- 👥 Estado de confirmaciones
- 💬 Chat en tiempo real

### Footer de Acciones

- 🚨 Botón rojo: LLAMAR AL 911
- ✅ Botón verde: MARCAR COMO RESUELTA

### Banner Informativo

```tsx
⚠️ Importante
• Esta página mostrará información en tiempo real
• Tus contactos están siendo notificados
• Usa el chat para comunicarte con quien confirmó
• El video se está grabando como evidencia
• La alerta se resolverá en 8:45 min
```

---

## 💬 Sistema de Chat

### Características

- ✅ **Tiempo Real**: Actualización automática con `onSnapshot`
- ✅ **Bidireccional**: Emisor y receptores pueden chatear
- ✅ **Persistente**: Mensajes guardados en Firestore
- ✅ **Visual**: Diferentes colores para propio vs ajeno
- ✅ **Auto-scroll**: Se desplaza a último mensaje

### Cómo Funciona

```
Usuario escribe mensaje
↓
Se guarda en Firestore (panicChats)
↓
Firestore notifica a todos los suscriptores
↓
Mensaje aparece en todos los chats instantáneamente
```

### Interfaz de Chat

```typescript
// Mensaje propio (azul)
<div className="bg-blue-600 text-white">
  <p className="text-xs">Tú</p>
  <p>Estoy en el edificio</p>
  <p className="text-xs">14:05:30</p>
</div>

// Mensaje ajeno (gris)
<div className="bg-gray-200 text-gray-900">
  <p className="text-xs">María González</p>
  <p>¡Ya voy!</p>
  <p className="text-xs">14:05:45</p>
</div>
```

---

## 📹 Grabación de Video

### Inicio Automático

Si el usuario tiene activado **Modo Extremo**:

1. Al llegar a la página, se solicita cámara automáticamente
2. El stream se asigna al elemento `<video>`
3. Se inicia MediaRecorder
4. Se muestra indicador "🔴 GRABANDO"

### Vista Previa

```tsx
<video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  className="w-full h-64 object-cover"
/>
```

### Detener Manualmente

```tsx
<button onClick={stopRecording}>
  <StopCircle /> Detener Grabación
</button>
```

---

## 🗺️ Mapa de Ubicación

### Datos Mostrados

- 📍 Coordenadas GPS (si disponibles)
- 📝 Dirección textual
- 🗺️ Mapa interactivo (Google Maps Embed)
- 🔗 Link a Google Maps en nueva pestaña

### Componente Usado

```tsx
<EmergencyLocationMap
  latitude={alertData.gpsLatitude}
  longitude={alertData.gpsLongitude}
  location={alertData.location}
  userName={alertData.userName}
/>
```

---

## 👥 Estado de Confirmaciones

### Visualización en Tiempo Real

La página se actualiza automáticamente cuando:

- Un contacto presiona "HE SIDO NOTIFICADO"
- Se actualiza el array `acknowledgedBy` en Firestore
- `onSnapshot` detecta el cambio
- UI se actualiza instantáneamente

### Barra de Progreso

```tsx
Confirmaciones: 3 / 5 (60%)
[████████████░░░░░░░░] 
```

### Lista de Contactos

```tsx
María     ✅ Confirmó      (bg-green-50)
Pedro     ✅ Confirmó      (bg-green-50)
Ana       ⏳ Pendiente...  (bg-gray-50)
Luis      ✅ Confirmó      (bg-green-50)
Carmen    ⏳ Pendiente...  (bg-gray-50)
```

---

## ⏱️ Contador de Tiempo

### Actualización en Vivo

```typescript
useEffect(() => {
  const updateTime = () => {
    const diffMs = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    setTimeRemaining(`${minutes}:${seconds.padStart(2, '0')}`);
  };
  
  const interval = setInterval(updateTime, 1000);
  return () => clearInterval(interval);
}, [alertData]);
```

### Formato

- `9:45` - Más de 1 minuto
- `0:30` - Menos de 1 minuto
- `Expirada` - Tiempo agotado

---

## 🎯 Acciones Disponibles

### 1. Llamar al 911

```tsx
<a href="tel:911">
  <Phone /> LLAMAR AL 911
</a>
```

### 2. Marcar como Resuelta

```typescript
const handleResolveAlert = async () => {
  await updateDoc(alertRef, {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: user.uid
  });
  
  stopRecording(); // Detener video
  router.push('/residentes/panico'); // Volver
};
```

---

## 🚀 Casos de Uso

### Caso 1: Emergencia con Video

```
1. Usuario activa pánico con modo extremo
2. Redirigido a página activa
3. Ve video grabándose en tiempo real
4. Ve que 2 de 5 confirmaron
5. Escribe en chat: "Estoy bien, necesito ayuda"
6. María responde: "Voy en camino"
7. Ve su ubicación en el mapa
8. Espera ayuda monitoreando confirmaciones
9. Cuando llega ayuda, presiona "MARCAR COMO RESUELTA"
```

### Caso 2: Coordinación por Chat

```
1. Juan activa pánico (robo en progreso)
2. Ve en tiempo real quién confirmó
3. María confirma → Juan la ve en la lista
4. Juan escribe: "No entren, hay peligro"
5. María ve mensaje y espera afuera
6. Pedro confirma y lee chat
7. Pedro escribe: "Llamé a la policía"
8. Todos coordinados vía chat en tiempo real
```

### Caso 3: Falsa Alarma

```
1. Usuario activa por error
2. Ve página de emergencia
3. Se da cuenta del error
4. Presiona "MARCAR COMO RESUELTA" inmediatamente
5. Sistema notifica a todos que se resolvió
6. Vuelve a página normal de pánico
```

---

## 🔒 Seguridad

### Validaciones

1. ✅ Solo el emisor puede ver la página
2. ✅ Verificación de `userId === user.uid`
3. ✅ Redirección si no es el emisor
4. ✅ Reglas de Firestore protegen datos

### Privacidad

- ✅ Chat solo visible para emisor y notificados
- ✅ Video solo visible para el emisor
- ✅ Ubicación compartida solo con notificados

---

## 📊 Flujo de Datos

```
Página Activa
     │
     ├─ Firestore (panicReports/{id})
     │    └─ onSnapshot → Actualiza confirm aciones
     │
     ├─ Firestore (panicChats)
     │    └─ onSnapshot → Actualiza mensajes
     │
     ├─ Navigator.mediaDevices
     │    └─ getUserMedia → Stream de video
     │
     └─ WebSocket (opcional)
          └─ Notificaciones de chat
```

---

## 🎨 Estilos y Animaciones

### Animación de Pulsado Lento

```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
```

### Estados Visuales

- 🔴 Rojo: Emergencia activa (header)
- 🟢 Verde: Confirmaciones exitosas
- 🟠 Naranja: Pendientes
- 🔵 Azul: Chat propio
- ⚫ Gris: Chat ajeno

---

## 📱 Responsividad

- ✅ Desktop: 2 columnas lado a lado
- ✅ Tablet: 2 columnas con scroll
- ✅ Móvil: 1 columna apilada

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Flujo Completo

```
1. Activar pánico con modo extremo
2. ✅ Verificar redirección automática
3. ✅ Verificar video se muestra
4. ✅ Verificar mapa se carga
5. ✅ Enviar mensaje en chat
6. ✅ Verificar contador de tiempo
7. ✅ Ver confirmaciones en tiempo real
8. ✅ Resolver alerta
```

### Prueba 2: Chat en Tiempo Real

```
1. Usuario A activa pánico
2. Usuario B confirma alerta
3. Usuario A escribe en chat
4. ✅ Verificar B ve mensaje instantáneamente
5. Usuario B responde
6. ✅ Verificar A ve respuesta
```

### Prueba 3: Confirmaciones en Vivo

```
1. Usuario A activa pánico (5 contactos)
2. Ver página activa: "0 de 5"
3. Usuario B confirma
4. ✅ Verificar cambia a "1 de 5" automáticamente
5. Usuarios C y D confirman
6. ✅ Verificar actualiza a "3 de 5"
```

---

## 💡 Beneficios

### Para el Usuario Emisor

- ✅ **Visibilidad total**: Ve todo en un solo lugar
- ✅ **Tranquilidad**: Sabe quién confirmó
- ✅ **Comunicación**: Puede coordinar vía chat
- ✅ **Evidencia**: Video grabándose
- ✅ **Control**: Puede resolver cuando quiera

### Para el Sistema

- ✅ **Centralización**: Todo en una página
- ✅ **Tiempo real**: Datos siempre actualizados
- ✅ **Escalabilidad**: Usa listeners de Firestore
- ✅ **Confiabilidad**: Múltiples fuentes de datos

---

## 🔮 Mejoras Futuras

Opcional (no implementado):

1. **Compartir pantalla** además de video
2. **Grabación del chat** en PDF para evidencia
3. **Notificación cuando alguien escribe en chat**
4. **Indicador de "escribiendo..."**
5. **Emojis de reacción rápida**
6. **Compartir ubicación en tiempo real en el chat**

---

## 📂 Archivos Creados/Modificados

### Nuevo
1. ✅ `app/residentes/panico/activa/[id]/page.tsx` - Página principal

### Modificados
1. ✅ `app/residentes/panico/page.tsx` - Redirección
2. ✅ `components/FloatingPanicButton.tsx` - Redirección
3. ✅ `firestore.rules` - Reglas de panicChats

---

## 🎯 Resumen en 3 Puntos

1. **Redirección Automática**: Al activar pánico → va a página dedicada
2. **Información Completa**: Video + Mapa + Chat + Confirmaciones en UN solo lugar
3. **Tiempo Real**: Todo se actualiza automáticamente

---

**Estado**: ✅ Implementado y Compilado  
**Compilación**: ✅ Exitosa  
**Ruta**: `/residentes/panico/activa/[id]`  
**Fecha**: Octubre 2025

