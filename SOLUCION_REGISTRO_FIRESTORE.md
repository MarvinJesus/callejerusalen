# Solución: Registro no crea perfil en Firestore

## 🔍 Problema Identificado

El problema era que las **reglas de Firestore** estaban bloqueando la creación de perfiles de usuario durante el registro. Las reglas originales no permitían que un usuario se creara a sí mismo en la colección `users`.

## ✅ Solución Implementada

### 1. **Reglas de Firestore Corregidas**

**Antes:**
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == userId || isAdminOrSuperAdmin());
}
```

**Después:**
```javascript
match /users/{userId} {
  allow create: if request.auth != null && request.auth.uid == userId;
  allow read, update, delete: if request.auth != null && 
    (request.auth.uid == userId || isAdminOrSuperAdmin());
}
```

### 2. **Reglas para Solicitudes de Registro**

**Antes:**
```javascript
match /registrationRequests/{requestId} {
  allow read, write: if isSuperAdmin();
}
```

**Después:**
```javascript
match /registrationRequests/{requestId} {
  allow create: if request.auth != null && request.auth.uid == requestId;
  allow read, update, delete: if isSuperAdmin();
}
```

### 3. **Logging Mejorado**

Se agregó logging detallado en la función `registerUser()` para facilitar el debugging:
- ✅ Logs de cada paso del proceso
- ✅ Manejo de errores específicos
- ✅ Verificación de datos antes de escribir

## 🚀 Pasos para Solucionar

### Paso 1: Desplegar las Reglas Actualizadas

```bash
# Opción 1: Usar el script automatizado
npm run deploy-rules

# Opción 2: Comando manual
firebase deploy --only firestore:rules
```

### Paso 2: Verificar la Configuración

Asegúrate de que tienes las variables de entorno configuradas:

```bash
# Verificar que estas variables estén en tu .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_dominio
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### Paso 3: Probar el Registro

```bash
# Probar con script automatizado
npm run test-simple-registration

# O probar manualmente en http://localhost:3000/register
```

## 🔧 Archivos Modificados

1. **`firestore.rules`** - Reglas corregidas para permitir creación de perfiles
2. **`lib/auth.ts`** - Logging mejorado en función de registro
3. **`scripts/deploy-firestore-rules.js`** - Script para desplegar reglas
4. **`scripts/test-simple-registration.js`** - Script de prueba

## 📋 Verificación del Funcionamiento

Después de desplegar las reglas, cuando un usuario se registre en `/register`:

1. ✅ Se crea cuenta en Firebase Authentication
2. ✅ Se crea perfil en Firestore con estado `pending`
3. ✅ Se crea solicitud de registro
4. ✅ Se registra la acción en logs

### Estructura del Perfil Creado:

```javascript
{
  uid: "user_uid",
  email: "user@example.com",
  displayName: "Nombre Usuario",
  role: "comunidad",
  status: "inactive",
  createdAt: "2025-01-XX...",
  updatedAt: "2025-01-XX...",
  isActive: false,
  permissions: [],
  registrationStatus: "pending",
  statusChangedBy: "system",
  statusChangedAt: "2025-01-XX...",
  statusReason: "Registro pendiente de aprobación"
}
```

## 🐛 Debugging

Si aún tienes problemas:

### 1. Verificar Consola del Navegador
Abre las herramientas de desarrollador y revisa la consola durante el registro. Deberías ver logs como:
```
🚀 Iniciando registro de usuario: {email: "...", displayName: "...", role: "comunidad"}
📝 Creando usuario en Firebase Auth...
✅ Usuario creado en Firebase Auth: [uid]
💾 Creando perfil en Firestore...
✅ Perfil creado en Firestore exitosamente
```

### 2. Verificar Firestore Console
Ve a la consola de Firebase → Firestore y verifica que:
- Se crea el documento en la colección `users`
- Se crea el documento en la colección `registrationRequests`

### 3. Verificar Reglas de Firestore
En la consola de Firebase → Firestore → Rules, verifica que las reglas estén actualizadas.

## 🎯 Resultado Esperado

Después de implementar la solución:

1. **Usuario se registra** → Perfil se crea automáticamente en Firestore
2. **Estado pendiente** → Usuario debe esperar aprobación del administrador
3. **Administrador aprueba** → Usuario obtiene acceso completo
4. **Sistema funciona** → Flujo completo de registro con aprobación

## 📞 Soporte

Si sigues teniendo problemas:

1. Ejecuta `npm run test-simple-registration` y comparte el output
2. Revisa los logs en la consola del navegador
3. Verifica que las reglas de Firestore estén desplegadas
4. Confirma que las variables de entorno estén configuradas correctamente
