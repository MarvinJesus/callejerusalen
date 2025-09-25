# 🚀 Guía de Despliegue en Vercel - Calle Jerusalén Community

## 📋 Variables de Entorno Requeridas

### 🔥 Firebase - Variables Públicas (NEXT_PUBLIC_*)
Estas variables son visibles en el cliente y se usan para inicializar Firebase.

```bash
# API Key de Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here

# Dominio de autenticación de Firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com

# ID del proyecto de Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Bucket de almacenamiento de Firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# ID del remitente de mensajería
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012

# ID de la aplicación de Firebase
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# ID de medición de Firebase Analytics (opcional)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 🔐 Firebase Admin - Variables Privadas
Estas variables son privadas y solo se usan en el servidor para operaciones administrativas.

```bash
# Email de la cuenta de servicio de Firebase Admin
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com

# Clave privada de la cuenta de servicio de Firebase Admin
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 🗺️ Google Maps (Opcional)
```bash
# API Key para Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🛠️ Configuración en Vercel

### 1. Conectar el Repositorio
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Selecciona el repositorio `callejerusalen.com`
5. Vercel detectará automáticamente que es un proyecto Next.js

### 2. Configurar Variables de Entorno
En el dashboard de Vercel:

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega cada variable usando los nombres de las variables de entorno de Vercel:

| Variable de Entorno | Nombre en Vercel |
|---------------------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `@firebase_api_key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `@firebase_auth_domain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `@firebase_project_id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `@firebase_storage_bucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `@firebase_messaging_sender_id` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `@firebase_app_id` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `@firebase_measurement_id` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `@google_maps_api_key` |
| `FIREBASE_CLIENT_EMAIL` | `@firebase_client_email` |
| `FIREBASE_PRIVATE_KEY` | `@firebase_private_key` |

### 3. Configuración Especial para FIREBASE_PRIVATE_KEY
⚠️ **IMPORTANTE**: Para `FIREBASE_PRIVATE_KEY`:
- Mantén los caracteres `\n` en Vercel
- No los reemplaces con saltos de línea reales
- Vercel los convertirá automáticamente

### 4. Configurar Dominios (Opcional)
1. Ve a Settings → Domains
2. Agrega tu dominio personalizado si lo tienes
3. Configura los registros DNS según las instrucciones de Vercel

## 🔧 Configuración del Proyecto

### Estructura del vercel.json
El archivo `vercel.json` ya está configurado con:
- ✅ Variables de entorno mapeadas
- ✅ Headers de seguridad
- ✅ Configuración de funciones serverless
- ✅ Redirects y rewrites
- ✅ Runtime de Node.js 18.x

### Scripts de Build
El proyecto usa los scripts estándar de Next.js:
```json
{
  "build": "next build",
  "start": "next start",
  "dev": "next dev"
}
```

## 🚀 Proceso de Despliegue

### Despliegue Automático
1. Vercel detectará automáticamente los cambios en la rama `main`
2. Cada push activará un nuevo despliegue
3. Los despliegues de preview se crean para pull requests

### Despliegue Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

## 🔍 Verificación Post-Despliegue

### 1. Verificar Variables de Entorno
```bash
# En Vercel Functions, verifica que las variables estén disponibles
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
```

### 2. Probar Funcionalidades
- ✅ Autenticación de usuarios
- ✅ Panel de administración
- ✅ Creación de usuarios (solo admin)
- ✅ Sistema de roles
- ✅ Mapas (si configurado)

### 3. Verificar Logs
```bash
# Ver logs en tiempo real
vercel logs

# Ver logs de funciones específicas
vercel logs --function=api/admin/create-user
```

## 🛡️ Consideraciones de Seguridad

### Variables Públicas vs Privadas
- **NEXT_PUBLIC_***: Visibles en el cliente, seguras para Firebase config
- **Sin prefijo**: Privadas del servidor, solo para Firebase Admin

### Headers de Seguridad
El `vercel.json` incluye headers de seguridad:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Firebase Security Rules
Asegúrate de que `firestore.rules` esté configurado correctamente:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas de seguridad aquí
  }
}
```

## 🔧 Troubleshooting

### Error: "Firebase no está inicializado"
- Verifica que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas
- Revisa la consola del navegador para errores de Firebase

### Error: "Permission denied" en Firestore
- Verifica `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`
- Asegúrate de que la cuenta de servicio tenga permisos de Admin

### Error: "Module not found"
- Verifica que `package.json` tenga todas las dependencias
- Ejecuta `npm install` localmente para verificar

### Error de Build
- Revisa los logs de build en Vercel
- Verifica que no haya errores de TypeScript
- Asegúrate de que todas las importaciones sean correctas

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Vercel
2. Verifica las variables de entorno
3. Consulta la documentación de Firebase
4. Revisa los archivos de configuración del proyecto

---

**¡Listo para desplegar! 🚀**

Una vez configuradas las variables de entorno en Vercel, tu aplicación estará lista para producción.

