# 🔍 Diagnóstico: Por Qué No Llegan las Alertas

## ✅ Servidor WebSocket: OK

El servidor está corriendo correctamente:
```
🚀 Servidor Next.js + Socket.io iniciado
🔌 WebSocket disponible
```

## 🔍 Verificaciones del Cliente

Ahora debemos verificar que el **navegador** se conecte al WebSocket.

### Paso 1: Abrir Consola del Navegador

#### Usuario A (Emisor):
1. Ir a `http://localhost:3000/residentes/panico`
2. Presionar **F12** (o clic derecho → Inspeccionar)
3. Ir a la pestaña **"Console"**

#### Usuario B (Receptor):
1. Ir a **cualquier página** (ej: página principal)
2. Presionar **F12** 
3. Ir a la pestaña **"Console"**

### Paso 2: Buscar Estos Mensajes

En AMBOS navegadores (A y B) debes ver:

✅ **Mensajes Correctos**:
```javascript
🔌 Inicializando conexión WebSocket...
✅ WebSocket conectado: [algún ID aleatorio]
✅ Usuario registrado en WebSocket
```

❌ **Mensajes de Error** (indicarían problema):
```javascript
❌ Error de conexión WebSocket: ...
⚠️ WebSocket no conectado
```

### Paso 3: Verificar Indicador Visual

En la página `/residentes/panico` debe aparecer:

✅ **Correcto**:
```
Sistema de Emergencia
[ 🟢 En línea ]
✓ Alertas en tiempo real activadas
```

❌ **Incorrecto**:
```
Sistema de Emergencia
[ 🔴 Offline ]
⚠️ Las alertas se enviarán cuando se restablezca la conexión
```

## 🎯 Checklist de Requisitos

Para que las alertas funcionen, verifica:

### Usuario A (Emisor):
- [ ] Está autenticado (login)
- [ ] Es miembro del Plan de Seguridad con estado **"active"**
- [ ] Ha configurado contactos en la pestaña "Configuración"
- [ ] Ha guardado la configuración
- [ ] Ve indicador 🟢 "En línea"

### Usuario B (Receptor):
- [ ] Está autenticado (login)
- [ ] Es miembro del Plan de Seguridad con estado **"active"**
- [ ] Está en la lista de contactos configurados por Usuario A
- [ ] Ve mensajes de WebSocket en consola
- [ ] Está navegando en alguna página de la app

## 🔴 Posibles Problemas

### Problema 1: Usuario No Conectado al WebSocket

**Síntoma**: Consola no muestra "WebSocket conectado"

**Causa**: Puede ser firewall, antivirus, o problema de red

**Solución**:
1. Recargar página (F5)
2. Limpiar caché (Ctrl+Shift+Delete)
3. Probar en ventana incógnita
4. Desactivar temporalmente antivirus/firewall

### Problema 2: Usuario No en Plan de Seguridad

**Síntoma**: No se conecta al WebSocket

**Causa**: Solo usuarios activos en el plan pueden conectarse

**Solución**:
```bash
# Verificar estado del usuario
node scripts/check-user-security-status.js
```

O en Firestore, verificar colección `securityRegistrations`:
- Campo `status` debe ser **"active"**

### Problema 3: Usuario No en Lista de Contactos

**Síntoma**: Usuario A activa, pero Usuario B no recibe

**Causa**: Usuario B no está seleccionado en configuración

**Solución**:
1. Usuario A: Ir a `/residentes/panico`
2. Tab "Configuración"
3. Buscar Usuario B en la lista
4. Click para seleccionar (debe aparecer ✓)
5. Click "Guardar Configuración"
6. Verificar toast: "Configuración guardada exitosamente"

### Problema 4: Error de JavaScript en Cliente

**Síntoma**: Consola muestra errores en rojo

**Solución**:
1. Tomar screenshot del error
2. Recargar página
3. Si persiste, avísame el error exacto

## 🧪 Prueba de Diagnóstico Completa

Ejecuta este script en una terminal:

```bash
node scripts/test-websocket.js
```

Debe mostrar:
```
✅ WebSocket CONECTADO
✅ El servidor WebSocket está funcionando correctamente
```

## 📊 Logs Esperados

### En la CONSOLA del Usuario A (al activar):
```javascript
🚨 Enviando alerta de pánico
✅ Alerta WebSocket enviada: { notifiedCount: 1, ... }
💾 Guardando alerta en Firestore
```

### En la TERMINAL del SERVIDOR:
```
✅ Usuario registrado: userA123
✅ Usuario registrado: userB456
📊 Usuarios conectados: 2
🚨 ALERTA DE PÁNICO RECIBIDA: { userId: 'userA123', ... }
📤 Alerta enviada a usuario: userB456
✅ Alerta enviada a 1 usuarios conectados
```

### En la CONSOLA del Usuario B (al recibir):
```javascript
🚨 Nueva alerta de pánico recibida vía WebSocket
🔊 Reproduciendo sonido de alarma...
```

## 🎬 Proceso Paso a Paso de Prueba

### 1. Preparación (2 navegadores)

**Navegador 1 (Chrome)**: Usuario A
```
- Login como Usuario A
- Ir a /residentes/panico
- F12 → Console
- Verificar: "✅ WebSocket conectado"
```

**Navegador 2 (Firefox o Chrome Incógnito)**: Usuario B
```
- Login como Usuario B  
- Ir a página principal (/)
- F12 → Console
- Verificar: "✅ WebSocket conectado"
```

### 2. Configuración (Usuario A)

```
1. Tab "Configuración"
2. Buscar Usuario B en lista
3. Click en su card (debe verse borde azul + ✓)
4. Click "Guardar Configuración"
5. Esperar toast verde: "Configuración guardada"
```

### 3. Activación (Usuario A)

```
1. Tab "Botón de Pánico"
2. (Opcional) Escribir ubicación
3. (Opcional) Escribir descripción
4. Click "ACTIVAR ALERTA DE PÁNICO"
5. Esperar countdown 5 segundos
6. Ver en consola: "🚨 Enviando alerta de pánico"
```

### 4. Verificación (Terminal del Servidor)

Debe aparecer:
```
🚨 ALERTA DE PÁNICO RECIBIDA
📤 Alerta enviada a usuario: [userId de B]
```

### 5. Recepción (Usuario B)

Debe suceder:
```
1. ⚡ Modal rojo parpadeante aparece INMEDIATAMENTE
2. 🔊 Sonido de alarma comienza
3. 📍 Información visible: nombre, ubicación, descripción
4. En consola: "🚨 Nueva alerta de pánico recibida"
```

## ❌ Si NO Funciona

Envíame screenshots de:

1. **Consola de Usuario A** (después de activar)
2. **Consola de Usuario B** (esperando recibir)
3. **Terminal del Servidor** (cuando se activa)
4. **Página /residentes/panico** (para ver indicador)

Y dime:
- ¿Qué mensajes ves en cada consola?
- ¿El indicador está verde o rojo?
- ¿Aparece algún error?

## 💡 Comandos Útiles

```bash
# Ver si usuarios están conectados al WebSocket
# (deberías ver logs en la terminal cuando cargan la página)

# Limpiar y reiniciar
rm -rf .next
npm run dev

# Verificar WebSocket
node scripts/test-websocket.js

# Ver estado de usuarios
node scripts/check-user-security-status.js
```

## 🎯 Lo Que Debe Pasar

```
Tiempo 0s:  Usuario A presiona "ACTIVAR ALERTA"
         ↓
Tiempo 0.01s: Frontend envía evento por WebSocket
         ↓
Tiempo 0.02s: Servidor recibe y busca destinatarios
         ↓
Tiempo 0.03s: Servidor envía a Usuario B por WebSocket
         ↓
Tiempo 0.05s: Usuario B recibe evento
         ↓
Tiempo 0.06s: Modal rojo aparece + sonido
```

**Tiempo total: < 100 milisegundos**

---

**Siguiente paso**: Abre F12 en ambos navegadores y dime qué mensajes ves en la consola.


