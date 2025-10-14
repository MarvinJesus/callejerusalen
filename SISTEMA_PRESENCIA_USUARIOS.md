# 🟢 Sistema de Presencia de Usuarios

## 🎯 Objetivo

Detectar qué usuarios están en línea en tiempo real para el sistema de emergencias.

## 📊 Dos Enfoques Disponibles

### Opción 1: Firebase Realtime Database (⭐ RECOMENDADO)
- ✅ **onDisconnect** nativo (perfecto para presencia)
- ✅ Actualización automática cuando usuario se desconecta
- ✅ Latencia ultra baja
- ✅ Diseñado específicamente para esto

### Opción 2: Firestore (Actual)
- ⚠️ Requiere heartbeat manual
- ⚠️ Menos preciso
- ✅ Ya lo tienes configurado

## 🔥 Implementación con Firebase Realtime Database

### 1. Configurar Firebase Realtime Database

```typescript
// lib/firebase.ts
import { getDatabase } from 'firebase/database';

export const realtimeDb = getDatabase();
```

### 2. Crear Hook de Presencia

Crea `hooks/useUserPresence.ts`:

```typescript
'use client';

import { useEffect } from 'react';
import { ref, onDisconnect, set, serverTimestamp, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const useUserPresence = () => {
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) return;

    // Referencia al estado de presencia del usuario
    const userStatusRef = ref(realtimeDb, `presence/${user.uid}`);

    // Datos de presencia
    const presenceData = {
      state: 'online',
      lastSeen: serverTimestamp(),
      userName: userProfile.displayName || user.displayName || 'Usuario',
      userEmail: user.email,
      role: userProfile.role
    };

    // Configurar qué hacer cuando el usuario se desconecta
    onDisconnect(userStatusRef).set({
      state: 'offline',
      lastSeen: serverTimestamp(),
      userName: presenceData.userName,
      userEmail: presenceData.userEmail,
      role: presenceData.role
    });

    // Marcar como en línea
    set(userStatusRef, presenceData);

    // Actualizar cada 30 segundos (heartbeat)
    const heartbeatInterval = setInterval(() => {
      set(userStatusRef, presenceData);
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      set(userStatusRef, {
        state: 'offline',
        lastSeen: serverTimestamp(),
        userName: presenceData.userName,
        userEmail: presenceData.userEmail,
        role: presenceData.role
      });
    };
  }, [user, userProfile]);
};
```

### 3. Usar el Hook en tu App

```typescript
// app/layout.tsx o cualquier componente raíz
import { useUserPresence } from '@/hooks/useUserPresence';

export default function RootLayout({ children }) {
  // Este hook se encarga automáticamente de la presencia
  useUserPresence();
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 4. Crear Componente de Usuarios En Línea

Crea `components/OnlineUsers.tsx`:

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Circle } from 'lucide-react';

interface UserPresence {
  state: 'online' | 'offline';
  lastSeen: number;
  userName: string;
  userEmail: string;
  role: string;
}

const OnlineUsers: React.FC = () => {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});

  useEffect(() => {
    // Escuchar todos los usuarios en presencia
    const presenceRef = ref(realtimeDb, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      setOnlineUsers(data);
    });

    return () => unsubscribe();
  }, []);

  // Filtrar solo usuarios en línea
  const usersOnline = Object.entries(onlineUsers).filter(
    ([_, user]) => user.state === 'online'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <Circle className="w-4 h-4 text-green-500 fill-green-500 mr-2" />
        Usuarios En Línea ({usersOnline.length})
      </h3>
      
      <div className="space-y-2">
        {usersOnline.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay usuarios en línea</p>
        ) : (
          usersOnline.map(([userId, user]) => (
            <div 
              key={userId} 
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
            >
              <Circle className="w-3 h-3 text-green-500 fill-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{user.userName}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
```

### 5. Mostrar Estado en el Chat de Emergencia

Actualiza `app/residentes/panico/activa/[id]/page.tsx`:

```typescript
import OnlineUsers from '@/components/OnlineUsers';

// En tu JSX, agrega el componente donde quieras mostrarlo
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Columna izquierda - contenido existente */}
  
  {/* Columna derecha */}
  <div className="space-y-6">
    {/* Usuarios en línea */}
    <OnlineUsers />
    
    {/* Chat - contenido existente */}
    {/* ... */}
  </div>
</div>
```

## 💡 Opción 2: Solo con Firestore (Más Simple)

Si prefieres no agregar Realtime Database, puedes usar Firestore con heartbeat:

### Crear Hook de Presencia con Firestore

```typescript
'use client';

import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export const useUserPresenceFirestore = () => {
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) return;

    const userPresenceRef = doc(db, 'presence', user.uid);

    // Marcar como en línea
    const setOnline = async () => {
      await setDoc(userPresenceRef, {
        state: 'online',
        lastSeen: serverTimestamp(),
        userName: userProfile.displayName || user.displayName || 'Usuario',
        userEmail: user.email,
        role: userProfile.role
      });
    };

    // Marcar como offline
    const setOffline = async () => {
      await setDoc(userPresenceRef, {
        state: 'offline',
        lastSeen: serverTimestamp(),
        userName: userProfile.displayName || user.displayName || 'Usuario',
        userEmail: user.email,
        role: userProfile.role
      });
    };

    // Iniciar como online
    setOnline();

    // Heartbeat cada 30 segundos
    const heartbeat = setInterval(setOnline, 30000);

    // Marcar offline cuando cierra la ventana
    window.addEventListener('beforeunload', setOffline);

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [user, userProfile]);
};
```

### Componente para Ver Usuarios en Línea (Firestore)

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Circle } from 'lucide-react';

interface UserPresence {
  state: 'online' | 'offline';
  lastSeen: any;
  userName: string;
  userEmail: string;
  role: string;
}

const OnlineUsersFirestore: React.FC = () => {
  const [onlineUsers, setOnlineUsers] = useState<Array<UserPresence & { id: string }>>([]);

  useEffect(() => {
    // Escuchar usuarios en línea
    const q = query(
      collection(db, 'presence'),
      where('state', '==', 'online')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: Array<UserPresence & { id: string }> = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as UserPresence;
        users.push({
          id: doc.id,
          ...data
        });
      });
      
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <Circle className="w-4 h-4 text-green-500 fill-green-500 mr-2" />
        Usuarios En Línea ({onlineUsers.length})
      </h3>
      
      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay usuarios en línea</p>
        ) : (
          onlineUsers.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
            >
              <Circle className="w-3 h-3 text-green-500 fill-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{user.userName}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsersFirestore;
```

## 🎨 UI Mejorada: Indicador de Estado en Chat

Actualiza el chat para mostrar quién está en línea:

```typescript
// En app/residentes/panico/activa/[id]/page.tsx

const [onlineUsersIds, setOnlineUsersIds] = useState<string[]>([]);

// Escuchar usuarios en línea
useEffect(() => {
  const q = query(
    collection(db, 'presence'),
    where('state', '==', 'online')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const ids: string[] = [];
    snapshot.forEach((doc) => ids.push(doc.id));
    setOnlineUsersIds(ids);
  });

  return () => unsubscribe();
}, []);

// En el JSX del mensaje
<div className="flex items-center mb-1">
  {/* Indicador de estado */}
  {onlineUsersIds.includes(msg.userId) && (
    <Circle className="w-2 h-2 text-green-500 fill-green-500 mr-1" />
  )}
  
  <p className="text-xs font-semibold opacity-75">
    {isOwn ? 'Tú' : msg.userName}
    {onlineUsersIds.includes(msg.userId) && ' (En línea)'}
  </p>
</div>
```

## 📊 Comparación de Enfoques

| Característica | Realtime DB | Firestore |
|----------------|-------------|-----------|
| **Precisión** | ✅ Alta (onDisconnect) | ⚠️ Media (heartbeat) |
| **Latencia** | ✅ <100ms | ⚠️ 1-2 seg |
| **Setup** | ⚠️ Requiere Realtime DB | ✅ Ya tienes Firestore |
| **Costo** | ✅ Gratis (1GB) | ✅ Gratis (dentro de límites) |
| **Confiabilidad** | ✅ 99.95% | ✅ 99.95% |

## 🚀 Instalación Rápida

### Para Realtime Database (Recomendado):

```bash
# 1. Ya tienes Firebase instalado

# 2. Habilitar Realtime Database en Firebase Console
# - Ve a Firebase Console
# - Realtime Database → Create Database
# - Modo: Test mode (o configura reglas)

# 3. Copiar el código del hook useUserPresence.ts

# 4. Usar en tu layout:
import { useUserPresence } from '@/hooks/useUserPresence';

function Layout() {
  useUserPresence(); // ✅ Listo!
  return <>{children}</>;
}
```

### Para Solo Firestore:

```bash
# 1. Copiar el código de useUserPresenceFirestore.ts

# 2. Usar en tu layout:
import { useUserPresenceFirestore } from '@/hooks/useUserPresenceFirestore';

function Layout() {
  useUserPresenceFirestore(); // ✅ Listo!
  return <>{children}</>;
}
```

## 🎯 Casos de Uso en tu Sistema de Emergencias

### 1. Mostrar Quién Puede Responder
```typescript
// En la página de activar pánico
<div className="mb-4">
  <h3>Contactos Disponibles</h3>
  {contactsOnline.length > 0 ? (
    <p className="text-green-600">
      ✅ {contactsOnline.length} contactos en línea
    </p>
  ) : (
    <p className="text-orange-600">
      ⚠️ Ningún contacto en línea (recibirán notificación)
    </p>
  )}
</div>
```

### 2. Priorizar Notificaciones
```typescript
// Enviar primero a usuarios en línea
const onlineContacts = selectedContacts.filter(id => 
  onlineUsersIds.includes(id)
);
const offlineContacts = selectedContacts.filter(id => 
  !onlineUsersIds.includes(id)
);

console.log(`Notificando a ${onlineContacts.length} usuarios en línea`);
console.log(`${offlineContacts.length} recibirán notificación push`);
```

### 3. Indicador Visual en Chat
```typescript
// Mostrar quién está viendo el chat activamente
<div className="text-xs text-gray-500 mt-2">
  {onlineUsersInChat.map(user => (
    <span key={user.id} className="inline-flex items-center mr-2">
      <Circle className="w-2 h-2 text-green-500 fill-green-500 mr-1" />
      {user.userName}
    </span>
  ))}
</div>
```

## 📋 Reglas de Seguridad

### Realtime Database Rules:
```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Firestore Rules:
```javascript
match /presence/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## ✅ Resultado Final

Con presencia de usuarios implementada:

- ✅ Ver quién está en línea en tiempo real
- ✅ Saber quién puede responder a una emergencia
- ✅ Mostrar estado en el chat
- ✅ Priorizar notificaciones
- ✅ Mejor experiencia de usuario

---

**Recomendación**: ⭐ **Realtime Database** para presencia (más preciso)  
**Alternativa**: Firestore con heartbeat (más simple, menos preciso)  
**Tiempo de implementación**: 30 minutos

