# 🚂 Deploy WebSocket Server en Railway

## 🎯 Objetivo

Desplegar el servidor WebSocket (`server.js`) en Railway para que funcione en producción, mientras Next.js permanece en Vercel.

## 🏗️ Arquitectura Final

```
Usuarios → Vercel (Next.js)
            ↓
            Railway (WebSocket Server)
            ↓
            Firebase (Persistencia)
```

## 📋 Pasos de Implementación

### 1. Preparar Archivos para Railway

Crea una carpeta separada para el servidor WebSocket:

```bash
mkdir websocket-server
cd websocket-server
```

### 2. Copiar Archivos Necesarios

Copia estos archivos a la carpeta `websocket-server/`:

**`package.json`** (simplificado solo para el servidor):
```json
{
  "name": "callejerusalen-websocket-server",
  "version": "1.0.0",
  "description": "WebSocket server for panic alerts",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "socket.io": "^4.7.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**`server.js`** (modificado para producción):
```javascript
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'https://www.callejerusalen.com', 'https://callejerusalen.com'];

console.log('🚀 Iniciando WebSocket Server...');
console.log('📍 Puerto:', PORT);
console.log('🌐 Orígenes permitidos:', ALLOWED_ORIGINS);

// Crear servidor HTTP
const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'WebSocket Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// Inicializar Socket.io
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Almacenar usuarios conectados
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Registrar usuario
  socket.on('register', (data) => {
    const { userId, securityPlanId } = data;
    
    if (!userId) {
      console.error('❌ Intento de registro sin userId');
      return;
    }

    connectedUsers.set(userId, {
      socketId: socket.id,
      securityPlanId: securityPlanId || null
    });

    console.log(`✅ Usuario registrado: ${userId} (Plan: ${securityPlanId || 'ninguno'})`);
    console.log(`📊 Usuarios conectados: ${connectedUsers.size}`);
    
    socket.emit('registered', { success: true, userId });
  });

  // Recibir alerta de pánico
  socket.on('panic:alert', async (alertData) => {
    console.log('🚨 ALERTA DE PÁNICO RECIBIDA:', alertData);

    const {
      userId,
      userName,
      userEmail,
      location,
      description,
      notifiedUsers,
      extremeMode,
      hasVideo,
      activatedFrom
    } = alertData;

    if (!notifiedUsers || !Array.isArray(notifiedUsers) || notifiedUsers.length === 0) {
      console.error('❌ No hay usuarios para notificar');
      socket.emit('panic:error', { message: 'No hay usuarios configurados para recibir la alerta' });
      return;
    }

    const panicAlert = {
      id: `panic_${Date.now()}_${userId}`,
      userId,
      userName,
      userEmail,
      location,
      description,
      timestamp: new Date().toISOString(),
      status: 'active',
      notifiedUsers,
      extremeMode: extremeMode || false,
      hasVideo: hasVideo || false,
      activatedFrom: activatedFrom || 'unknown'
    };

    let notifiedCount = 0;
    let offlineUsers = [];

    notifiedUsers.forEach(targetUserId => {
      const targetUser = connectedUsers.get(targetUserId);
      
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit('panic:new_alert', panicAlert);
        notifiedCount++;
        console.log(`📤 Alerta enviada a usuario: ${targetUserId}`);
      } else {
        offlineUsers.push(targetUserId);
        console.log(`⚠️ Usuario offline: ${targetUserId}`);
      }
    });

    console.log(`✅ Alerta enviada a ${notifiedCount} usuarios conectados`);
    if (offlineUsers.length > 0) {
      console.log(`📴 ${offlineUsers.length} usuarios offline`);
    }

    socket.emit('panic:alert_sent', {
      success: true,
      alertId: panicAlert.id,
      notifiedCount,
      offlineCount: offlineUsers.length,
      totalTargets: notifiedUsers.length
    });

    socket.broadcast.emit('panic:alert_broadcast', {
      ...panicAlert,
      notifiedCount,
      offlineCount: offlineUsers.length
    });
  });

  // Confirmar recepción de alerta
  socket.on('panic:acknowledge', (data) => {
    const { alertId, userId } = data;
    console.log(`✅ Usuario ${userId} confirmó recepción de alerta ${alertId}`);
    
    socket.broadcast.emit('panic:acknowledgment', {
      alertId,
      acknowledgedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  // Resolver alerta
  socket.on('panic:resolve', (data) => {
    const { alertId, resolvedBy } = data;
    console.log(`✅ Alerta ${alertId} resuelta por ${resolvedBy}`);
    
    io.emit('panic:resolved', {
      alertId,
      resolvedBy,
      timestamp: new Date().toISOString()
    });
  });

  // === EVENTOS DE CHAT DE EMERGENCIA ===
  
  socket.on('chat:join', (data) => {
    const { alertId, userId, userName } = data;
    
    if (!alertId || !userId) {
      console.error('❌ Datos incompletos para unirse al chat:', data);
      return;
    }

    const roomName = `alert_chat_${alertId}`;
    socket.join(roomName);
    
    console.log(`💬 Usuario ${userName || userId} se unió al chat de alerta ${alertId}`);
    
    socket.to(roomName).emit('chat:user_joined', {
      alertId,
      userId,
      userName: userName || 'Usuario',
      timestamp: new Date().toISOString()
    });
    
    socket.emit('chat:joined', {
      success: true,
      alertId,
      roomName
    });
  });

  socket.on('chat:send_message', async (data) => {
    const { alertId, userId, userName, message, firestoreId } = data;
    
    if (!alertId || !userId || !message?.trim()) {
      console.error('❌ Datos incompletos para enviar mensaje:', data);
      socket.emit('chat:error', { message: 'Datos incompletos' });
      return;
    }

    const roomName = `alert_chat_${alertId}`;
    
    try {
      const chatMessage = {
        id: firestoreId || `msg_${Date.now()}_${userId}`,
        alertId,
        userId,
        userName: userName || 'Usuario',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        firestoreId: firestoreId
      };

      console.log(`💬 Mensaje en chat ${alertId}: ${userName || userId} -> ${message.trim()}`);
      
      io.to(roomName).emit('chat:new_message', chatMessage);
      
      socket.emit('chat:message_sent', {
        success: true,
        messageId: chatMessage.id
      });
    } catch (error) {
      console.error('❌ Error al procesar mensaje:', error);
      socket.emit('chat:error', { message: 'Error al enviar mensaje' });
    }
  });

  socket.on('chat:leave', (data) => {
    const { alertId, userId, userName } = data;
    
    if (!alertId || !userId) {
      return;
    }

    const roomName = `alert_chat_${alertId}`;
    socket.leave(roomName);
    
    console.log(`💬 Usuario ${userName || userId} salió del chat de alerta ${alertId}`);
    
    socket.to(roomName).emit('chat:user_left', {
      alertId,
      userId,
      userName: userName || 'Usuario',
      timestamp: new Date().toISOString()
    });
  });

  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Desconexión
  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        break;
      }
    }

    console.log(`🔌 Cliente desconectado: ${socket.id}${disconnectedUserId ? ` (Usuario: ${disconnectedUserId})` : ''}`);
    console.log(`📊 Usuarios conectados: ${connectedUsers.size}`);
  });

  socket.on('error', (error) => {
    console.error('❌ Error en socket:', error);
  });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WebSocket Server iniciado en puerto ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/socket.io/`);
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  io.close();
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  io.close();
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});
```

**`.gitignore`**:
```
node_modules/
.env
.env.local
*.log
```

**`README.md`**:
```markdown
# WebSocket Server - Calle Jerusalén

Servidor WebSocket para alertas de pánico en tiempo real.

## Deploy en Railway

1. Conecta este repositorio a Railway
2. Configura variables de entorno:
   - `PORT`: (Railway lo configura automáticamente)
   - `ALLOWED_ORIGINS`: https://www.callejerusalen.com,https://callejerusalen.com

## Health Check

`GET /health` - Retorna estado del servidor
```

### 3. Crear Repositorio en GitHub

```bash
# Dentro de websocket-server/
git init
git add .
git commit -m "Initial commit - WebSocket server"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/tu-usuario/callejerusalen-websocket.git
git branch -M main
git push -u origin main
```

### 4. Deploy en Railway

1. **Crear cuenta**: Ve a [railway.app](https://railway.app) y regístrate

2. **Nuevo Proyecto**:
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway a acceder a GitHub
   - Selecciona el repo `callejerusalen-websocket`

3. **Configurar Variables de Entorno**:
   - En el dashboard de Railway, ve a "Variables"
   - Agrega:
     ```
     ALLOWED_ORIGINS=https://www.callejerusalen.com,https://callejerusalen.com
     ```

4. **Generar Dominio**:
   - En "Settings" → "Networking"
   - Click en "Generate Domain"
   - Railway te dará una URL como: `callejerusalen-websocket.up.railway.app`

5. **Verificar Deploy**:
   - Railway desplegará automáticamente
   - Espera 1-2 minutos
   - Visita: `https://tu-app.up.railway.app/health`
   - Deberías ver:
     ```json
     {
       "status": "ok",
       "service": "WebSocket Server",
       "uptime": 123.45,
       "timestamp": "2025-10-14T..."
     }
     ```

### 5. Actualizar Cliente (Next.js en Vercel)

Actualiza `context/WebSocketContext.tsx`:

```typescript
// Línea 93 - Cambiar la URL del socket
const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  // ... resto de configuración
});
```

Crea archivo `.env.local` en tu proyecto Next.js:
```env
NEXT_PUBLIC_WEBSOCKET_URL=https://tu-app.up.railway.app
```

En Vercel, configura la variable de entorno:
- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Agrega:
  - `NEXT_PUBLIC_WEBSOCKET_URL` = `https://tu-app.up.railway.app`

### 6. Deploy y Prueba

```bash
# En tu proyecto Next.js
git add .
git commit -m "Connect to Railway WebSocket server"
git push origin main
```

Vercel desplegará automáticamente. Ahora tienes:
- ✅ Next.js en Vercel
- ✅ WebSocket Server en Railway
- ✅ Firebase para persistencia

## 📊 Costos Estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Railway | Starter | $5 gratis/mes, luego $0.000231/min |
| Vercel | Hobby | Gratis |
| Firebase | Spark | Gratis (hasta límites) |

**Costo mensual estimado**: $0 - $5 (dependiendo del uso)

## ✅ Verificación

Después del deploy:

1. **Health Check**:
   ```bash
   curl https://tu-app.up.railway.app/health
   ```

2. **WebSocket desde navegador**:
   ```javascript
   // Consola del navegador
   const socket = io('https://tu-app.up.railway.app');
   socket.on('connect', () => console.log('Connected!'));
   ```

3. **Prueba completa**:
   - Crea alerta de pánico
   - Verifica que las notificaciones lleguen en tiempo real

## 🔧 Troubleshooting

### Error: CORS

Asegúrate de que `ALLOWED_ORIGINS` incluya tu dominio de Vercel.

### Error: Connection timeout

Verifica que Railway esté escuchando en `0.0.0.0` y no en `localhost`.

### Error: Health check falla

Revisa los logs en Railway Dashboard.

## 📈 Monitoreo

Railway te da:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU/RAM
- ✅ Restart automático si falla
- ✅ SSL/HTTPS automático

## 🎉 Resultado

Ahora tienes una arquitectura profesional:

```
Cliente (Navegador)
    ↓
Next.js (Vercel) - UI/Frontend
    ↓
WebSocket (Railway) - Tiempo Real
    ↓
Firebase (Cloud) - Persistencia
```

✅ **Todo funciona en producción con WebSocket real!**

