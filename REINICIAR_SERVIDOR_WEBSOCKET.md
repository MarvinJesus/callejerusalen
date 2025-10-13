# ⚡ GUÍA RÁPIDA: Reiniciar Servidor con WebSocket

## 🎯 Problema

Las alertas de pánico **NO funcionan en tiempo real** porque el servidor actual **NO tiene WebSocket**.

## ✅ Solución Rápida (30 segundos)

### 1️⃣ DETENER Servidor Actual

En la terminal del servidor:

```
Ctrl + C
```

### 2️⃣ REINICIAR con WebSocket

```bash
npm run dev
```

### 3️⃣ VERIFICAR que funcionó

Al arrancar debes ver:

```
✓ Ready in 3.2s
🚀 Servidor Next.js + Socket.io iniciado  ← ESTO ES LO IMPORTANTE
📍 URL: http://localhost:3000
🔌 WebSocket disponible en: ws://localhost:3000/socket.io/
⚡ Modo: desarrollo
```

**🚨 Si NO ves "Socket.io iniciado", algo está mal.**

### 4️⃣ PROBAR

1. Abrir página de pánico: http://localhost:3000/residentes/panico
2. **Debe decir**: 🟢 "En línea" (verde)
3. Si dice 🔴 "Offline" (rojo), WebSocket NO funciona

## 🧪 Test Rápido de WebSocket

```bash
node scripts/test-websocket.js
```

Debe decir:

```
✅ WebSocket CONECTADO
✅ El servidor WebSocket está funcionando correctamente
```

## 🎬 Prueba Completa

### Setup:
- **2 navegadores** (o 2 ventanas incógnitas)
- **2 usuarios** diferentes
- Ambos en plan de seguridad activo

### Usuario A (Emisor):
1. http://localhost:3000/residentes/panico
2. ✅ Verificar: "🟢 En línea"
3. Tab "Configuración" → Seleccionar Usuario B
4. Guardar
5. Tab "Botón de Pánico" → Activar

### Usuario B (Receptor):
1. Estar en **cualquier página**
2. Cuando A active:
   - ⚡ **Modal rojo parpadeante** aparece INSTANTÁNEAMENTE
   - 🔊 **Sonido de alarma** automático
   - 📍 **Información de emergencia** visible

### Tiempo esperado:
```
Usuario A presiona → 0.05 segundos → Usuario B ve modal
```

## ❌ Problemas Comunes

### "Cannot find module 'socket.io'"

```bash
npm install socket.io socket.io-client
npm run dev
```

### "Puerto 3000 ocupado"

```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000

# Matar proceso (Windows)
taskkill /PID [número] /F

# Reiniciar
npm run dev
```

### "Sigue diciendo Offline"

1. Verificar que server.js existe:
   ```bash
   ls server.js
   ```

2. Verificar contenido:
   ```bash
   head -5 server.js
   ```
   
   Debe empezar con:
   ```javascript
   const { createServer } = require('http');
   ```

3. Si falta, avísame y lo recreo.

## 📋 Checklist Final

Antes de probar:

- [ ] Servidor reiniciado con `npm run dev`
- [ ] Logs dicen "Socket.io iniciado"
- [ ] Página dice "🟢 En línea"
- [ ] Test pasa: `node scripts/test-websocket.js`
- [ ] 2 usuarios preparados
- [ ] Usuario B en lista de contactos de A

## 🎯 Resultado Esperado

### EN LA CONSOLA DEL NAVEGADOR (Usuario B):

```javascript
🔌 Inicializando conexión WebSocket...
✅ WebSocket conectado: abc123xyz
✅ Usuario registrado en WebSocket
🚨 Nueva alerta de pánico recibida vía WebSocket  ← ¡ESTO!
🔊 Reproduciendo sonido de alarma...
```

### EN LA TERMINAL DEL SERVIDOR:

```
✅ Usuario registrado: user123
📊 Usuarios conectados: 2
🚨 ALERTA DE PÁNICO RECIBIDA         ← ¡ESTO!
📤 Alerta enviada a usuario: user456  ← ¡ESTO!
✅ Alerta enviada a 1 usuarios conectados
```

### EN LA PANTALLA (Usuario B):

```
╔═══════════════════════════════════╗
║  🚨 ¡EMERGENCIA!            [X]  ║  ← Modal rojo parpadeante
╠═══════════════════════════════════╣
║  👤 Juan Pérez necesita ayuda   ║
║  📍 Calle Principal #123         ║  ← MUY VISIBLE
║  ⚠️ Intruso en el jardín        ║
╠═══════════════════════════════════╣
║  [ 📞 LLAMAR 911 ] [ ✓ OK ]     ║
╚═══════════════════════════════════╝
```

Y suena: 🔊 beep-BEEP-pausa-beep-BEEP

## ✅ Si Todo Funciona

Verás:
1. ✅ Indicador verde "En línea"
2. ⚡ Modal aparece en < 1 segundo
3. 🔊 Alarma suena automáticamente
4. 📍 Info completa y centrada
5. 🎯 Solo usuarios seleccionados la reciben

## 🆘 Si Sigue Sin Funcionar

Envíame:

```bash
# 1. Logs del servidor
npm run dev 2>&1 | head -30

# 2. Verificar WebSocket
node scripts/test-websocket.js

# 3. Estado del puerto
netstat -ano | findstr :3000
```

---

**TL;DR:**
1. `Ctrl+C` (detener servidor)
2. `npm run dev` (reiniciar con WebSocket)
3. Verificar "🟢 En línea"
4. Probar alerta

**Tiempo total: 30 segundos**


