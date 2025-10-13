# 🧪 Guía de Prueba Rápida - Sistema de Notificaciones de Pánico

## ⚡ Prueba Rápida (5 minutos)

### Paso 1: Preparación (2 usuarios necesarios)

**Usuario A (Activador)**
- Email: usuario_a@ejemplo.com
- Debe estar inscrito en el Plan de Seguridad

**Usuario B (Receptor)**
- Email: usuario_b@ejemplo.com
- Debe estar inscrito en el Plan de Seguridad

---

### Paso 2: Configurar Contactos (Usuario A)

1. **Usuario A** inicia sesión
2. Ir a: `/residentes/panico`
3. Click en pestaña **"Configuración"**
4. Seleccionar **Usuario B** de la lista de contactos
5. Click en **"Guardar Configuración"**
6. ✅ Verificar mensaje: "Configuración guardada exitosamente"

---

### Paso 3: Configurar Permisos (Usuario B)

1. **Usuario B** inicia sesión
2. Esperar a que aparezca el botón: **"Activar notificaciones de emergencia"** (esquina inferior izquierda)
3. Click en el botón
4. Permitir notificaciones en el navegador
5. ✅ Verificar mensaje: "Notificaciones activadas"

**Nota**: Si no aparece el botón, las notificaciones ya están activadas o el navegador las tiene bloqueadas.

---

### Paso 4: Activar Pánico (Usuario A)

**Opción 1: Desde la página**

1. Ir a pestaña **"Botón de Pánico"**
2. Opcional: Ingresar ubicación y descripción
3. Click en **"ACTIVAR ALERTA DE PÁNICO"**
4. Esperar 5 segundos (o cancelar)
5. ✅ Verificar mensaje: "¡Alerta de emergencia enviada!"

**Opción 2: Desde el botón flotante**

1. Localizar botón rojo flotante (esquina inferior izquierda)
2. **Doble click** rápido
3. **Mantener presionado** por 5 segundos
4. ✅ El botón muestra progreso circular

---

### Paso 5: Verificar Notificación (Usuario B)

**Usuario B debe recibir AUTOMÁTICAMENTE:**

1. **🔊 Sonido de Alarma**
   - Patrón intermitente de dos tonos
   - Se reproduce automáticamente
   - ✅ Escuchar: "beep-beep-beep-beep"

2. **📢 Notificación del Navegador**
   - Aparece en la esquina del escritorio/móvil
   - Título: "🚨 ALERTA DE PÁNICO"
   - Cuerpo: Información del Usuario A
   - ✅ Puede vibrar en móviles

3. **🖼️ Modal Visual**
   - Aparece automáticamente en la pantalla
   - Fondo rojo pulsante
   - Información completa:
     - Nombre del solicitante
     - Ubicación
     - Descripción
     - Hora de la alerta
   - ✅ Botones de acción disponibles

4. **🍞 Toast Notification**
   - Esquina superior derecha
   - Fondo rojo
   - Mensaje: "🚨 ¡ALERTA DE PÁNICO! [Usuario A] necesita ayuda urgente"

---

### Paso 6: Interactuar con la Alerta (Usuario B)

**Opciones disponibles:**

1. **Llamar al 911**
   - Click en botón rojo **"LLAMAR AL 911"**
   - ✅ Se abre el marcador telefónico

2. **Marcar como leída**
   - Click en **"He sido notificado"**
   - ✅ El modal se cierra
   - ✅ El sonido se detiene

3. **Desactivar sonido**
   - Click en toggle de sonido (abajo del modal)
   - ✅ El sonido se detiene
   - ✅ Se guarda la preferencia

---

## 🔍 Verificación de Funcionamiento

### ✅ Checklist de Funcionamiento Correcto

**Usuario A (Activador):**
- [ ] Puede configurar contactos
- [ ] Puede activar el botón de pánico
- [ ] Recibe confirmación de envío
- [ ] Ve el reporte en historial

**Usuario B (Receptor):**
- [ ] Recibe sonido de alarma automáticamente
- [ ] Recibe notificación del navegador
- [ ] Ve el modal visual
- [ ] Ve el toast notification
- [ ] Puede marcar como leída
- [ ] Puede desactivar sonido
- [ ] Puede llamar al 911

### ❌ Problemas Comunes y Soluciones

#### "No recibo notificaciones"

**Posibles causas:**
1. No estás seleccionado en contactos
2. Permisos de notificación bloqueados
3. No estás inscrito en plan de seguridad

**Solución:**
```
1. Verificar en Usuario A → Configuración → que Usuario B esté seleccionado
2. Verificar permisos: Settings del navegador → Notifications → Permitir
3. Verificar inscripción en Plan de Seguridad
```

#### "El sonido no se reproduce"

**Posibles causas:**
1. Navegador requiere interacción del usuario
2. Audio bloqueado por el navegador
3. Volumen del sistema en 0

**Solución:**
```
1. Hacer clic en cualquier parte de la página antes
2. Verificar configuración de audio del navegador
3. Subir volumen del sistema
```

#### "Las notificaciones del navegador no aparecen"

**Posibles causas:**
1. Permisos denegados
2. Modo "No molestar" activado
3. Navegador no soporta notificaciones

**Solución:**
```
1. Settings → Notifications → Permitir para este sitio
2. Desactivar modo "No molestar"
3. Usar Chrome, Firefox o Edge (Safari requiere PWA)
```

---

## 🎯 Escenarios de Prueba Adicionales

### Prueba 1: Notificar a todos

1. Usuario A → Configuración
2. Activar checkbox **"Notificar a todos los miembros"**
3. Guardar configuración
4. Activar pánico
5. ✅ TODOS los usuarios inscritos reciben la notificación

### Prueba 2: Múltiples contactos

1. Usuario A → Configuración
2. Seleccionar Usuario B, Usuario C y Usuario D
3. Guardar configuración
4. Activar pánico
5. ✅ Los 3 usuarios reciben la notificación

### Prueba 3: Modo Extremo

1. Usuario A → Configuración
2. Activar **"Modo Pánico Extremo"**
3. Guardar configuración
4. Usar botón flotante (doble click + mantener presionado)
5. ✅ Debe solicitar permiso de cámara
6. ✅ Debe grabar video automáticamente

### Prueba 4: Botón flotante

1. Usuario A → Configuración
2. Verificar que **"Activar botón flotante"** esté marcado
3. Configurar tiempo de activación (ej. 3 segundos)
4. Guardar
5. Ver botón rojo flotante en esquina inferior izquierda
6. Doble click + mantener presionado
7. ✅ Ver progreso circular
8. ✅ Alerta se activa al completar el tiempo

---

## 📊 Verificación en Firestore

### Ver el documento creado

1. Ir a Firebase Console
2. Firestore Database
3. Colección: `panicReports`
4. Buscar el documento más reciente

**Estructura esperada:**
```json
{
  "userId": "uid_usuario_a",
  "userName": "Usuario A",
  "userEmail": "usuario_a@ejemplo.com",
  "location": "Calle Principal #123",
  "description": "Emergencia reportada",
  "timestamp": "2024-10-11T...",
  "status": "active",
  "emergencyContacts": ["911"],
  "notifiedUsers": ["uid_usuario_b", "uid_usuario_c"],
  "activatedFrom": "floating_button",
  "extremeMode": false,
  "hasVideo": false
}
```

**Campo clave:**
- `notifiedUsers`: Array con los UIDs de los usuarios que deben recibir la notificación

---

## 🔧 Debugging

### Ver logs en consola

**Usuario A (Activador):**
```
✅ Firebase inicializado correctamente
✅ PanicoPage - Acceso concedido
🚨 Activando pánico...
✅ Alerta de emergencia enviada
```

**Usuario B (Receptor):**
```
✅ Firebase inicializado correctamente
👂 Iniciando listener de notificaciones de pánico para usuario: [uid]
📨 Cambios detectados en panicReports: 1 documentos
🚨 Nueva alerta de pánico detectada: {...}
🔊 Reproduciendo sonido de alarma...
📢 Notificación del navegador mostrada
```

### Verificar permisos

Abrir consola del navegador:

```javascript
// Verificar permiso de notificaciones
console.log('Notificaciones:', Notification.permission);
// Esperado: 'granted'

// Verificar si el usuario está autenticado
console.log('Usuario:', firebase.auth().currentUser);

// Verificar si hay listeners activos
console.log('Listeners activos');
```

---

## 🎨 Personalización de Prueba

### Cambiar tiempo de activación del botón flotante

1. Usuario A → Configuración
2. Ajustar slider **"Tiempo para activar"**
3. Rango: 3-10 segundos
4. Guardar
5. Probar con el botón flotante

### Desactivar sonido

1. Cuando aparezca el modal de alerta
2. Parte inferior del modal: Toggle "Sonido de alarma"
3. Click en **"Desactivado"**
4. El sonido se detiene inmediatamente
5. La preferencia se guarda en localStorage

---

## 📱 Prueba en Móvil

### Android

1. Abrir la aplicación en Chrome móvil
2. Permitir notificaciones cuando se solicite
3. Activar pánico desde otro dispositivo
4. ✅ Debe vibrar
5. ✅ Debe sonar
6. ✅ Notificación en barra de estado

### iOS

1. **Limitación**: iOS Safari no soporta notificaciones web completas
2. **Solución**: Agregar a pantalla de inicio (PWA)
3. **Alternativa**: Usar solo sonido y modal visual

---

## ✨ Resultado Esperado

Al completar estas pruebas, deberías tener:

✅ Sistema de notificaciones funcionando en tiempo real  
✅ Sonido de alarma intermitente  
✅ Notificaciones del navegador  
✅ Modal visual con información completa  
✅ Capacidad de responder a emergencias  
✅ Persistencia de configuración  

---

## 🆘 ¿Algo no funciona?

1. **Verificar logs de consola** (F12 → Console)
2. **Verificar Firestore Rules** (Firebase Console)
3. **Verificar permisos del navegador** (Settings → Notifications)
4. **Limpiar caché y recargar** (Ctrl + Shift + R)
5. **Verificar inscripción en Plan de Seguridad**

---

## 📝 Reporte de Prueba

Después de completar las pruebas, verifica:

- ✅ Sonido: Funcionando / No funciona
- ✅ Notificaciones navegador: Funcionando / No funciona
- ✅ Modal visual: Funcionando / No funciona
- ✅ Firestore listener: Funcionando / No funciona
- ✅ Botón flotante: Funcionando / No funciona
- ✅ Modo extremo: Funcionando / No funciona

---

**¡Listo para emergencias! 🚨**

El sistema está completamente implementado y probado.


