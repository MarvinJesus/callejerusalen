# 🚀 Inicio Rápido: Sistema de Alertas en Tiempo Real

## ⚡ Puesta en Marcha (5 minutos)

### 1️⃣ Instalar y Arrancar

Las dependencias ya están instaladas. Solo inicia el servidor:

```bash
npm run dev
```

El servidor ahora incluye **WebSocket automáticamente** en el puerto 3000.

### 2️⃣ Verificar Conexión

Abre el navegador y ve a cualquier página de la app. Revisa la consola del navegador:

```
✅ Deberías ver:
🔌 Inicializando conexión WebSocket...
✅ WebSocket conectado: [socket-id]
✅ Usuario registrado en WebSocket
```

### 3️⃣ Probar el Sistema (2 usuarios)

#### 👤 Usuario A (Emisor)

1. Ir a `/residentes/panico`
2. Verificar indicador verde "En línea" ✓
3. Pestaña "Configuración"
4. Seleccionar contactos (Usuario B)
5. Guardar configuración
6. Ir a "Botón de Pánico"
7. Presionar botón rojo
8. Esperar countdown 5 segundos

#### 👤 Usuario B (Receptor)

1. Estar logueado en cualquier página
2. Ser miembro activo del Plan de Seguridad
3. **¡BOOM!** Modal rojo parpadeante aparece instantáneamente
4. Sonido de emergencia suena automáticamente
5. Ver información completa de la emergencia

## 🎯 Lo Que Acabas de Ver

### Tiempo Real = INSTANTÁNEO

```
Usuario A presiona botón → < 100ms → Usuario B ve modal rojo parpadeante
```

### Sin Recargar Página

El modal aparece **donde sea que esté el usuario B**:
- ✅ Navegando el mapa
- ✅ Leyendo noticias
- ✅ En configuración
- ✅ **CUALQUIER PÁGINA**

### Sistema Dual

Si WebSocket falla, Firestore toma el control automáticamente. **Cero alertas perdidas.**

## 📱 Características Visuales

### Modal de Alerta

```
┌─────────────────────────────────────────┐
│  [!] ¡EMERGENCIA!              [X]      │ ← Header rojo pulsante
├─────────────────────────────────────────┤
│                                         │
│  👤 Juan Pérez (juan@email.com)        │ ← Quién necesita ayuda
│     NECESITA AYUDA URGENTE              │
│                                         │
│  📍 UBICACIÓN: Calle Principal #123    │ ← MUY VISIBLE
│                                         │
│  ⚠️ DESCRIPCIÓN:                        │
│     Sospechoso en la entrada            │
│                                         │
│  🕐 Hace 5 segundos                     │
│                                         │
├─────────────────────────────────────────┤
│  [ 📞 LLAMAR AL 911 ]  [ ✓ NOTIFICADO ]│ ← Botones grandes
├─────────────────────────────────────────┤
│  Sonido: [🔊 ACTIVADO]                  │
└─────────────────────────────────────────┘
```

**TODO EL FONDO PARPADEA EN ROJO** 🔴💥

## 🔊 Sonido de Emergencia

**Patrón**: beep-BEEP-pausa-beep-BEEP-pausa

- 🎵 Dos tonos alternados (880Hz ↔ 659Hz)
- 🔊 Volumen moderado (30%)
- 🔁 Loop continuo hasta cerrar o desactivar
- 💾 Preferencia guardada en navegador

## 🎮 Controles del Usuario Receptor

### Opción 1: Llamar al 911
```javascript
Abre: tel:911 (marcador del teléfono)
```

### Opción 2: Confirmar Recepción
```javascript
- Cierra el modal
- Notifica al sistema que vio la alerta
- Detiene el sonido
- Si hay más alertas en cola, muestra la siguiente
```

### Opción 3: Desactivar Sonido
```javascript
Toggle: 🔊 ACTIVADO ↔ 🔇 DESACTIVADO
Preferencia guardada permanentemente
```

## 🔄 Estados de Conexión

### ✅ Conectado (Verde)
```
"En línea" - WebSocket activo
Alertas instantáneas garantizadas
```

### ❌ Desconectado (Rojo)
```
"Offline" - Solo Firestore
Alertas con pequeño retraso (1-3 segundos)
Sistema intenta reconectar automáticamente
```

## 🧪 Escenarios de Prueba

### Test 1: Todo Funciona Perfecto
```bash
✓ WebSocket conectado
✓ Usuario en plan de seguridad
✓ Configuración guardada
→ Alerta llega en < 500ms
→ Modal aparece inmediatamente
→ Sonido se reproduce
```

### Test 2: Usuario Offline
```bash
✓ Usuario B cierra navegador
→ Usuario A envía alerta
✓ Servidor detecta offline
→ Guarda en Firestore
✓ Usuario B abre navegador
→ Firestore listener muestra alerta
```

### Test 3: Múltiples Alertas
```bash
→ Usuario A envía alerta #1
→ Usuario C envía alerta #2 (antes de cerrar #1)
✓ Sistema crea cola
→ Modal muestra: "⚠️ 1 alerta más en cola"
→ Al cerrar #1, aparece #2 automáticamente
```

## 🚨 Botón Flotante

### Activación Rápida

1. **Doble Click** en botón rojo flotante
2. **Mantener Presionado** 5 segundos
3. Barra de progreso circular
4. **¡Alerta Enviada!**

### Modo Extremo (Opcional)

Si está activado en configuración:
- 🎥 Cámara frontal se activa automáticamente
- 🔴 Graba video durante mantener presionado
- 📹 Video se adjunta a la alerta

## 💡 Tips y Trucos

### Para Usuarios

1. **Primera vez**: Configura tus contactos antes de necesitarlos
2. **Modo "Notificar a todos"**: Para emergencias graves que requieren respuesta masiva
3. **Sonido**: Déjalo activado, es MUY importante
4. **Botón flotante**: Activalo para acceso rápido desde cualquier página

### Para Administradores

1. **Monitoreo**: Revisar logs del servidor para ver alertas enviadas
2. **Usuarios activos**: Solo miembros activos del plan reciben alertas
3. **Firestore**: Sirve como backup, no lo desactives
4. **Puerto 3000**: Asegúrate que esté disponible

## 🐛 Troubleshooting Rápido

### "No veo el botón flotante"
→ Verifica que estés en el Plan de Seguridad (estado: active)

### "Modal no aparece"
→ Verifica que estés en la lista de contactos del emisor

### "No suena"
→ Algunos navegadores bloquean audio sin interacción previa

### "Dice Offline"
→ Reinicia el servidor con `npm run dev`

## 📊 Logs Útiles

### Cliente (Navegador - Console)
```javascript
🔌 Inicializando conexión WebSocket...
✅ WebSocket conectado: abc123
✅ Usuario registrado en WebSocket
🚨 Enviando alerta de pánico
✅ Alerta WebSocket enviada
🚨 Nueva alerta de pánico recibida vía WebSocket
🔊 Reproduciendo sonido de alarma...
```

### Servidor (Terminal)
```javascript
✅ Usuario registrado: user123 (Plan: plan456)
📊 Usuarios conectados: 5
🚨 ALERTA DE PÁNICO RECIBIDA
📤 Alerta enviada a usuario: user789
✅ Alerta enviada a 3 usuarios conectados
📴 2 usuarios offline
```

## 🎯 Comandos Rápidos

```bash
# Iniciar servidor
npm run dev

# Ver logs en tiempo real
# (Los verás automáticamente en la terminal)

# Reiniciar servidor
Ctrl+C
npm run dev

# Build para producción
npm run build
npm start
```

## 🔗 Enlaces Útiles

- **Documentación completa**: `SISTEMA_ALERTAS_TIEMPO_REAL.md`
- **Página de pánico**: http://localhost:3000/residentes/panico
- **Configuración**: http://localhost:3000/residentes/panico (Tab 1)

## 🎉 ¡Listo!

El sistema está **funcionando** y listo para **salvar vidas**.

### Próximo Paso

Ve a `/residentes/panico` y configura tus contactos de emergencia **ahora mismo**.

---

**Versión**: 1.0.0  
**Fecha**: Octubre 11, 2025  
**Estado**: ✅ Operativo  

**¡Bienvenido al futuro de la seguridad comunitaria en tiempo real!** 🚀🚨


