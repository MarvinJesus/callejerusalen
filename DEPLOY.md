# Guía de Deploy - Calle Jerusalén Community

Esta guía te ayudará a desplegar la aplicación en Vercel paso a paso.

## 🚀 Deploy en Vercel

### 1. Preparar el Proyecto

1. **Asegúrate de tener todos los archivos necesarios:**
   ```bash
   # Verificar que tienes todos los archivos
   ls -la
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Probar localmente:**
   ```bash
   npm run dev
   ```

### 2. Configurar Firebase

1. **Crear proyecto en Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Anota el Project ID

2. **Configurar Authentication:**
   - Ve a Authentication > Sign-in method
   - Habilita "Email/Password"
   - Configura el dominio autorizado (tu dominio de Vercel)

3. **Configurar Firestore:**
   - Ve a Firestore Database
   - Crea la base de datos en modo de prueba
   - Configura las reglas de seguridad (ver README.md)

4. **Obtener credenciales:**
   - Ve a Project Settings > General
   - En "Your apps", agrega una app web
   - Copia las credenciales de configuración

### 3. Subir a GitHub

1. **Inicializar repositorio:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Crear repositorio en GitHub:**
   - Ve a GitHub y crea un nuevo repositorio
   - Conecta tu repositorio local:
   ```bash
   git remote add origin https://github.com/tu-usuario/callejerusalen-community.git
   git push -u origin main
   ```

### 4. Deploy en Vercel

1. **Conectar con Vercel:**
   - Ve a [Vercel](https://vercel.com/)
   - Inicia sesión con tu cuenta de GitHub
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno:**
   - En la configuración del proyecto, ve a "Environment Variables"
   - Agrega las siguientes variables:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_key (opcional)
   ```

3. **Deploy:**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente
   - Obtendrás una URL como: `https://tu-proyecto.vercel.app`

### 5. Configurar Dominio Personalizado (Opcional)

1. **En Vercel Dashboard:**
   - Ve a tu proyecto > Settings > Domains
   - Agrega tu dominio personalizado
   - Configura los registros DNS según las instrucciones

2. **Actualizar Firebase:**
   - En Firebase Console > Authentication > Settings
   - Agrega tu dominio personalizado a "Authorized domains"

### 6. Configurar CI/CD

El deploy automático ya está configurado. Cada vez que hagas push a la rama `main`:

1. Vercel detectará los cambios
2. Construirá la aplicación automáticamente
3. Desplegará la nueva versión

### 7. Monitoreo y Logs

1. **Ver logs de deploy:**
   - En Vercel Dashboard > tu proyecto > Deployments
   - Haz clic en cualquier deployment para ver logs

2. **Monitorear rendimiento:**
   - Vercel Analytics está incluido
   - Ve a Analytics en tu dashboard

## 🔧 Configuración Adicional

### Variables de Entorno en Producción

Asegúrate de que todas las variables estén configuradas en Vercel:

```bash
# Verificar variables en Vercel CLI
vercel env ls
```

### Configuración de Firebase para Producción

1. **Reglas de Firestore:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /panicReports/{reportId} {
         allow create: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'residente';
         allow read: if request.auth != null;
       }
       match /alerts/{alertId} {
         allow create: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'residente';
         allow read: if request.auth != null;
       }
     }
   }
   ```

2. **Configuración de Authentication:**
   - Habilita Email/Password
   - Configura dominios autorizados
   - Configura plantillas de email si es necesario

## 🚨 Solución de Problemas

### Error de Build

1. **Verificar logs en Vercel:**
   - Ve a Deployments > tu deployment fallido
   - Revisa los logs de build

2. **Problemas comunes:**
   - Variables de entorno faltantes
   - Errores de TypeScript
   - Dependencias no instaladas

### Error de Firebase

1. **Verificar credenciales:**
   - Asegúrate de que las variables de entorno estén correctas
   - Verifica que el proyecto de Firebase esté activo

2. **Verificar reglas de Firestore:**
   - Las reglas deben permitir las operaciones necesarias
   - Revisa los logs de Firebase Console

### Error de Mapas

1. **Verificar Leaflet:**
   - Los mapas requieren que la aplicación se ejecute en el cliente
   - Verifica que no haya errores de SSR

## 📊 Post-Deploy

### 1. Crear Usuarios de Prueba

1. **Registrar usuarios:**
   - Ve a tu aplicación desplegada
   - Registra usuarios con diferentes roles
   - Verifica que la autenticación funcione

2. **Probar funcionalidades:**
   - Login/Logout
   - Cambio de roles
   - Acceso a diferentes módulos

### 2. Configurar Monitoreo

1. **Vercel Analytics:**
   - Habilitado automáticamente
   - Monitorea rendimiento y errores

2. **Firebase Analytics:**
   - Opcional, para métricas de uso
   - Configurar en Firebase Console

### 3. Backup y Seguridad

1. **Backup de Firestore:**
   - Configurar backups automáticos en Firebase
   - Exportar datos regularmente

2. **Seguridad:**
   - Revisar reglas de Firestore regularmente
   - Monitorear logs de autenticación
   - Actualizar dependencias regularmente

## 🎯 Próximos Pasos

1. **Configurar dominio personalizado**
2. **Implementar notificaciones push**
3. **Agregar analytics avanzados**
4. **Configurar monitoreo de errores (Sentry)**
5. **Implementar tests automatizados**

---

¡Tu aplicación ya está desplegada y lista para usar! 🎉






