/**
 * Servidor WebSocket personalizado para Next.js
 * Maneja conexiones en tiempo real para el sistema de alertas de pánico
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Preparar aplicación Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Inicializar Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  // Almacenar usuarios conectados y sus planes de seguridad
  const connectedUsers = new Map(); // userId -> { socketId, securityPlanId }

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
        notifiedUsers, // Array de IDs de usuarios que deben ser notificados
        extremeMode,
        hasVideo,
        activatedFrom
      } = alertData;

      if (!notifiedUsers || !Array.isArray(notifiedUsers) || notifiedUsers.length === 0) {
        console.error('❌ No hay usuarios para notificar');
        socket.emit('panic:error', { message: 'No hay usuarios configurados para recibir la alerta' });
        return;
      }

      // Crear objeto de alerta completa
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

      // Enviar alerta a todos los usuarios notificados que estén conectados
      let notifiedCount = 0;
      let offlineUsers = [];

      notifiedUsers.forEach(targetUserId => {
        const targetUser = connectedUsers.get(targetUserId);
        
        if (targetUser && targetUser.socketId) {
          // Usuario está conectado, enviar alerta
          io.to(targetUser.socketId).emit('panic:new_alert', panicAlert);
          notifiedCount++;
          console.log(`📤 Alerta enviada a usuario: ${targetUserId}`);
        } else {
          // Usuario no está conectado
          offlineUsers.push(targetUserId);
          console.log(`⚠️ Usuario offline: ${targetUserId}`);
        }
      });

      console.log(`✅ Alerta enviada a ${notifiedCount} usuarios conectados`);
      if (offlineUsers.length > 0) {
        console.log(`📴 ${offlineUsers.length} usuarios offline (recibirán notificación vía Firestore)`);
      }

      // Confirmar al emisor
      socket.emit('panic:alert_sent', {
        success: true,
        alertId: panicAlert.id,
        notifiedCount,
        offlineCount: offlineUsers.length,
        totalTargets: notifiedUsers.length
      });

      // Broadcast a todos los administradores (opcional)
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
      
      // Notificar al emisor original que alguien recibió la alerta
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
      
      // Notificar a todos que la alerta fue resuelta
      io.emit('panic:resolved', {
        alertId,
        resolvedBy,
        timestamp: new Date().toISOString()
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      // Buscar y remover usuario de la lista de conectados
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

    // Error handling
    socket.on('error', (error) => {
      console.error('❌ Error en socket:', error);
    });

    // === EVENTOS DE CHAT DE EMERGENCIA ===
    
    // Unirse a una sala de chat de una alerta específica
    socket.on('chat:join', (data) => {
      const { alertId, userId, userName } = data;
      
      if (!alertId || !userId) {
        console.error('❌ Datos incompletos para unirse al chat:', data);
        return;
      }

      // Crear sala específica para esta alerta
      const roomName = `alert_chat_${alertId}`;
      
      // Unirse a la sala
      socket.join(roomName);
      
      console.log(`💬 Usuario ${userName || userId} se unió al chat de alerta ${alertId}`);
      console.log(`🏠 Sala: ${roomName}`);
      
      // Notificar a otros en la sala que alguien se unió
      socket.to(roomName).emit('chat:user_joined', {
        alertId,
        userId,
        userName: userName || 'Usuario',
        timestamp: new Date().toISOString()
      });
      
      // Confirmar al usuario que se unió
      socket.emit('chat:joined', {
        success: true,
        alertId,
        roomName
      });
    });

    // Enviar mensaje al chat de emergencia
    socket.on('chat:send_message', async (data) => {
      const { alertId, userId, userName, message, firestoreId } = data;
      
      if (!alertId || !userId || !message?.trim()) {
        console.error('❌ Datos incompletos para enviar mensaje:', data);
        socket.emit('chat:error', { message: 'Datos incompletos' });
        return;
      }

      const roomName = `alert_chat_${alertId}`;
      
      try {
        // Crear objeto del mensaje
        const chatMessage = {
          id: firestoreId || `msg_${Date.now()}_${userId}`, // Usar ID de Firestore si está disponible
          alertId,
          userId,
          userName: userName || 'Usuario',
          message: message.trim(),
          timestamp: new Date().toISOString(),
          firestoreId: firestoreId // Incluir ID de Firestore para evitar duplicados
        };

        console.log(`💬 Mensaje en chat ${alertId}: ${userName || userId} -> ${message.trim()}`);
        
        // Enviar mensaje a todos en la sala (incluyendo al emisor)
        io.to(roomName).emit('chat:new_message', chatMessage);
        
        // Confirmar al emisor que el mensaje fue enviado
        socket.emit('chat:message_sent', {
          success: true,
          messageId: chatMessage.id
        });
      } catch (error) {
        console.error('❌ Error al procesar mensaje:', error);
        socket.emit('chat:error', { message: 'Error al enviar mensaje' });
      }
    });

    // Salir del chat de emergencia
    socket.on('chat:leave', (data) => {
      const { alertId, userId, userName } = data;
      
      if (!alertId || !userId) {
        return;
      }

      const roomName = `alert_chat_${alertId}`;
      
      // Salir de la sala
      socket.leave(roomName);
      
      console.log(`💬 Usuario ${userName || userId} salió del chat de alerta ${alertId}`);
      
      // Notificar a otros en la sala que alguien salió
      socket.to(roomName).emit('chat:user_left', {
        alertId,
        userId,
        userName: userName || 'Usuario',
        timestamp: new Date().toISOString()
      });
    });

    // Heartbeat para mantener conexión viva
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  // Endpoint de salud para WebSocket
  server.on('request', (req, res) => {
    if (req.url === '/api/socket/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        connectedUsers: connectedUsers.size,
        timestamp: new Date().toISOString()
      }));
      return;
    }
  });

  // Iniciar servidor
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Servidor Next.js + Socket.io iniciado`);
    console.log(`📍 URL: http://${hostname}:${port}`);
    console.log(`🔌 WebSocket disponible en: ws://${hostname}:${port}/socket.io/`);
    console.log(`⚡ Modo: ${dev ? 'desarrollo' : 'producción'}`);
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
});


