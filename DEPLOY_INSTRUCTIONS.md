# 🚀 Instrucciones de Despliegue en Vercel

## ✅ Configuración Completada

Tu proyecto ya está configurado para desplegarse en Vercel con todas las variables de entorno necesarias. Aquí tienes todo lo que necesitas saber:

## 📁 Archivos Creados/Actualizados

### 1. `vercel.json` - Configuración de Vercel
- ✅ Variables de entorno mapeadas
- ✅ Headers de seguridad configurados
- ✅ Configuración de funciones serverless
- ✅ Redirects y rewrites
- ✅ Runtime de Node.js 18.x

### 2. `VERCEL_DEPLOYMENT.md` - Documentación Completa
- ✅ Guía detallada de configuración
- ✅ Lista de todas las variables necesarias
- ✅ Instrucciones paso a paso
- ✅ Troubleshooting

### 3. Scripts de Despliegue
- ✅ `scripts/deploy-to-vercel.ps1` (Windows PowerShell)
- ✅ `scripts/deploy-to-vercel.sh` (Linux/Mac)
- ✅ `scripts/setup-vercel-env.js` (Node.js)

### 4. `package.json` - Scripts Actualizados
- ✅ `npm run deploy:vercel` - Despliegue directo
- ✅ `npm run deploy:windows` - Script para Windows
- ✅ `npm run deploy:linux` - Script para Linux/Mac

## 🚀 Cómo Desplegar

### Opción 1: Despliegue Automático (Recomendado)
1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración

2. **Configura las variables de entorno:**
   - En el dashboard de Vercel, ve a Settings → Environment Variables
   - Agrega cada variable usando los nombres de Vercel:

| Variable | Nombre en Vercel | Ejemplo |
|----------|------------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `@firebase_api_key` | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `@firebase_auth_domain` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `@firebase_project_id` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `@firebase_storage_bucket` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `@firebase_messaging_sender_id` | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `@firebase_app_id` | `1:123456789012:web:abcdef1234567890` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `@firebase_measurement_id` | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `@google_maps_api_key` | `AIzaSyC...` |
| `FIREBASE_CLIENT_EMAIL` | `@firebase_client_email` | `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `@firebase_private_key` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |

3. **¡Listo!** Vercel desplegará automáticamente cada vez que hagas push.

### Opción 2: Despliegue Manual con Scripts

#### Para Windows:
```powershell
# Ejecutar PowerShell como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecutar el script
npm run deploy:windows
```

#### Para Linux/Mac:
```bash
# Hacer el script ejecutable
chmod +x scripts/deploy-to-vercel.sh

# Ejecutar el script
npm run deploy:linux
```

#### Despliegue directo:
```bash
# Instalar Vercel CLI (si no está instalado)
npm install -g vercel

# Login en Vercel
vercel login

# Desplegar
npm run deploy:vercel
```

## 🔑 Obtener Variables de Firebase

### Variables Públicas (NEXT_PUBLIC_*)
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a Configuración del proyecto (⚙️)
4. En la sección "Tus apps", busca tu app web
5. Copia los valores de configuración

### Variables Privadas (Firebase Admin)
1. En Firebase Console, ve a Configuración del proyecto
2. Ve a la pestaña "Cuentas de servicio"
3. Haz clic en "Generar nueva clave privada"
4. Descarga el archivo JSON
5. Usa los valores `client_email` y `private_key`

## ⚠️ Importante

### Para FIREBASE_PRIVATE_KEY:
- **MANTÉN** los caracteres `\n` en Vercel
- **NO** los reemplaces con saltos de línea reales
- Vercel los convertirá automáticamente

### Variables de Entorno:
- Las variables `NEXT_PUBLIC_*` son visibles en el cliente
- Las variables sin prefijo son privadas del servidor
- Todas las variables son necesarias para el funcionamiento completo

## 🧪 Verificar el Despliegue

Después del despliegue, verifica que funcionen:

1. ✅ **Autenticación:** Login/registro de usuarios
2. ✅ **Panel de Admin:** Acceso con usuario admin
3. ✅ **Creación de usuarios:** Funcionalidad de admin
4. ✅ **Sistema de roles:** Diferentes permisos
5. ✅ **Mapas:** Si configuraste Google Maps API
6. ✅ **Base de datos:** Lectura/escritura en Firestore

## 🆘 Troubleshooting

### Error: "Firebase no está inicializado"
- Verifica que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas
- Revisa la consola del navegador para errores

### Error: "Permission denied"
- Verifica `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`
- Asegúrate de que la cuenta de servicio tenga permisos de Admin

### Error de Build
- Revisa los logs de build en Vercel
- Verifica que no haya errores de TypeScript
- Ejecuta `npm run build` localmente para verificar

## 📞 Soporte

- 📖 **Documentación completa:** `VERCEL_DEPLOYMENT.md`
- 🔧 **Scripts de ayuda:** Carpeta `scripts/`
- 🐛 **Logs de Vercel:** Dashboard → Functions → Logs

---

**¡Tu proyecto está listo para producción! 🎉**

Una vez configuradas las variables de entorno, tu aplicación estará completamente funcional en Vercel.

