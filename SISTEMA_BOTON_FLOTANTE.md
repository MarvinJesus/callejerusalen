# 🔘 Sistema de Botón de Pánico Flotante

## 📋 Descripción General

Se ha implementado un **botón de pánico flotante** global que está disponible en toda la aplicación, permitiendo a los usuarios activar una alerta de emergencia desde cualquier página. El botón incluye un **Modo Pánico Extremo** que activa automáticamente la cámara frontal y graba video durante la emergencia.

## 🎯 Características Principales

### 1. **Botón Flotante Global**
- ✅ Visible en todas las páginas de la aplicación
- ✅ Posicionado en la esquina inferior izquierda
- ✅ Solo visible para usuarios con acceso al plan de seguridad
- ✅ Puede ser activado/desactivado desde configuración

### 2. **Sistema de Activación de Doble Seguridad**
- ✅ **Paso 1**: Click dos veces rápido (doble click)
- ✅ **Paso 2**: Mantener presionado durante tiempo configurable (3-10 segundos, default: 5)
- ✅ Barra de progreso circular visual
- ✅ Posibilidad de cancelar antes de activar
- ✅ Feedback visual en cada paso

### 3. **Modo Pánico Extremo** 🎥
- ✅ Activa automáticamente la cámara frontal
- ✅ Graba video durante la activación del pánico
- ✅ Indicador visual de grabación activa
- ✅ Video guardado como evidencia
- ✅ Configurable on/off desde la página de configuración

### 4. **Configuración Personalizada**
- ✅ Activar/Desactivar botón flotante
- ✅ Tiempo de mantener presionado (3-10 segundos)
- ✅ Activar/Desactivar modo extremo
- ✅ Auto-grabación de video (opcional)

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
FloatingPanicButton.tsx        → Botón flotante global
├── Estados de UI
│   ├── clickCount            → Contador de clicks
│   ├── isHolding            → Estado de mantener presionado
│   ├── holdProgress         → Progreso de activación (0-100%)
│   └── isRecording          → Estado de grabación activa
├── Lógica de Activación
│   ├── handleButtonClick()  → Maneja clicks y doble click
│   ├── handleMouseDown()    → Inicia mantener presionado
│   └── handleMouseUp()      → Termina mantener presionado
└── Grabación de Video
    ├── startRecording()     → Inicia grabación de cámara
    ├── stopRecording()      → Detiene grabación
    └── activatePanic()      → Activa alerta con video
```

### Flujo de Activación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Click 1    │────▶│   Click 2    │────▶│   Mantener   │
│              │     │  (Doble)     │     │  Presionado  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Progreso   │
                                          │   0-100%     │
                                          └──────────────┘
                                                  │
                                                  ▼
                      ┌─────────────┐     ┌──────────────┐
                      │  Cancelar   │◀────│   Completo   │
                      │             │     │    100%      │
                      └─────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Activar    │
                                          │    Pánico    │
                                          └──────────────┘
```

### Con Modo Extremo Activado

```
Click 1 → Click 2 → Mantener → Inicia Cámara → Graba → Pánico Activado
                         │          │              │            │
                         └──────────┴──────────────┴────────────┘
                                   📹 Video guardado
```

## 🔧 Implementación Técnica

### 1. Integración en Layout Principal

```typescript
// app/layout.tsx
import FloatingPanicButton from '@/components/FloatingPanicButton';

<AuthProvider>
  <div className="relative">
    {children}
  </div>
  <FloatingHomeButton />
  <FloatingPanicButton />  ← Nuevo componente
</AuthProvider>
```

### 2. Configuración de Usuario

```typescript
// lib/auth.ts - PanicButtonSettings
interface PanicButtonSettings {
  userId: string;
  emergencyContacts: string[];
  notifyAll: boolean;
  customMessage?: string;
  location?: string;
  // Nuevos campos del botón flotante
  floatingButtonEnabled: boolean;      // Default: true
  holdTime: number;                    // Default: 5 (segundos)
  extremeModeEnabled: boolean;         // Default: false
  autoRecordVideo: boolean;            // Default: true
  createdAt: any;
  updatedAt: any;
}
```

### 3. Grabación de Video

```typescript
// Acceso a cámara frontal
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },  // Cámara frontal
    audio: true
  });

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp8,opus'
  });

  mediaRecorder.start();
  setIsRecording(true);
};
```

### 4. Activación de Pánico

```typescript
const activatePanic = async () => {
  // Detener grabación
  stopRecording();

  // Crear reporte con información completa
  const panicReport = {
    userId: user.uid,
    userName: userProfile.displayName,
    location: settings.location,
    description: settings.customMessage,
    timestamp: serverTimestamp(),
    status: 'active',
    notifiedUsers: contactsToNotify,
    activatedFrom: 'floating_button',      // Nuevo campo
    extremeMode: extremeModeEnabled,       // Nuevo campo
    hasVideo: videoBlob !== null           // Nuevo campo
  };

  await addDoc(collection(db, 'panicReports'), panicReport);
  
  // TODO: Subir video a Firebase Storage
};
```

## 🎨 Interfaz de Usuario

### Estados Visuales del Botón

#### Estado Normal
```
┌────────────┐
│            │
│     ⚠️      │  ← Icono de alerta
│            │
└────────────┘
Color: Rojo (#DC2626)
Acción: Esperando primer click
```

#### Después de 1 Click
```
┌────────────┐
│     [1]    │  ← Badge con número
│     ⚠️      │
│            │
└────────────┘
Color: Rojo oscuro, pulsando
Acción: Esperando segundo click
```

#### Durante Mantener Presionado
```
┌────────────┐
│   ╱────╲   │  ← Barra circular
│  │  ⚠️  │  │     de progreso
│   ╲────╱   │
└────────────┘
Color: Rojo oscuro, escalado 110%
Acción: Contando tiempo (0-100%)
```

#### Grabando Video (Modo Extremo)
```
┌────────────┐
│   ╱────╲   │  ← Ring pulsante
│  │  📹  │  │     Icono de video
│   ╲────╱   │
└────────────┘
Color: Rojo con ring animado
Extra: Label "Grabando..." arriba
```

### Indicadores Adicionales

```
Modo Extremo Activo:
┌────────────┐
│     ⚠️      │
│     🟣     │  ← Punto morado (top-right)
└────────────┘

Tooltip Hover:
[Botón] ───▶ "Click 2 veces rápido"
```

## 📱 Página de Configuración

### Nueva Sección: Botón Flotante

```
🔘 Botón de Pánico Flotante
├── [✓] Activar botón flotante
├── Slider: Tiempo para activar (3-10 segundos) → [5s]
└── Modo Pánico Extremo
    ├── [✓] Activar modo extremo 🎥
    └── [✓] Grabar automáticamente
```

### Controles Implementados

```tsx
<div className="bg-purple-50 border border-purple-200">
  <input type="checkbox" checked={extremeModeEnabled} />
  <span>Modo Pánico Extremo</span>
  <span className="badge">AVANZADO</span>
  
  {extremeModeEnabled && (
    <div>
      <input type="checkbox" checked={autoRecordVideo} />
      <span>Grabar automáticamente</span>
      <p>⚠️ Asegúrate de dar permisos de cámara</p>
    </div>
  )}
</div>
```

## 🔒 Seguridad y Permisos

### Control de Acceso

```typescript
// Solo visible para usuarios autorizados
const hasAccess = React.useMemo(() => {
  if (!user || !userProfile) return false;
  
  const isAdmin = userProfile.role === 'admin' || 
                  userProfile.role === 'super_admin';
  const isEnrolled = securityPlan !== null && 
                     securityPlan.status === 'active';
  
  return isAdmin || (userProfile.role === 'comunidad' && isEnrolled);
}, [user, userProfile, securityPlan]);

if (!hasAccess || !settings?.floatingButtonEnabled) {
  return null;  // No renderizar el botón
}
```

### Permisos de Cámara

```javascript
// Solicitar permisos
navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user' },
  audio: true
})
.then(stream => {
  // Cámara autorizada
})
.catch(error => {
  toast.error('No se pudo acceder a la cámara');
});
```

## 🗄️ Estructura de Datos

### Reporte de Pánico Actualizado

```typescript
{
  // Campos existentes
  userId: string,
  userName: string,
  userEmail: string,
  location: string,
  description: string,
  timestamp: Timestamp,
  status: 'active' | 'resolved',
  emergencyContacts: string[],
  notifiedUsers: string[],
  
  // Nuevos campos para botón flotante
  activatedFrom: 'floating_button' | 'panic_page',
  extremeMode: boolean,           // Si usó modo extremo
  hasVideo: boolean,              // Si hay video capturado
  videoUrl?: string               // URL del video en Storage (futuro)
}
```

### Configuración en Firestore

```
panicButtonSettings/{userId}
{
  emergencyContacts: ['uid1', 'uid2'],
  notifyAll: false,
  customMessage: 'Necesito ayuda urgente',
  location: 'Calle Principal #123',
  
  // Configuración del botón flotante
  floatingButtonEnabled: true,
  holdTime: 5,
  extremeModeEnabled: true,
  autoRecordVideo: true,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🎮 Casos de Uso

### Caso 1: Activación Rápida Sin Modo Extremo

```
Usuario ve amenaza
    ↓
Click 2 veces en botón flotante
    ↓
Mantiene presionado 5 segundos
    ↓
Pánico activado
    ↓
Contactos notificados
```

**Tiempo total**: ~6 segundos

### Caso 2: Activación con Modo Extremo

```
Usuario en peligro
    ↓
Click 2 veces en botón flotante
    ↓
Mantiene presionado
    ↓
Cámara se activa automáticamente
    ↓
Video comienza a grabar
    ↓
Completó tiempo → Pánico activado
    ↓
Video guardado + Contactos notificados
```

**Tiempo total**: ~6 segundos + duración de grabación

### Caso 3: Cancelación de Activación

```
Usuario click por error
    ↓
Click 2 veces
    ↓
Empieza a mantener presionado
    ↓
Se arrepiente (progreso al 40%)
    ↓
Suelta el botón
    ↓
Grabación detenida (si había)
    ↓
"Activación cancelada"
```

**Resultado**: Sin alerta enviada

## 🔄 Flujo de Datos Completo

```
Usuario                    Componente               Firebase
   │                           │                       │
   │──── Click 1 ─────────────▶│                      │
   │◀──── Badge "1" ───────────│                      │
   │                           │                       │
   │──── Click 2 ─────────────▶│                      │
   │◀──── "Mantén presionado"──│                      │
   │                           │                       │
   │──── Mouse Down ──────────▶│                      │
   │                           │── Acceder cámara ────│
   │◀──── Cámara activa ───────│                      │
   │◀──── Progreso: 0% ────────│                      │
   │                           │                       │
   │◀──── Progreso: 50% ───────│                      │
   │                           │                       │
   │◀──── Progreso: 100% ──────│                      │
   │                           │                       │
   │                           │─── Guardar reporte ─▶│
   │                           │─── Subir video ──────▶│
   │◀──── "Alerta enviada" ────│                      │
   │                           │                       │
```

## ⚙️ Configuración y Personalización

### Valores Configurables

| Configuración | Tipo | Min | Max | Default | Descripción |
|--------------|------|-----|-----|---------|-------------|
| floatingButtonEnabled | boolean | - | - | true | Activa/desactiva el botón |
| holdTime | number | 3 | 10 | 5 | Segundos para activar |
| extremeModeEnabled | boolean | - | - | false | Activa modo extremo |
| autoRecordVideo | boolean | - | - | true | Graba automáticamente |

### Personalización Visual

```css
/* Posición del botón */
.fixed left-4 bottom-24 z-50

/* Tamaño del botón */
w-16 h-16  /* 64px × 64px */

/* Colores por estado */
Normal:    bg-red-500
Hover:     bg-red-600
Active:    bg-red-700
Recording: ring-4 ring-red-300
```

## 📊 Ventajas del Sistema

### Para el Usuario
- ✅ **Acceso inmediato** desde cualquier página
- ✅ **Doble seguridad** contra activaciones accidentales
- ✅ **Feedback visual** en cada paso
- ✅ **Grabación de evidencia** en modo extremo
- ✅ **Cancelación fácil** hasta el último momento
- ✅ **Configuración personalizada** a sus necesidades

### Para la Seguridad
- ✅ **Respuesta más rápida** (siempre disponible)
- ✅ **Evidencia visual** con grabación de video
- ✅ **Menos falsas alarmas** (doble confirmación)
- ✅ **Trazabilidad completa** de cada activación
- ✅ **Contexto detallado** de la emergencia

### Técnicas
- ✅ **Componente global** reutilizable
- ✅ **Estado persistente** en Firestore
- ✅ **Limpieza automática** de recursos
- ✅ **Performance optimizado** con React.useMemo
- ✅ **Manejo robusto** de permisos de cámara

## 🚀 Mejoras Futuras

### A Corto Plazo
1. **Subir videos a Firebase Storage**
   ```typescript
   const uploadVideo = async (blob: Blob) => {
     const storageRef = ref(storage, `panic-videos/${userId}/${timestamp}`);
     await uploadBytes(storageRef, blob);
     return getDownloadURL(storageRef);
   };
   ```

2. **Notificaciones push en tiempo real**
3. **Previsualización de video** antes de enviar
4. **Modo vibración** en móviles al activar

### A Medio Plazo
5. **Detección de caída** automática (acelerómetro)
6. **Activación por voz** ("Alexa, pánico")
7. **Compartir ubicación GPS** en tiempo real
8. **Chat de emergencia** con contactos

### A Largo Plazo
9. **IA para detección de situaciones** de peligro
10. **Integración con servicios** de emergencia locales
11. **Streaming de video** en vivo a contactos
12. **Red mesh** para funcionar sin internet

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 52+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 39+

### API Requeridas
- ✅ MediaDevices.getUserMedia (Cámara)
- ✅ MediaRecorder (Grabación)
- ✅ Blob (Almacenamiento temporal)
- ✅ Touch Events (Móvil)

### Permisos Necesarios
- 📹 **Cámara**: Para modo extremo
- 🎤 **Micrófono**: Para audio del video
- 📍 **Ubicación**: (Futuro) GPS preciso

## 🧪 Pruebas

### Test 1: Activación Normal
```
1. Login como usuario del plan
2. Ver botón flotante (rojo, izquierda)
3. Click 2 veces rápido
4. Mantener presionado 5 segundos
5. ✅ Alerta enviada
```

### Test 2: Activación con Modo Extremo
```
1. Configurar: Activar modo extremo
2. Guardar configuración
3. Click 2 veces en botón flotante
4. Mantener presionado
5. ✅ Cámara activa
6. ✅ "Grabando..." visible
7. Completar tiempo
8. ✅ Video guardado
9. ✅ Alerta enviada
```

### Test 3: Cancelación
```
1. Click 2 veces
2. Empezar a mantener (50% progreso)
3. Soltar botón
4. ✅ Grabación detenida
5. ✅ "Activación cancelada"
6. ✅ Sin alerta enviada
```

### Test 4: Sin Permisos de Cámara
```
1. Modo extremo activado
2. Bloquear permisos de cámara
3. Click 2 veces + mantener
4. ✅ Error: "No se pudo acceder a la cámara"
5. ✅ Alerta enviada sin video
```

## 📚 Documentos Relacionados

- [SISTEMA_BOTON_PANICO.md](./SISTEMA_BOTON_PANICO.md) - Sistema original de pánico
- [INICIO_RAPIDO_BOTON_PANICO.md](./INICIO_RAPIDO_BOTON_PANICO.md) - Guía de inicio
- [PLAN_SEGURIDAD_COMUNITARIA.md](./PLAN_SEGURIDAD_COMUNITARIA.md) - Plan de seguridad

---

**Sistema de Botón Flotante v1.0 - Calle Jerusalén Community** 🔘✨







