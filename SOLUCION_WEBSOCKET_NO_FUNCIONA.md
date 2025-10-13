# 🚨 SOLUCIÓN: WebSocket No Funciona - Alertas No en Tiempo Real

## ❌ Problema Detectado

El servidor que está corriendo actualmente es **Next.js normal** sin WebSockets.

Por eso:
- ❌ Las alertas NO llegan en tiempo real
- ❌ El indicador puede decir "Offline" (rojo)
- ❌ Solo funciona el backup de Firestore (2-3 segundos de retraso)

## ✅ Solución (2 pasos)

### Paso 1: DETENER el servidor actual

En la terminal donde está corriendo el servidor:

```
Presiona: Ctrl + C
```

Espera a que se detenga completamente.

### Paso 2: REINICIAR con WebSocket

```bash
npm run dev
```

### ✅ Verificar que funciona

Al arrancar, deberías ver estos mensajes:

```
🚀 Servidor Next.js + Socket.io iniciado
📍 URL: http://localhost:3000
🔌 WebSocket disponible en: ws://localhost:3000/socket.io/
⚡ Modo: desarrollo
```

**Si NO ves estos mensajes**, el servidor NO tiene WebSocket.

## 🔍 Diagnosticar el Problema

Después de reiniciar, ejecuta:

```bash
node scripts/test-websocket.js
```

Debería decir:

```
✅ WebSocket CONECTADO: [socket-id]
✅ El servidor WebSocket está funcionando correctamente
```

## 🧪 Probar las Alertas

### Usuario A (Emisor):
1. Ir a http://localhost:3000/residentes/panico
2. **VERIFICAR**: Debe decir "En línea" con indicador VERDE ✓
3. Si dice "Offline" (rojo), el WebSocket NO está funcionando
4. Configurar contactos y activar pánico

### Usuario B (Receptor):
1. Estar en cualquier página
2. Cuando Usuario A active pánico:
   - **DEBE aparecer modal rojo parpadeante INMEDIATAMENTE** (< 1 segundo)
   - **DEBE sonar alarma automáticamente**

## ❓ Si Sigue Sin Funcionar

### Problema: No arranca el servidor

```bash
# Error: Cannot find module 'socket.io'
npm install socket.io socket.io-client

# Reintentar
npm run dev
```

### Problema: Puerto 3000 ocupado

```bash
# Windows - Liberar puerto 3000
netstat -ano | findstr :3000
# Anotar el PID (última columna)
taskkill /PID [número] /F

# Reiniciar
npm run dev
```

### Problema: Logs no aparecen

Verifica que `server.js` existe en la raíz del proyecto:

```bash
ls server.js
# Debería existir
```

Si no existe, avísame y lo recreo.

## 🔧 Troubleshooting Avanzado

### 1. Verificar que server.js está correcto

```bash
# Ver primeras líneas
head -20 server.js
```

Debe empezar con:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
```

### 2. Verificar package.json

```bash
# Ver scripts
grep -A 5 "scripts" package.json
```

Debe tener:

```json
"dev": "node server.js",
```

### 3. Forzar reinstalación

```bash
rm -rf node_modules
npm install
npm run dev
```

## 📊 Diferencia Visual

### ❌ ANTES (Sin WebSocket):
```
/residentes/panico
┌─────────────────────────────┐
│ Sistema de Emergencia       │
│ [ 🔴 Offline ]              │ ← Rojo = Mal
└─────────────────────────────┘
```

### ✅ DESPUÉS (Con WebSocket):
```
/residentes/panico
┌─────────────────────────────┐
│ Sistema de Emergencia       │
│ [ 🟢 En línea ]             │ ← Verde = Bien
│ ✓ Alertas en tiempo real    │
└─────────────────────────────┘
```

## 🎯 Checklist de Verificación

Antes de probar alertas, confirma:

- [ ] Servidor detenido y reiniciado con `npm run dev`
- [ ] Logs muestran "Socket.io iniciado"
- [ ] Página muestra indicador VERDE "En línea"
- [ ] Test de websocket pasa: `node scripts/test-websocket.js`
- [ ] Dos usuarios en navegadores diferentes
- [ ] Usuario B es miembro activo del plan de seguridad
- [ ] Usuario A configuró a Usuario B como contacto

## 💡 Tip Pro

Para ver logs del servidor en tiempo real y depurar:

```bash
# Al activar pánico, deberías ver:
🚨 ALERTA DE PÁNICO RECIBIDA
📤 Alerta enviada a usuario: [userId]
✅ Alerta enviada a 1 usuarios conectados
```

Si no ves estos logs, el WebSocket NO está funcionando.

## 🆘 Si NADA Funciona

Ejecuta este comando y envíame la salida:

```bash
npm run dev 2>&1 | head -50
```

Y también:

```bash
curl -v http://localhost:3000/api/socket/health
```

---

**Resumen: El problema es que el servidor NO tiene WebSocket. Reiniciar con `npm run dev` lo soluciona.**


