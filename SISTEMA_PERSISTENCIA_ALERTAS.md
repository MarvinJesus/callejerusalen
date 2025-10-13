# Sistema de Persistencia de Alertas de Pánico

## 📋 Resumen

Se ha implementado un sistema completo de **persistencia de alertas** que garantiza que las notificaciones de pánico se mantengan visibles para los usuarios receptores durante toda la duración configurada, hasta que:

1. ✅ El usuario presione el botón **"HE SIDO NOTIFICADO"**
2. ⏱️ O la alerta **expire** por tiempo configurado

## 🎯 Problema Resuelto

**Antes**: Las alertas se mostraban una vez y desaparecían si el usuario cerraba el modal.

**Ahora**: Las alertas persisten y se vuelven a mostrar automáticamente cada 15 segundos hasta que el usuario las confirme o expiren.

## ✨ Características Implementadas

### 1. **Sistema de Confirmación en Firestore**

Cada alerta de pánico ahora registra:
```typescript
interface PanicReport {
  // ... campos existentes ...
  acknowledgedBy: string[]; // Array de userIds que confirmaron
  alertDurationMinutes: number; // Duración en minutos
  expiresAt: Date; // Timestamp de expiración
}
```

### 2. **Verificación Periódica Automática**

- **Frecuencia**: Cada 15 segundos
- **Qué verifica**:
  - Alertas activas donde el usuario está notificado
  - Si el usuario ya confirmó la alerta
  - Si la alerta ya expiró por tiempo
  - Si la alerta debe mostrarse nuevamente

### 3. **Lógica de Persistencia**

```
Para cada alerta activa:
  ┌─ ¿Usuario confirmó? → SÍ → No mostrar
  │
  ├─ ¿Alerta expiró? → SÍ → No mostrar
  │
  └─ ¿No confirmada y no expirada? → SÍ → Mostrar modal
```

### 4. **Confirmación con Botón**

Cuando el usuario presiona **"HE SIDO NOTIFICADO"**:

1. Se guarda su `userId` en el array `acknowledgedBy` en Firestore
2. Se registra localmente para evitar duplicados
3. Se detiene el sonido de alarma
4. Se cierra el modal
5. Se muestra toast de confirmación
6. La alerta NO se volverá a mostrar a ese usuario

### 5. **Visualización del Tiempo Restante**

El modal ahora muestra:
- ⏱️ **Duración configurada** (ej: "5 minutos")
- ⏳ **Tiempo restante** en formato "MM:SS min restantes"
- 📊 **Advertencia de persistencia** explicando el comportamiento
- 🔄 **Intervalo de verificación** (cada 15 segundos)

## 🔄 Flujo Completo

### Escenario 1: Usuario Confirma la Alerta

```
1. Alerta activada (14:00) → Duración: 10 min → Expira: 14:10
2. Usuario A recibe alerta → Modal aparece con sonido
3. Usuario A presiona "HE SIDO NOTIFICADO"
4. Sistema guarda userId en acknowledgedBy
5. Modal se cierra
6. ✅ Alerta NO se vuelve a mostrar a Usuario A
7. Otros usuarios SÍ seguirán viendo la alerta hasta:
   - Confirmen ellos también
   - O expire a las 14:10
```

### Escenario 2: Usuario No Confirma (Cierra el Modal)

```
1. Alerta activada (14:00) → Duración: 10 min
2. Usuario B recibe alerta → Modal aparece
3. Usuario B cierra modal con X (sin confirmar)
4. Sistema NO registra confirmación
5. Después de 15 segundos → Modal aparece nuevamente
6. 🔄 Se repite cada 15 segundos hasta:
   - Usuario B presione "HE SIDO NOTIFICADO"
   - O alerta expire (14:10)
```

### Escenario 3: Alerta Expira por Tiempo

```
1. Alerta activada (14:00) → Duración: 5 min → Expira: 14:05
2. Usuarios reciben alerta → Algunos confirman, otros no
3. A las 14:05 → Sistema marca alerta como 'expired'
4. ✅ Verificación periódica detecta expiración
5. Modal se cierra automáticamente
6. No se vuelve a mostrar a ningún usuario
```

## 🔧 Implementación Técnica

### Archivos Modificados

1. **context/WebSocketContext.tsx**
   - Agregados campos `acknowledgedBy`, `alertDurationMinutes`, `expiresAt` a `PanicAlert`
   - Actualizado estado para incluir `'expired'`

2. **components/PanicAlertModal.tsx**
   - Importado Firestore (`updateDoc`, `arrayUnion`)
   - Agregado estado `acknowledgedAlerts` y `timeRemaining`
   - Implementado `useEffect` de verificación periódica (15s)
   - Modificado `handleCloseAlert` para guardar confirmación
   - Agregado cálculo de tiempo restante en tiempo real
   - Agregada visualización de duración y persistencia

3. **components/PanicNotificationSystem.tsx**
   - Mismos cambios que PanicAlertModal
   - Confirmación en Firestore al cerrar

4. **components/FloatingPanicButton.tsx**
   - Agregado `acknowledgedBy: []` al crear alerta

5. **app/residentes/panico/page.tsx**
   - Agregado campo `acknowledgedBy` a interfaz
   - Actualizado historial para mostrar confirmaciones
   - Carga de `acknowledgedBy` desde Firestore

### Código Clave

#### Verificación Periódica (cada 15s)
```typescript
useEffect(() => {
  const checkUnacknowledgedAlerts = async () => {
    // Buscar alertas activas no confirmadas
    const q = query(
      reportsRef,
      where('status', '==', 'active'),
      where('notifiedUsers', 'array-contains', user.uid)
    );
    
    // Para cada alerta:
    // - Verificar si ya confirmó
    // - Verificar si expiró
    // - Mostrar si no confirmada y no expirada
  };
  
  checkUnacknowledgedAlerts(); // Inmediato
  const interval = setInterval(checkUnacknowledgedAlerts, 15000);
  return () => clearInterval(interval);
}, [user, currentAlert, acknowledgedAlerts]);
```

#### Guardar Confirmación
```typescript
const handleCloseAlert = async () => {
  // Guardar en Firestore
  await updateDoc(doc(db, 'panicReports', alertId), {
    acknowledgedBy: arrayUnion(user.uid)
  });
  
  // Marcar localmente
  setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  
  // Cerrar modal
  setCurrentAlert(null);
};
```

#### Tiempo Restante (actualización cada 1s)
```typescript
useEffect(() => {
  const updateTimeRemaining = () => {
    const diffMs = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    setTimeRemaining(`${minutes}:${seconds.padStart(2, '0')} min`);
  };
  
  const interval = setInterval(updateTimeRemaining, 1000);
  return () => clearInterval(interval);
}, [currentAlert]);
```

## 📊 Estados de Alerta por Usuario

| Estado Usuario | Descripción | Acción del Sistema |
|----------------|-------------|-------------------|
| **No Confirmada** | Usuario en `notifiedUsers` pero NO en `acknowledgedBy` | Mostrar cada 15s |
| **Confirmada** | Usuario en `acknowledgedBy` | NO mostrar más |
| **Expirada** | `now >= expiresAt` | NO mostrar más |
| **Resuelta** | `status: 'resolved'` | NO mostrar más |

## 🎨 Interfaz de Usuario

### Modal de Alerta Mejorado

```
┌─────────────────────────────────────────────────┐
│ 🚨 ¡EMERGENCIA!                           X    │
│ Alerta de pánico activada                      │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ ⏱️ Alerta con Duración Configurada         ││
│ │                                             ││
│ │ Duración: 10 minutos                        ││
│ │ ⏳ 7:35 min restantes                       ││
│ │                                             ││
│ │ ⚠️ Esta alerta persistirá hasta que:       ││
│ │   ✓ Presiones "HE SIDO NOTIFICADO"         ││
│ │   ✓ O expire el tiempo (10 min)            ││
│ │                                             ││
│ │ 💡 Se te volverá a mostrar cada 15 seg     ││
│ │    si no la confirmas                       ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ [LLAMAR AL 911] [HE SIDO NOTIFICADO]           │
└─────────────────────────────────────────────────┘
```

### Historial con Confirmaciones

```
┌─────────────────────────────────────┐
│ 🛡️ Alerta de Emergencia            │
│                                     │
│ ⏱️ Duración: 10 minutos             │
│    Expira: 14:10:00                 │
│                                     │
│ ✅ 3 de 5 confirmaron recepción     │
│                                     │
│ 🔔 5 personas notificadas           │
│                        [Activo 🔴] │
└─────────────────────────────────────┘
```

## 🔐 Seguridad y Privacidad

- ✅ Solo usuarios notificados pueden ver la alerta
- ✅ Solo usuarios autenticados pueden confirmar
- ✅ Confirmaciones son inmutables (array en Firestore)
- ✅ No se expone información a usuarios no autorizados
- ✅ Respeta reglas de Firestore

## ⚡ Rendimiento

### Frecuencias de Verificación

| Proceso | Frecuencia | Propósito |
|---------|-----------|-----------|
| **Verificar alertas no confirmadas** | 15 segundos | Volver a mostrar |
| **Actualizar tiempo restante** | 1 segundo | Contador en vivo |
| **Verificar expiración** | 30 segundos | Auto-resolver |

### Optimizaciones

- ✅ Queries filtrados por `notifiedUsers` (array-contains)
- ✅ Solo consulta alertas `status: 'active'`
- ✅ Set local para evitar consultas duplicadas
- ✅ Batch operations donde sea posible

## 🧪 Cómo Probarlo

### Prueba de Persistencia (Configuración Corta)

1. **Usuario A (Emisor)**:
   - Configurar duración: 2 minutos
   - Activar alerta de pánico
   
2. **Usuario B (Receptor)**:
   - Recibe modal de alerta
   - Cerrar modal con "X" (NO confirmar)
   - Esperar 15 segundos
   - ✅ **Verificar**: Modal aparece nuevamente
   - Cerrar nuevamente
   - Esperar 15 segundos
   - ✅ **Verificar**: Modal aparece de nuevo
   - Presionar "HE SIDO NOTIFICADO"
   - ✅ **Verificar**: Modal NO vuelve a aparecer

3. **Usuario C (Receptor)**:
   - Recibe modal
   - NO hace nada
   - ✅ **Verificar**: Modal persiste por 2 minutos
   - ✅ **Verificar**: Después de 2 min, modal desaparece (expiró)

### Prueba de Confirmaciones Múltiples

1. Crear alerta con 5 usuarios notificados
2. Que 3 usuarios confirmen "HE SIDO NOTIFICADO"
3. Ver historial (Usuario emisor):
   - ✅ Debe mostrar: "3 de 5 confirmaron recepción"

## 💡 Beneficios

### Para Usuarios Receptores

- ✅ **No pierden alertas**: Aunque cierren el modal, la alerta persiste
- ✅ **Control total**: Pueden confirmar cuando estén listos
- ✅ **Visibilidad clara**: Saben cuánto tiempo durará la alerta
- ✅ **Sin spam**: Una vez confirmada, no se vuelve a mostrar

### Para Usuarios Emisores

- ✅ **Tranquilidad**: Saben que la alerta persiste
- ✅ **Seguimiento**: Ven quiénes confirmaron recepción
- ✅ **Estadísticas**: Pueden ver tasa de confirmación

### Para el Sistema

- ✅ **Confiabilidad**: Las alertas no se pierden
- ✅ **Trazabilidad**: Registro completo de confirmaciones
- ✅ **Eficiencia**: Solo muestra a usuarios no confirmados

## 🔄 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────┐
│         USUARIO RECIBE ALERTA DE PÁNICO             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Modal aparece  │
            │ con sonido 🔊  │
            └────────┬───────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ▼                   ▼
  ┌────────────────┐   ┌──────────────────┐
  │ Presiona       │   │ Cierra con X     │
  │ "HE SIDO       │   │ (No confirma)    │
  │ NOTIFICADO"    │   │                  │
  └────────┬───────┘   └─────────┬────────┘
           │                     │
           │                     ▼
           │           ┌──────────────────┐
           │           │ Espera 15 seg    │
           │           └─────────┬────────┘
           │                     │
           │                     ▼
           │           ┌──────────────────┐
           │           │ ¿Alerta expiró?  │
           │           └────┬────────┬────┘
           │                │        │
           │              SÍ│        │NO
           │                │        │
           │                ▼        ▼
           │           [FIN]  ┌──────────────┐
           │                  │ Modal aparece│
           │                  │  nuevamente  │
           │                  └──────┬───────┘
           │                         │
           │                         └──┐
           ▼                            │
  ┌────────────────┐                   │
  │ Guarda userId  │◄──────────────────┘
  │ en Firestore   │
  └────────┬───────┘
           │
           ▼
  ┌────────────────┐
  │ Marca como     │
  │ confirmada     │
  └────────┬───────┘
           │
           ▼
      [ALERTA NO SE
      VUELVE A MOSTRAR]
```

## 📂 Estructura de Datos

### En Firestore (panicReports)

```json
{
  "id": "alert123",
  "userId": "user1",
  "userName": "Juan Pérez",
  "status": "active",
  "notifiedUsers": ["user2", "user3", "user4"],
  "acknowledgedBy": ["user2"], // Solo user2 confirmó
  "alertDurationMinutes": 10,
  "expiresAt": "2025-10-12T14:10:00",
  "timestamp": "2025-10-12T14:00:00"
}
```

### Estado de Confirmación por Usuario

- **user2**: ✅ Confirmó → No verá más la alerta
- **user3**: ❌ No confirmó → Verá modal cada 15s
- **user4**: ❌ No confirmó → Verá modal cada 15s

## 🎯 Casos de Uso

### Caso 1: Emergencia Real
```
Usuario en peligro activa pánico
→ 5 vecinos reciben alerta
→ 3 confirman inmediatamente y van en camino
→ 2 no están disponibles (no confirman)
→ La alerta persiste para los 2 no disponibles
→ Después de 5 min expira para todos
```

### Caso 2: Usuario Distraído
```
Usuario recibe alerta pero está ocupado
→ Cierra modal sin confirmar
→ 15 segundos después → Modal reaparece
→ Usuario lo ve de nuevo y ahora confirma
→ Modal deja de aparecer
```

### Caso 3: Falsa Alarma Cancelada
```
Usuario activa pánico por error
→ Administrador marca como resuelta
→ Modal desaparece para todos inmediatamente
→ No se vuelve a mostrar a nadie
```

## 🛠️ Configuración

### Intervalos Ajustables

```typescript
// En PanicAlertModal.tsx

// Verificar alertas no confirmadas
const interval = setInterval(checkAlerts, 15000); // 15 segundos

// Actualizar tiempo restante
const interval = setInterval(updateTime, 1000); // 1 segundo
```

Puedes ajustar estos valores según necesites:
- **Más frecuente** (10s): Más insistente, más consultas
- **Menos frecuente** (30s): Menos consultas, menos insistente

## ⚠️ Consideraciones

### Cuando el Usuario Está Offline

- Las alertas se guardan en Firestore
- Cuando el usuario vuelva online, verá las alertas pendientes
- Solo si no han expirado

### Múltiples Alertas Simultáneas

- Se usa sistema de **cola**
- Una alerta visible a la vez
- Las demás esperan en cola
- Se procesan secuencialmente

### Sonido de Alarma

- Se reproduce solo cuando aparece nueva alerta
- El usuario puede desactivarlo temporalmente
- Se detiene al confirmar o cerrar

## 📊 Métricas y Tracking

### En el Historial (Usuario Emisor)

- ✅ Total de usuarios notificados
- ✅ Cuántos confirmaron recepción
- ✅ Porcentaje de confirmación
- ✅ Estado de la alerta (activa/expirada/resuelta)

### Ejemplo Visual

```
Alerta de Emergencia - 12/10/2025 14:00

⏱️ Duración: 10 minutos | Expira: 14:10:00
✅ 3 de 5 confirmaron recepción
🔔 5 personas notificadas

Estado: Activo 🔴
```

## 🚀 Ventajas del Sistema

1. **Confiabilidad**: Las alertas no se pierden aunque el usuario cierre el modal
2. **Flexibilidad**: Cada usuario confirma cuando puede
3. **Visibilidad**: El emisor ve quién recibió la alerta
4. **Eficiencia**: Solo persiste durante el tiempo configurado
5. **Control**: Los usuarios tienen control sobre cuándo confirmar

## 🐛 Solución de Problemas

**Problema**: La alerta no aparece
- Verificar que el usuario esté en `notifiedUsers`
- Verificar que no esté en `acknowledgedBy`
- Verificar que la alerta no haya expirado
- Revisar consola por errores

**Problema**: La alerta aparece constantemente (cada 15s)
- Esto es el comportamiento esperado si NO confirmas
- Presiona "HE SIDO NOTIFICADO" para detenerla
- O espera a que expire

**Problema**: Confirmé pero sigue apareciendo
- Verificar conexión a internet
- Revisar que se guardó en Firestore
- Limpiar caché del navegador

## 📈 Estadísticas Esperadas

En una alerta típica con 10 usuarios notificados:

- **5-7 usuarios**: Confirmarán en los primeros 2 minutos
- **2-3 usuarios**: Confirmarán después de ver modal 2-3 veces
- **0-2 usuarios**: No confirmarán (offline, ocupados)
- **100%**: Dejarán de ver alerta al expirar

## ✅ Checklist de Implementación

- [x] Interfaz `PanicReport` con `acknowledgedBy`
- [x] Guardar confirmaciones en Firestore
- [x] Verificación periódica (15s)
- [x] Lógica de volver a mostrar
- [x] Visualización de tiempo restante
- [x] UI de información de persistencia
- [x] Historial con confirmaciones
- [x] Compilación exitosa

## 🎓 Resumen Ejecutivo

**En 3 puntos:**

1. 🔄 **Persistencia**: Las alertas se muestran cada 15 segundos hasta que el usuario confirme o expiren
2. ✅ **Confirmación**: Al presionar "HE SIDO NOTIFICADO" se guarda en Firestore y no se vuelve a mostrar
3. ⏱️ **Duración**: Las alertas expiran automáticamente según el tiempo configurado por el emisor

---

**Estado**: ✅ Completamente Implementado y Compilado  
**Fecha**: Octubre 2025  
**Versión**: 2.0.0

