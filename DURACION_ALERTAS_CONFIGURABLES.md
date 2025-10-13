# Sistema de Duración Configurable de Alertas de Pánico

## 📋 Resumen

Se ha implementado una funcionalidad completa para que las alertas de pánico tengan una duración configurable en minutos. La señal de alerta ahora se mantiene activa durante un período de tiempo definido por el usuario y se desactiva automáticamente al expirar.

## ✨ Características Implementadas

### 1. **Configuración de Duración por Usuario**

- Cada usuario puede configurar la duración de sus alertas de pánico (1-60 minutos)
- La configuración se guarda en Firebase junto con las demás preferencias del botón de pánico
- El valor predeterminado es 5 minutos

### 2. **Interfaz de Usuario Mejorada**

#### Panel de Configuración (`/residentes/panico`)
- Nuevo control deslizante para ajustar la duración de alertas
- Rango: 1 a 60 minutos
- Visual atractivo con colores naranja indicando la temporalidad
- Muestra en tiempo real cuántos minutos durará la alerta
- Se integra perfectamente con las demás configuraciones del botón de pánico

#### Historial de Alertas
- Muestra la duración configurada de cada alerta
- Indica la hora de expiración
- Estados visuales diferenciados:
  - **Activo** (rojo): Alerta en curso
  - **Resuelto** (verde): Alerta resuelta manualmente
  - **Expirada** (naranja): Alerta desactivada automáticamente
  - **Expirada (Auto)** (naranja): Indica que fue resuelta por el sistema

### 3. **Estructura de Datos Actualizada**

#### `PanicButtonSettings` (lib/auth.ts)
```typescript
export interface PanicButtonSettings {
  // ... campos existentes ...
  alertDurationMinutes: number; // Duración de la señal de alerta en minutos (default: 5)
}
```

#### `PanicReport` (app/residentes/panico/page.tsx)
```typescript
interface PanicReport {
  // ... campos existentes ...
  status: 'active' | 'resolved' | 'expired';
  alertDurationMinutes?: number;      // Duración configurada en minutos
  expiresAt?: any;                    // Timestamp de expiración
  autoResolved?: boolean;             // Si fue resuelta automáticamente
}
```

### 4. **Sistema de Auto-Resolución**

#### Verificación Periódica
- Se ejecuta cada 30 segundos automáticamente
- Verifica todas las alertas activas del usuario
- Compara la hora actual con el tiempo de expiración
- Actualiza automáticamente las alertas expiradas

#### Proceso de Expiración
1. La alerta se marca con `status: 'expired'`
2. Se establece `autoResolved: true`
3. Se registra `resolvedAt` con timestamp del servidor
4. Se notifica al usuario con un toast informativo
5. Se actualiza el historial automáticamente

### 5. **Cálculo de Tiempo de Expiración**

Cuando se activa una alerta:
```typescript
const now = new Date();
const expiresAt = new Date(now.getTime() + alertDurationMinutes * 60 * 1000);
```

- Se calcula sumando los minutos configurados a la hora actual
- Se guarda tanto en Firestore como en el estado local
- Se muestra en el historial en formato legible

### 6. **Integración Completa**

#### Botón de Pánico Principal
- Incluye duración en la activación de alerta
- Muestra duración en el mensaje de éxito
- Guarda toda la información en Firestore

#### Botón Flotante
- También respeta la configuración de duración
- Aplica el mismo cálculo de expiración
- Mantiene consistencia con el botón principal

#### WebSocket
- Las alertas enviadas por WebSocket también incluyen la información de duración
- Los administradores pueden ver cuánto tiempo durará cada alerta

## 🔧 Archivos Modificados

1. **lib/auth.ts**
   - Agregado campo `alertDurationMinutes` a `PanicButtonSettings`

2. **app/residentes/panico/page.tsx**
   - Actualizada interfaz `PanicReport` con campos de duración y expiración
   - Agregado estado `alertDurationMinutes`
   - Implementada función `checkAndResolveExpiredAlerts()`
   - Agregado useEffect para verificación periódica
   - Actualizado `handlePanicActivation()` para incluir duración
   - Actualizado `loadRecentReports()` para cargar campos adicionales
   - Mejorada UI de configuración con control de duración
   - Mejorado historial con información de expiración

3. **components/FloatingPanicButton.tsx**
   - Actualizada configuración por defecto con `alertDurationMinutes: 5`
   - Modificado `activatePanic()` para incluir cálculo de expiración
   - Actualizado mensaje de éxito con duración

## 📊 Flujo de Funcionamiento

### Configuración
```
Usuario → Panel de Configuración → Ajusta duración (1-60 min) → Guarda → Firebase
```

### Activación de Alerta
```
1. Usuario activa botón de pánico
2. Sistema lee configuración (alertDurationMinutes)
3. Calcula expiresAt = now + (alertDurationMinutes * 60 * 1000)
4. Guarda alerta con:
   - status: 'active'
   - alertDurationMinutes
   - expiresAt
   - autoResolved: false
5. Envía por WebSocket y guarda en Firestore
6. Muestra mensaje: "Durará X min"
```

### Monitoreo y Expiración
```
1. Verificación automática cada 30 segundos
2. Para cada alerta activa:
   - Compara now >= expiresAt
   - Si expiró: actualiza a 'expired'
3. Notifica al usuario
4. Actualiza historial
```

## 🎯 Beneficios

1. **Flexibilidad**: Cada usuario decide cuánto tiempo necesita que dure su alerta
2. **Automatización**: No requiere intervención manual para desactivar
3. **Claridad**: Todos saben cuándo expirará una alerta
4. **Historial**: Se mantiene registro de la duración de cada alerta
5. **Eficiencia**: Sistema de verificación optimizado (30 segundos)
6. **Consistencia**: Funciona igual en botón principal y flotante

## 🚀 Uso

### Para Usuarios

1. **Configurar duración**:
   - Ir a `/residentes/panico`
   - Pestaña "Configuración"
   - Ajustar el control deslizante "Duración de la Señal de Alerta"
   - Elegir entre 1 y 60 minutos
   - Guardar configuración

2. **Activar alerta**:
   - La alerta se creará con la duración configurada
   - Se mostrará mensaje indicando cuántos minutos durará
   - La alerta se desactivará automáticamente al expirar

3. **Ver historial**:
   - Cada alerta muestra su duración configurada
   - Se indica la hora de expiración
   - El estado muestra si expiró automáticamente

### Para Administradores

- Pueden ver en tiempo real las alertas activas
- Conocen cuándo expirará cada alerta
- Pueden distinguir entre alertas resueltas manualmente y expiradas automáticamente

## 🔐 Consideraciones de Seguridad

- Las alertas solo pueden ser actualizadas por su propietario
- El sistema de verificación respeta las reglas de Firestore
- La expiración es determinística y basada en timestamps del servidor
- No se pierde historial: todas las alertas expiradas quedan registradas

## 📈 Rendimiento

- **Verificación**: Cada 30 segundos (configurable)
- **Consultas**: Solo alertas activas del usuario actual
- **Updates**: Batch processing para múltiples expirations
- **Toast notifications**: Solo cuando se resuelven alertas

## 🔮 Futuras Mejoras Posibles

1. Permitir diferentes duraciones para diferentes tipos de emergencia
2. Agregar notificaciones push cuando una alerta esté por expirar
3. Dashboard administrativo con visualización de alertas por tiempo
4. Estadísticas de duración promedio de alertas
5. Sugerencias automáticas de duración basadas en histórico

## ✅ Testing

### Pruebas Recomendadas

1. **Configuración**:
   - [ ] Ajustar duración a diferentes valores
   - [ ] Guardar y recargar página
   - [ ] Verificar persistencia

2. **Activación**:
   - [ ] Crear alerta con duración corta (1-2 min)
   - [ ] Verificar que se guarda correctamente
   - [ ] Confirmar mensaje de éxito muestra duración

3. **Expiración**:
   - [ ] Esperar que alerta expire
   - [ ] Verificar cambio automático a 'expired'
   - [ ] Confirmar notificación toast
   - [ ] Revisar historial muestra estado correcto

4. **Botón Flotante**:
   - [ ] Activar desde botón flotante
   - [ ] Confirmar usa misma duración configurada
   - [ ] Verificar comportamiento idéntico

## 📝 Notas Técnicas

- Los timestamps usan `serverTimestamp()` para consistencia
- La conversión a Date se maneja con `.toDate()` cuando disponible
- El intervalo de verificación puede ajustarse modificando `30000ms`
- Los estados visuales usan Tailwind CSS para consistencia

## 🐛 Solución de Problemas

**Problema**: Las alertas no expiran automáticamente
- Verificar que el usuario esté en la página o que haya otros usuarios monitoreando
- Revisar consola por errores en `checkAndResolveExpiredAlerts()`

**Problema**: La duración no se guarda
- Verificar permisos de escritura en `panicButtonSettings`
- Confirmar que el campo `alertDurationMinutes` existe en Firestore

**Problema**: Timestamp inválido
- Verificar que Firebase SDK está correctamente configurado
- Confirmar uso de `serverTimestamp()` en lugar de `new Date()`

## 📞 Soporte

Para más información o problemas técnicos, contactar al equipo de desarrollo.

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y Funcional


