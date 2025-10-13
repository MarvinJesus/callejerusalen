# Sistema de Notificaciones de Pánico

## 📋 Descripción General

Se ha implementado un sistema completo de notificaciones en tiempo real para alertas de pánico, que incluye:

- ✅ **Sonido de alarma intermitente** (generado con Web Audio API)
- ✅ **Notificaciones del navegador** (Web Push API)
- ✅ **Alertas visuales en tiempo real**
- ✅ **Escucha en tiempo real de Firestore**
- ✅ **Notificación selectiva** (solo usuarios seleccionados)

---

## 🎯 Características Principales

### 1. Sonido de Alarma Intermitente

**Archivo:** `lib/alarmSound.ts`

El sistema genera sonidos de alarma sin necesidad de archivos de audio externos:

- **Patrón Simple**: Un tono continuo intermitente
- **Patrón de Emergencia**: Dos tonos alternados (La - 880Hz y Mi - 659Hz)
- **Controles**: 
  - `startAlarm()` - Inicia la alarma
  - `stopAlarm()` - Detiene la alarma
  - `isPlaying()` - Verifica si está sonando

```typescript
import { useAlarmSound } from '@/lib/alarmSound';

const { startAlarm, stopAlarm, isPlaying } = useAlarmSound();

// Iniciar alarma de emergencia (patrón alternado)
startAlarm('emergency');

// Iniciar alarma simple
startAlarm('simple');

// Detener alarma
stopAlarm();
```

### 2. Hook de Notificaciones en Tiempo Real

**Archivo:** `hooks/usePanicNotifications.ts`

Este hook se conecta a Firestore y escucha cambios en tiempo real:

```typescript
import { usePanicNotifications } from '@/hooks/usePanicNotifications';

const {
  notifications,          // Todas las notificaciones
  activeNotifications,    // Solo notificaciones activas
  unreadCount,           // Cantidad de notificaciones no leídas
  markAsRead,            // Marcar como leída
  markAllAsRead,         // Marcar todas como leídas
  loading,               // Estado de carga
  error                  // Errores
} = usePanicNotifications((notification) => {
  // Callback cuando llega nueva notificación
  console.log('Nueva alerta:', notification);
});
```

**Características:**
- Escucha cambios en la colección `panicReports`
- Solo recibe notificaciones donde el usuario está en `notifiedUsers`
- Persiste notificaciones leídas en localStorage
- Detecta automáticamente nuevas alertas activas

### 3. Componente de Notificaciones

**Archivo:** `components/PanicNotificationSystem.tsx`

Componente visual que integra todo el sistema:

**Características:**
- ✅ Modal visual con información de la emergencia
- ✅ Sonido de alarma automático
- ✅ Notificaciones del navegador
- ✅ Control de sonido (activar/desactivar)
- ✅ Botón de llamada al 911
- ✅ Información detallada del solicitante
- ✅ Indicadores especiales (Modo Extremo, Video)

### 4. Integración con Notificaciones del Navegador

El sistema solicita permisos automáticamente para notificaciones del navegador:

```typescript
// Solicitar permisos (se hace automáticamente)
Notification.requestPermission().then((permission) => {
  if (permission === 'granted') {
    // Notificaciones activadas
  }
});
```

**Características de las notificaciones del navegador:**
- 🔔 Requiere interacción del usuario
- 🔔 Vibración en dispositivos móviles
- 🔔 Sonido nativo del sistema
- 🔔 Persisten aunque cambies de pestaña
- 🔔 Al hacer clic, te lleva a la alerta

---

## 🔧 Implementación

### Archivos Creados/Modificados

1. **`lib/alarmSound.ts`** (NUEVO)
   - Utilidad para generar sonidos de alarma con Web Audio API
   - Patrón singleton para una única instancia
   - Hook `useAlarmSound()` para React

2. **`hooks/usePanicNotifications.ts`** (NUEVO)
   - Hook personalizado para escuchar notificaciones en tiempo real
   - Gestión de estado de notificaciones leídas/no leídas
   - Callback para nuevas notificaciones

3. **`components/PanicNotificationSystem.tsx`** (NUEVO)
   - Componente visual del sistema de notificaciones
   - Integración de sonido y notificaciones del navegador
   - Modal con información detallada de la emergencia

4. **`app/layout.tsx`** (MODIFICADO)
   - Agregado `<PanicNotificationSystem />` dentro de `AuthProvider`
   - Disponible en toda la aplicación

5. **`firestore.rules`** (MODIFICADO)
   - Actualizada regla de `panicReports` para permitir lectura a usuarios notificados
   - Agregada verificación: `request.auth.uid in resource.data.notifiedUsers`

---

## 🚀 Uso del Sistema

### Para Usuarios que Activan el Pánico

1. El usuario activa el botón de pánico (flotante o desde la página)
2. Se crea un documento en `panicReports` con los usuarios a notificar
3. El sistema envía la alerta automáticamente

### Para Usuarios que Reciben la Notificación

1. **Sonido de Alarma**:
   - Se reproduce automáticamente al recibir la alerta
   - Patrón alternado de dos tonos para máxima urgencia
   - Se puede desactivar desde el modal

2. **Notificación del Navegador**:
   - Aparece incluso si estás en otra pestaña
   - Vibra en dispositivos móviles
   - Al hacer clic, muestra el modal de la alerta

3. **Modal Visual**:
   - Información del solicitante (nombre, email)
   - Ubicación de la emergencia
   - Descripción de la situación
   - Tiempo transcurrido desde la activación
   - Botón directo para llamar al 911
   - Indicadores especiales (Modo Extremo, Video)

4. **Acciones Disponibles**:
   - ✅ **Llamar al 911**: Abre el marcador telefónico
   - ✅ **He sido notificado**: Marca la alerta como leída y cierra el modal
   - ✅ **Toggle de sonido**: Activar/desactivar sonido de alarma

---

## 📊 Estructura de Datos

### PanicReport en Firestore

```typescript
{
  id: string,                    // ID del documento
  userId: string,                // ID del usuario que activó
  userName: string,              // Nombre del usuario
  userEmail: string,             // Email del usuario
  location: string,              // Ubicación de la emergencia
  description: string,           // Descripción
  timestamp: Timestamp,          // Fecha/hora de activación
  status: 'active' | 'resolved', // Estado de la alerta
  emergencyContacts: string[],   // Contactos de emergencia (ej. ['911'])
  notifiedUsers: string[],       // Array de UIDs notificados
  activatedFrom?: string,        // Origen de activación
  extremeMode?: boolean,         // Si modo extremo está activo
  hasVideo?: boolean             // Si hay video capturado
}
```

### Regla de Firestore

```javascript
match /panicReports/{reportId} {
  allow create: if hasSecurityAccess();
  allow read: if request.auth != null && 
    (isAdminOrSuperAdmin() || 
     hasSecurityAccess() ||
     request.auth.uid in resource.data.notifiedUsers);
  allow update: if request.auth != null && 
    (isAdminOrSuperAdmin() || request.auth.uid == resource.data.userId);
  allow delete: if isAdminOrSuperAdmin();
}
```

**La parte clave es:**
```javascript
request.auth.uid in resource.data.notifiedUsers
```

Esto permite que solo los usuarios en el array `notifiedUsers` puedan leer el reporte.

---

## 🎨 Personalización

### Cambiar el Sonido de Alarma

En `lib/alarmSound.ts`, puedes modificar:

```typescript
// Frecuencia del tono (en Hz)
const frequency = 880; // La alta (default)

// Duración de cada beep (en ms)
const duration = 200;

// Intervalo entre beeps (en ms)
const interval = 300;
```

### Cambiar el Patrón de Emergencia

```typescript
// En startEmergencyPattern()
const frequency = highTone ? 880 : 659; // Modificar frecuencias
```

### Personalizar Notificaciones del Navegador

En `components/PanicNotificationSystem.tsx`:

```typescript
const browserNotification = new Notification('🚨 ALERTA DE PÁNICO', {
  body: `...`,
  icon: '/logo.png',           // Cambiar icono
  badge: '/logo.png',          // Cambiar badge
  requireInteraction: true,    // Requiere interacción
  vibrate: [200, 100, 200],    // Patrón de vibración
});
```

---

## 🔐 Seguridad

### Permisos Requeridos

1. **Firestore**:
   - Usuario debe estar en `notifiedUsers` del reporte
   - O tener `hasSecurityAccess()` (inscrito en plan de seguridad)
   - O ser admin/super_admin

2. **Notificaciones del Navegador**:
   - Requiere permiso explícito del usuario
   - Se solicita automáticamente la primera vez
   - Puede activarse/desactivarse en cualquier momento

3. **Audio**:
   - No requiere permisos especiales
   - Algunos navegadores requieren interacción del usuario primero
   - Se maneja automáticamente con AudioContext

---

## 🧪 Pruebas

### Probar el Sistema Completo

1. **Configurar contactos de emergencia**:
   - Usuario A: Ir a `/residentes/panico` → Configuración
   - Seleccionar Usuario B como contacto

2. **Activar pánico**:
   - Usuario A: Activar botón de pánico
   - Se crea el reporte en Firestore

3. **Verificar notificación**:
   - Usuario B: Debe recibir:
     - ✅ Sonido de alarma automático
     - ✅ Notificación del navegador
     - ✅ Modal visual con la alerta
     - ✅ Toast de React Hot Toast

4. **Interactuar con la alerta**:
   - Usuario B: Puede:
     - Ver información completa
     - Llamar al 911
     - Desactivar el sonido
     - Marcar como leída

### Probar Solo el Sonido

```typescript
import { getAlarmSound } from '@/lib/alarmSound';

const alarm = getAlarmSound();
alarm.startEmergencyPattern(); // Iniciar
alarm.stop(); // Detener
```

### Verificar Permisos

```typescript
// En consola del navegador
console.log('Permiso de notificaciones:', Notification.permission);

// Valores posibles: 'default', 'granted', 'denied'
```

---

## 🐛 Solución de Problemas

### El sonido no se reproduce

**Causa**: El navegador requiere interacción del usuario antes de reproducir audio.

**Solución**: El AudioContext se reanuda automáticamente, pero en algunos navegadores puede requerir un clic previo.

```typescript
// Forzar inicio de AudioContext
if (audioContext.state === 'suspended') {
  audioContext.resume();
}
```

### Las notificaciones del navegador no aparecen

**Causa**: Permisos no otorgados o bloqueados.

**Solución**: 
1. Verificar permisos en configuración del navegador
2. Usar el botón "Activar notificaciones de emergencia" en la esquina inferior izquierda
3. Verificar que el navegador soporte notificaciones

### No recibo notificaciones

**Causa**: No estás en la lista de `notifiedUsers`.

**Solución**: 
1. Verificar que el usuario que activó el pánico te haya seleccionado
2. Verificar en Firestore que tu UID está en el array `notifiedUsers`
3. Verificar que tengas acceso al plan de seguridad

### El listener no se conecta

**Causa**: Problemas con las reglas de Firestore o conexión.

**Solución**:
1. Verificar reglas en Firebase Console
2. Comprobar logs en consola del navegador
3. Verificar que estés autenticado

---

## 📱 Compatibilidad

### Navegadores Soportados

| Característica | Chrome | Firefox | Safari | Edge |
|---------------|--------|---------|--------|------|
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| Notificaciones | ✅ | ✅ | ✅* | ✅ |
| Firestore Listeners | ✅ | ✅ | ✅ | ✅ |
| Vibración | ✅ | ✅ | ❌ | ✅ |

*Safari en iOS requiere agregar la app a la pantalla de inicio.

### Dispositivos Móviles

- ✅ **Android**: Soporte completo
- ⚠️ **iOS**: Notificaciones limitadas (requiere PWA)
- ✅ **Sonido**: Funciona en todos los dispositivos
- ✅ **Vibración**: Android y dispositivos compatibles

---

## 🔄 Flujo de Notificación Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO A (Activador)                     │
│                                                               │
│  1. Activa botón de pánico                                   │
│  2. Se crea documento en panicReports                        │
│     - notifiedUsers: ['user_b_uid', 'user_c_uid']           │
│                                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIRESTORE (panicReports)                  │
│                                                               │
│  {                                                            │
│    userId: 'user_a_uid',                                     │
│    userName: 'Usuario A',                                    │
│    notifiedUsers: ['user_b_uid', 'user_c_uid'],            │
│    status: 'active',                                         │
│    timestamp: ServerTimestamp                                │
│  }                                                            │
│                                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              USUARIOS B y C (Notificados)                    │
│                                                               │
│  usePanicNotifications Hook:                                 │
│  │                                                            │
│  ├─ onSnapshot detecta nuevo documento                       │
│  ├─ Verifica: uid in notifiedUsers ✅                        │
│  ├─ Ejecuta callback onNewNotification()                     │
│  │                                                            │
│  PanicNotificationSystem:                                    │
│  │                                                            │
│  ├─ 🔊 Inicia sonido de alarma (startAlarm)                 │
│  ├─ 📢 Muestra notificación del navegador                    │
│  ├─ 🖼️ Abre modal visual con información                    │
│  └─ 🍞 Muestra toast de React Hot Toast                      │
│                                                               │
│  Usuario interactúa:                                         │
│  ├─ ☎️ Llama al 911                                          │
│  ├─ ✅ Marca como leída                                      │
│  ├─ 🔇 Desactiva sonido                                      │
│  └─ ❌ Cierra modal                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Notas Importantes

1. **Rendimiento**: El sistema usa Firestore listeners en tiempo real, que cuenta hacia tu cuota de lecturas de Firestore.

2. **Persistencia**: Las notificaciones leídas se guardan en localStorage, por lo que persisten entre sesiones.

3. **Privacidad**: Solo los usuarios en `notifiedUsers` pueden ver la información de la alerta.

4. **Sonido**: El sonido se genera dinámicamente y no requiere archivos de audio, reduciendo el tamaño de la aplicación.

5. **Escalabilidad**: El sistema está diseñado para manejar múltiples alertas simultáneas.

---

## 🎯 Próximas Mejoras Sugeridas

- [ ] Panel de historial de notificaciones recibidas
- [ ] Respuestas rápidas (ej. "Voy en camino", "Contacté a emergencias")
- [ ] Mapa en tiempo real con ubicación del solicitante
- [ ] Chat en tiempo real entre notificados
- [ ] Estadísticas de tiempo de respuesta
- [ ] Notificaciones push con Firebase Cloud Messaging (para iOS)
- [ ] Integración con servicios de emergencia externos
- [ ] Sistema de reconocimiento para false alarms

---

## 📞 Contacto de Soporte

Si encuentras problemas o tienes sugerencias, contacta al equipo de desarrollo.

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0  
**Sistema implementado por**: AI Assistant (Claude Sonnet 4.5)


