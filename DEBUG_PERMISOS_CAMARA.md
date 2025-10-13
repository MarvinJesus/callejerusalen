# 🔍 Debug: Permisos de Cámara - Modo Pánico Extremo

## 🎯 Problema Reportado

Al activar "Modo Pánico Extremo" dice que los permisos están denegados, pero en realidad no lo están.

## ✅ Solución Implementada

He mejorado la función para que:
1. ✅ Siempre INTENTE solicitar permisos al marcar el checkbox
2. ✅ Muestre el diálogo del navegador automáticamente
3. ✅ Agregue logs detallados en consola
4. ✅ Maneje errores específicos con mensajes claros

## 🧪 Cómo Diagnosticar

### Paso 1: Limpiar Estado Previo

```
1. Presiona F12 (abrir DevTools)
2. Ve a la pestaña "Application" (o "Aplicación")
3. En el menú izquierdo: "Storage" → "Clear site data"
4. Click "Clear site data"
5. Cerrar navegador completamente
6. Abrir navegador de nuevo
```

### Paso 2: Probar con Consola Abierta

```
1. Ir a http://localhost:3000/residentes/panico
2. Presionar F12 (mantener abierto)
3. Tab "Console"
4. Tab "Configuración" (en la página)
5. Marcar checkbox "Modo Pánico Extremo"
   ↓
   OBSERVAR EN CONSOLA:
```

### Logs Esperados (Caso Exitoso):

```javascript
🎥 Modo extremo: ACTIVADO
🎥 Solicitando permisos de cámara automáticamente...
🎥 Solicitando permisos de cámara al navegador...

// El navegador muestra diálogo:
// "localhost:3000 quiere usar tu cámara y micrófono"
// [Bloquear] [Permitir]

// Usuario hace click "Permitir":

✅ Permisos de cámara otorgados exitosamente
🛑 Deteniendo track: video
🛑 Deteniendo track: audio
```

### Si Ves Error en Consola:

```javascript
❌ Error al solicitar permisos de cámara: [Error]
Error name: NotAllowedError
Error message: Permission denied
```

Esto indica que el usuario bloqueó los permisos.

## 🔧 Soluciones Según el Error

### Error: "NotAllowedError" (Permisos Bloqueados)

**Causa**: El navegador tiene permisos bloqueados para este sitio.

**Solución**:

#### Chrome/Edge:
```
1. Click en el icono 🔒 (a la izquierda de la URL)
2. Buscar "Cámara"
3. Cambiar de "Bloquear" a "Permitir"
4. Recargar página (F5)
5. Marcar "Modo Pánico Extremo" de nuevo
```

#### Firefox:
```
1. Click en el icono 🛡️ (a la izquierda de la URL)
2. Click en "▶" o "Más información"
3. Buscar "Usar la cámara"
4. Cambiar a "Permitir"
5. Recargar página (F5)
6. Marcar "Modo Pánico Extremo" de nuevo
```

### Error: "NotFoundError" (Sin Cámara)

**Causa**: No hay cámara conectada al dispositivo.

**Solución**:
```
1. Verificar que tu dispositivo tenga cámara web
2. Si es laptop, verificar que esté conectada
3. Si es USB, reconectar
4. En Windows: Configuración → Privacidad → Cámara → Permitir apps
```

### Error: "NotReadableError" (Cámara en Uso)

**Causa**: Otra aplicación está usando la cámara.

**Solución**:
```
1. Cerrar: Zoom, Teams, Skype, Discord, etc.
2. Cerrar otras pestañas que usen cámara
3. Reintentar
```

### No Aparece el Diálogo

**Causa**: Permisos ya fueron bloqueados anteriormente.

**Solución**:
```
1. Limpiar permisos del sitio
2. Chrome: chrome://settings/content/siteDetails?site=http://localhost:3000
3. Restablecer permisos
4. Recargar página
5. Intentar de nuevo
```

## 🧪 Test Visual Paso a Paso

### Test 1: Desde Cero (Estado Limpio)

```
PREPARACIÓN:
1. Limpiar datos del sitio (F12 → Application → Clear site data)
2. Cerrar y abrir navegador
3. Ir a http://localhost:3000/residentes/panico
4. F12 → Console (dejar abierto)

ACTIVACIÓN:
5. Tab "Configuración"
6. Scroll a "Modo Pánico Extremo"
7. Marcar checkbox
   ↓

DEBE PASAR:
✓ Checkbox se marca visualmente
✓ Aparece sección "Estado de la Cámara"
✓ Badge amarillo: "⏳ Sin Configurar"
✓ Aparece botón: "🎥 Activar Permisos de Cámara"
✓ Toast: "📹 Solicitando permisos de cámara..."
✓ DIÁLOGO DEL NAVEGADOR APARECE:
  "localhost:3000 quiere usar tu cámara y micrófono"
  [Bloquear] [Permitir]

8. Click "Permitir"
   ↓

RESULTADO:
✓ Badge cambia a verde: "✓ Cámara Lista"
✓ Mensaje: "Cámara configurada y lista para emergencias"
✓ Toast verde: "✓ Permisos de cámara otorgados correctamente"
✓ En consola: "✅ Permisos de cámara otorgados exitosamente"
```

### Test 2: Con Botón Manual

Si el diálogo NO apareció automáticamente:

```
1. Marcar "Modo Pánico Extremo"
2. Ver badge amarillo "⏳ Sin Configurar"
3. Click en botón "🎥 Activar Permisos de Cámara"
   ↓
4. DEBE aparecer diálogo del navegador
5. Click "Permitir"
   ↓
6. Badge cambia a verde
```

## 🔍 Verificar Permisos en el Navegador

### Chrome/Edge:

```
1. Click derecho en página
2. "Inspeccionar"
3. Tab "Console"
4. Escribir:
   navigator.permissions.query({name: 'camera'})
   
5. Debe mostrar:
   PermissionStatus {state: "granted", ...}
   
   Si dice "denied": Permisos bloqueados
   Si dice "granted": Permisos otorgados
   Si dice "prompt": Aún no se han pedido
```

### Verificar Dispositivos Disponibles:

```
En Console:
navigator.mediaDevices.enumerateDevices()

Debe mostrar:
[
  {kind: "videoinput", label: "Cámara frontal", ...},
  {kind: "audioinput", label: "Micrófono", ...},
  ...
]

Si NO hay "videoinput": No tienes cámara
```

## 💡 Comandos de Depuración

Abre la consola (F12) y prueba estos comandos:

### 1. Verificar si el navegador soporta cámara:

```javascript
'mediaDevices' in navigator && navigator.mediaDevices.getUserMedia
// Debe devolver: true
```

### 2. Ver permisos actuales:

```javascript
navigator.permissions.query({name: 'camera'}).then(r => console.log(r.state))
// Debe mostrar: "granted", "denied" o "prompt"
```

### 3. Solicitar cámara manualmente:

```javascript
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => {
    console.log('✅ Permisos OK');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('❌ Error:', err.name, err.message));
```

## 🎬 Qué Debe Pasar (Video Tutorial)

### Secuencia Visual Correcta:

```
Acción: Marcar checkbox "Modo Pánico Extremo"
   ↓ 0.1s
Checkbox: Se marca visualmente ✓
   ↓ 0.1s
Sección: Aparece "Estado de la Cámara: ⏳ Sin Configurar"
   ↓ 0.1s
Toast: "📹 Solicitando permisos de cámara..."
   ↓ 0.2s
Navegador: MUESTRA DIÁLOGO NATIVO
┌────────────────────────────────────────┐
│ localhost:3000 quiere:                │
│ • Usar tu cámara                      │
│ • Usar tu micrófono                   │
│                                        │
│ [ Bloquear ]        [ Permitir ]      │ ← ESTE DIÁLOGO
└────────────────────────────────────────┘
   ↓
Usuario: Click "Permitir"
   ↓ 0.5s
Cámara: Se enciende brevemente (luz verde si es laptop)
   ↓ 1s
Cámara: Se apaga automáticamente
   ↓ 0.1s
Toast: "✓ Permisos de cámara otorgados correctamente"
   ↓ 0.1s
Badge: Cambia a verde "✓ Cámara Lista"
   ↓ 0.1s
Mensaje: "Cámara configurada y lista para emergencias"
```

## ❌ Si NO Aparece el Diálogo

### Causa 1: Permisos Ya Otorgados

Si los permisos ya están otorgados:
- El diálogo NO aparece
- La cámara se activa silenciosamente
- Se prueba y se apaga
- Badge cambia a verde directamente

**Esto es NORMAL y correcto**.

### Causa 2: Permisos Ya Bloqueados

Si bloqueaste permisos antes:
- El diálogo NO aparece
- Inmediatamente falla
- Badge cambia a rojo
- Toast de error aparece

**Solución**: Desbloquear en configuración del navegador.

### Causa 3: HTTPS Requerido

Algunos navegadores requieren HTTPS para cámara.

**En desarrollo (localhost)**: Debería funcionar sin HTTPS  
**En producción**: DEBE usar HTTPS

## 🔧 Solución Definitiva

### Opción 1: Resetear Permisos Completamente

```bash
# Chrome/Edge:
1. chrome://settings/content/siteDetails?site=http://localhost:3000
2. Scroll a "Permisos"
3. Cámara → "Preguntar (predeterminado)"
4. Cerrar pestaña de configuración
5. Volver a la app
6. Recargar (F5)
7. Marcar modo extremo
8. DEBE aparecer diálogo
```

### Opción 2: Usar Botón Manual

Si el automático falla:

```
1. Marcar "Modo Pánico Extremo"
2. Ignorar si dice "Sin Configurar"
3. Click en botón "🎥 Activar Permisos de Cámara"
4. DEBE aparecer diálogo
5. Permitir
6. Badge cambia a verde
```

### Opción 3: Probar en Navegador Diferente

```
Firefox / Chrome / Edge

Si funciona en uno pero no en otro:
→ El problema es específico del navegador
→ Limpiar datos de ese navegador
```

## 📝 Checklist de Diagnóstico

Marca lo que ves:

Al marcar "Modo Pánico Extremo":
- [ ] Checkbox se marca visualmente
- [ ] Aparece sección "Estado de la Cámara"
- [ ] Toast: "Solicitando permisos de cámara..."
- [ ] **¿Aparece diálogo del navegador?** ← CRÍTICO
- [ ] Después de permitir: Badge verde
- [ ] Mensaje: "Cámara configurada y lista"

En la CONSOLA (F12 → Console):
- [ ] "🎥 Modo extremo: ACTIVADO"
- [ ] "🎥 Solicitando permisos..."
- [ ] "✅ Permisos otorgados" O "❌ Error..."

## 🆘 Si Sigue Sin Funcionar

Ejecuta este comando en la consola del navegador (F12):

```javascript
// Test completo de cámara
navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}, audio: true})
  .then(stream => {
    console.log('✅ ÉXITO - Cámara funciona');
    console.log('Video tracks:', stream.getVideoTracks().length);
    console.log('Audio tracks:', stream.getAudioTracks().length);
    stream.getTracks().forEach(t => t.stop());
    alert('✅ Tu cámara funciona correctamente. El problema puede ser de código.');
  })
  .catch(err => {
    console.error('❌ ERROR:', err.name, '-', err.message);
    if (err.name === 'NotAllowedError') {
      alert('❌ Permisos BLOQUEADOS en el navegador. Ve a configuración.');
    } else if (err.name === 'NotFoundError') {
      alert('❌ NO se encontró cámara en tu dispositivo.');
    } else {
      alert('❌ Error: ' + err.message);
    }
  });
```

Y dime qué mensaje aparece.

## 📊 Estados Posibles

| Badge | Significado | Qué Hacer |
|-------|-------------|-----------|
| 🟢 ✓ Cámara Lista | Permisos OK | ✅ Nada, todo bien |
| 🟡 ⏳ Sin Configurar | No se han pedido | 📍 Click botón "Activar" |
| 🔴 ✗ Permisos Denegados | Bloqueados | ⚙️ Ir a config navegador |

## 🎯 Flujo Correcto

```
Usuario marca checkbox
   ↓
onChange se ejecuta
   ↓
setExtremeModeEnabled(true)
   ↓
setTimeout 100ms (para que checkbox se marque)
   ↓
requestCameraPermission() se llama
   ↓
navigator.mediaDevices.getUserMedia({...})
   ↓
[DIÁLOGO DEL NAVEGADOR DEBE APARECER AQUÍ]
   ↓
Usuario click "Permitir"
   ↓
Stream obtenido
   ↓
setCameraPermissionStatus('granted')
   ↓
stream.getTracks().forEach(track => track.stop())
   ↓
Toast verde + Badge verde
```

## 🔍 Verificación Directa en Navegador

### Ver Permisos Otorgados:

**Chrome**:
```
1. chrome://settings/content/camera
2. Buscar "localhost:3000"
3. Debe decir "Permitir"
```

**Firefox**:
```
1. about:preferences#privacy
2. Scroll a "Permisos"
3. Cámara → Configuración
4. Buscar "localhost:3000"
5. Debe estar en "Permitir"
```

## 💡 Consejo Pro

Prueba en **ventana de incógnito**:

```
1. Ctrl + Shift + N (Chrome) o Ctrl + Shift + P (Firefox)
2. Ir a http://localhost:3000/residentes/panico
3. Login
4. Configuración
5. Marcar modo extremo
6. Permitir cuando pregunte

Si funciona en incógnito pero no en normal:
→ El problema son permisos guardados en navegador normal
→ Solución: Limpiar datos del sitio
```

## 🎬 Video de Qué Debe Pasar

Cuando marcas el checkbox:

```
Segundo 0.0: Click en checkbox
Segundo 0.1: Checkbox marcado ✓
Segundo 0.2: Toast "Solicitando permisos..."
Segundo 0.3: DIÁLOGO APARECE ← ESTE ES EL CRÍTICO
Segundo X.X: Usuario click "Permitir"
Segundo X.X+0.5: Luz de cámara parpadea
Segundo X.X+1.0: Luz se apaga
Segundo X.X+1.1: Badge verde aparece
Segundo X.X+1.2: Toast "Permisos otorgados"
```

**Si NO ves el DIÁLOGO en el Segundo 0.3**:
→ Los permisos están bloqueados en el navegador
→ Necesitas ir a configuración del navegador

## 📞 Necesito Información

Para ayudarte mejor, dime:

1. **¿Qué navegador usas?** (Chrome, Firefox, Edge)
2. **¿Aparece el diálogo del navegador?** (Sí/No)
3. **¿Qué dice la consola?** (F12 → Console → copiar mensajes)
4. **¿Funcionó el test manual?** (el código JavaScript de arriba)
5. **¿Funciona en ventana incógnito?** (Sí/No)

Con esa info puedo darte la solución exacta.

---

**Estado**: 🔧 Mejoras Implementadas  
**Siguiente Paso**: Probar con consola abierta y reportar logs  
**Objetivo**: Que el diálogo del navegador aparezca correctamente


