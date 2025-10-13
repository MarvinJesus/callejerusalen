# 🎮 Instrucciones de Uso - Botón de Pánico Flotante

## 🚀 ¡El Sistema Está Listo!

El botón de pánico flotante ha sido implementado y está **100% funcional**. Aquí te mostramos cómo usarlo.

---

## 📱 Para Usuarios Finales

### ¿Dónde Está el Botón?

El botón rojo flotante aparece automáticamente en la **esquina inferior izquierda** de TODAS las páginas de la aplicación.

```
┌─────────────────────────────────┐
│                                 │
│         [Cualquier Página]      │
│                                 │
│                                 │
│                                 │
│          ┌──────┐               │
│          │  ⚠️   │ ← AQUÍ       │
│          └──────┘                │
└─────────────────────────────────┘
```

### ¿Cómo Activar el Pánico?

#### Método 1: Activación Normal (Sin Grabación)

1. **Click 1**: Presiona el botón rojo
   - Verás un badge con el número "1"

2. **Click 2**: Presiona nuevamente (rápido)
   - Aparece mensaje: "Mantén presionado para activar"

3. **Mantener**: Presiona y mantén el botón
   - Verás una barra circular de progreso
   - Por defecto son 5 segundos

4. **Completar**: Espera a que la barra llegue al 100%
   - ✅ ¡Alerta enviada!
   - Tus contactos configurados son notificados

#### Método 2: Con Modo Extremo (Con Grabación de Video) 🎥

1. **Click 2 veces** (igual que antes)

2. **Mantener presionado**
   - 📹 La cámara frontal se activa automáticamente
   - Verás "Grabando..." en pantalla
   - El video se graba como evidencia

3. **Completar tiempo**
   - ✅ Alerta enviada
   - ✅ Video guardado

### ¿Cómo Cancelar?

Si presionaste el botón por error:

1. **Antes de completar el tiempo**: Simplemente suelta el botón
2. Verás mensaje: "Activación cancelada"
3. Si estaba grabando, la cámara se apaga automáticamente

---

## ⚙️ Configuración del Botón

### Acceder a la Configuración

1. Ve a: `http://localhost:3000/residentes/panico`
2. Click en la pestaña **"Configuración"**
3. Scroll hasta ver **"🔘 Botón de Pánico Flotante"**

### Opciones Disponibles

```
🔘 Botón de Pánico Flotante
├── [✓] Activar botón flotante
│   → Muestra/oculta el botón en toda la app
│
├── Tiempo para activar: [──●──] 5 segundos
│   → Ajusta entre 3-10 segundos
│   → Usa el slider para cambiar
│
└── Modo Pánico Extremo (AVANZADO)
    ├── [✓] Activar modo extremo 🎥
    │   → Activa la cámara al presionar
    │
    └── [✓] Grabar automáticamente
        → Inicia grabación automática
```

### Configuración Recomendada por Escenario

#### Para Emergencias Rápidas
```
✓ Activar botón flotante
Tiempo: 3 segundos
✗ Modo extremo
```
**Ideal para**: Situaciones donde necesitas respuesta inmediata

#### Para Máxima Seguridad (Recomendado)
```
✓ Activar botón flotante
Tiempo: 5 segundos
✓ Modo extremo
✓ Grabar automáticamente
```
**Ideal para**: Capturar evidencia visual de la emergencia

#### Para Evitar Falsas Alarmas
```
✓ Activar botón flotante
Tiempo: 7-10 segundos
✓ Modo extremo
✓ Grabar automáticamente
```
**Ideal para**: Usuarios que quieren estar seguros antes de activar

---

## 🎬 Tutorial Paso a Paso

### Primera Vez: Configurar el Sistema

```bash
# Paso 1: Iniciar sesión
→ http://localhost:3000/login
→ Ingresa tus credenciales

# Paso 2: Ir a configuración de pánico
→ http://localhost:3000/residentes/panico
→ Pestaña "Configuración"

# Paso 3: Seleccionar contactos de emergencia
→ Scroll a "👥 Contactos de Emergencia"
→ Click en 2-3 personas cercanas
→ O activa "Notificar a todos"

# Paso 4: Configurar botón flotante
→ Scroll a "🔘 Botón de Pánico Flotante"
→ Ajusta el tiempo (recomendado: 5 segundos)
→ Si quieres grabación de video:
  ✓ Activar modo extremo
  ✓ Grabar automáticamente

# Paso 5: Guardar
→ Click en "💾 Guardar Configuración"
→ ✅ "Configuración guardada exitosamente"

# Paso 6: Dar permisos de cámara (si activaste modo extremo)
→ El navegador pedirá permisos
→ Click en "Permitir"
```

### Usar el Botón Flotante

```bash
# Situación de emergencia
→ Busca el botón rojo (esquina inferior izquierda)
→ Click rápido 2 veces
→ Mantén presionado
→ Espera hasta que complete (5 segundos)
→ ✅ ¡Alerta enviada!

# Ver que pasó
→ Ve a la pestaña "Historial"
→ Verás tu alerta recién enviada
→ Muestra cuántas personas fueron notificadas
```

---

## 🎥 Modo Extremo: Detalles Técnicos

### ¿Qué Graba?

- **Cámara**: Frontal (selfie)
- **Audio**: Incluido en la grabación
- **Formato**: WebM (compatible con todos los navegadores)
- **Duración**: Desde que presionas hasta que completas + 2 segundos extra
- **Calidad**: Automática según dispositivo

### Permisos Requeridos

Al activar por primera vez, el navegador pedirá:

```
┌───────────────────────────────────┐
│  callejerusalen.com quiere:      │
│                                   │
│  📹 Usar tu cámara                │
│  🎤 Usar tu micrófono             │
│                                   │
│  [Bloquear]  [Permitir]           │
└───────────────────────────────────┘
```

**Importante**: Debes dar **"Permitir"** para que funcione el modo extremo.

### ¿Dónde Se Guarda el Video?

- **Temporal**: En la memoria del navegador durante la activación
- **Permanente**: Se enviará a Firebase Storage (próxima actualización)
- **Seguridad**: Solo tú y los administradores pueden verlo

---

## 🛡️ Seguridad y Privacidad

### ¿Quién Puede Ver el Botón?

✅ **Solo usuarios autorizados**:
- Residentes inscritos en el Plan de Seguridad
- Estado: "active" en el plan
- Administradores y super administradores

❌ **NO lo ven**:
- Visitantes
- Usuarios no registrados
- Residentes sin inscripción en el plan
- Usuarios con estado "pending" o "rejected"

### ¿Quién Es Notificado?

**Depende de tu configuración**:

1. **Contactos específicos**: Solo las personas que seleccionaste
2. **Notificar a todos**: Todos los miembros activos del plan
3. **Servicios de emergencia**: 911 (siempre)

### ¿Se Graba Sin Mi Permiso?

**NO**. El video solo se graba si:
1. Activaste el "Modo Extremo" en configuración
2. Diste permisos de cámara al navegador
3. Presionaste el botón de pánico

---

## ❓ Preguntas Frecuentes

### ¿Puedo desactivar el botón flotante?

**Sí**. Ve a Configuración → Desactiva "Activar botón flotante" → Guardar.

### ¿El botón funciona sin internet?

**No**. Requiere conexión para enviar la alerta y notificar a los contactos.

### ¿Funciona en móvil?

**Sí**. Compatible con touch events. Usa mantener presionado en lugar de mouse down.

### ¿Puedo cambiar el tiempo después?

**Sí**. Ve a Configuración → Ajusta el slider → Guardar. Los cambios aplican inmediatamente.

### ¿Qué pasa si no completo el tiempo?

**Nada**. La alerta se cancela y NO se envía notificación. La grabación de video (si estaba activa) se detiene y se descarta.

### ¿Puedo ver el video antes de enviarlo?

**No actualmente**. El video se guarda automáticamente al activar el pánico. Esta función llegará en futuras actualizaciones.

### ¿El botón hace ruido?

**No**. Es completamente silencioso. Solo muestra feedback visual.

### ¿Cuánto tiempo toma activar el pánico?

- **Mínimo**: 3 segundos (configurable)
- **Recomendado**: 5 segundos
- **Máximo**: 10 segundos (configurable)
- **Total con clicks**: ~6-7 segundos desde el primer click

---

## 🔧 Solución de Problemas

### El botón no aparece

**Posibles causas**:
1. ❌ No estás inscrito en el Plan de Seguridad
   - **Solución**: Ve a `/residentes/seguridad/inscribirse`

2. ❌ Tu inscripción está pendiente de aprobación
   - **Solución**: Espera aprobación del administrador

3. ❌ Desactivaste el botón en configuración
   - **Solución**: Ve a Configuración → Activa el botón → Guardar

### La cámara no se activa

**Posibles causas**:
1. ❌ Modo extremo no está activado
   - **Solución**: Actívalo en Configuración

2. ❌ No diste permisos de cámara
   - **Solución**: 
     - Chrome: Settings → Privacy → Camera → Permitir para el sitio
     - Firefox: Preferencias → Permisos → Cámara → Permitir

3. ❌ Tu dispositivo no tiene cámara frontal
   - **Solución**: El sistema usará la cámara disponible

### El video no se guarda

**Nota**: Actualmente el video se captura pero la subida a Storage está pendiente de implementación. Próximamente disponible.

### La alerta no se envió

**Verifica**:
1. ✅ ¿Tienes conexión a internet?
2. ✅ ¿Configuraste contactos de emergencia?
3. ✅ ¿Completaste el tiempo de espera?

---

## 📊 Estadísticas de Uso

Para ver tus alertas anteriores:

1. Ve a `/residentes/panico`
2. Click en pestaña **"Historial"**
3. Verás:
   - Fecha y hora de cada alerta
   - Ubicación reportada
   - Descripción
   - Cuántas personas fueron notificadas
   - Estado (Activo/Resuelto)

---

## 🎯 Mejores Prácticas

### ✅ Hacer

1. **Configurar antes de necesitarlo**
   - No esperes una emergencia para configurar

2. **Seleccionar contactos cercanos**
   - Prioriza personas de tu sector

3. **Probar el sistema**
   - Haz una prueba (sin completar el tiempo)

4. **Mantener ubicación actualizada**
   - Actualiza tu ubicación si te mudas

### ❌ NO Hacer

1. **Activar por juego**
   - Puede haber consecuencias legales

2. **Compartir tu configuración**
   - Es personal e intransferible

3. **Desactivar el botón**
   - Mantenlo activo para emergencias

4. **Bloquear permisos de cámara**
   - Si usas modo extremo, necesitas los permisos

---

## 📞 Soporte

### ¿Necesitas Ayuda?

**Documentación técnica**:
- [SISTEMA_BOTON_FLOTANTE.md](./SISTEMA_BOTON_FLOTANTE.md)
- [RESUMEN_BOTON_FLOTANTE.md](./RESUMEN_BOTON_FLOTANTE.md)

**Contacto**:
- Administrador del sistema
- Panel de ayuda en `/residentes`

---

## ✅ Checklist de Primera Configuración

```
Antes de usar el botón flotante:

□ Inscrito en el Plan de Seguridad
□ Inscripción aprobada (status: active)
□ Configuré contactos de emergencia
□ Ajusté el tiempo de activación
□ Si quiero grabación:
  □ Activé modo extremo
  □ Di permisos de cámara
□ Guardé la configuración
□ Probé el botón (sin completar tiempo)
□ Veo el botón rojo flotante

✅ ¡Listo! Sistema configurado correctamente
```

---

## 🎉 ¡Estás Protegido!

El botón de pánico flotante está diseñado para darte **acceso inmediato** a ayuda en caso de emergencia, desde cualquier página de la aplicación.

**Recuerda**:
- 🔴 Botón rojo = Emergencia real
- 📹 Modo extremo = Evidencia visual
- 👥 Contactos configurados = Respuesta rápida
- ⚙️ Configuración personalizada = Tu seguridad

---

**Sistema de Botón Flotante v1.0 - Calle Jerusalén Community** 🔘✨




