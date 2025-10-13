# 🔧 Configuración de Firebase Admin en Vercel

## Problema
Los errores 500 en `/api/admin/users` y `/api/places` se deben a que Firebase Admin SDK no puede encontrar el archivo de credenciales JSON en producción.

## Solución
Configurar las variables de entorno de Firebase en Vercel.

## 📋 Pasos para configurar

### 1. Obtener las credenciales de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `callejerusalen-a78aa`
3. Ve a **Project Settings** (⚙️) → **Service Accounts**
4. Haz clic en **Generate new private key**
5. Descarga el archivo JSON

### 2. Extraer los valores del archivo JSON
Abre el archivo descargado y copia estos valores:

```json
{
  "type": "service_account",
  "project_id": "callejerusalen-a78aa",
  "private_key_id": "VALOR_AQUI",
  "private_key": "-----BEGIN PRIVATE KEY-----\nVALOR_AQUI\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@callejerusalen-a78aa.iam.gserviceaccount.com",
  "client_id": "VALOR_AQUI",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40callejerusalen-a78aa.iam.gserviceaccount.com"
}
```

### 3. Configurar variables de entorno en Vercel
1. Ve a [vercel.com](https://vercel.com) y selecciona tu proyecto
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `FIREBASE_PROJECT_ID` | `callejerusalen-a78aa` | ID del proyecto de Firebase |
| `FIREBASE_PRIVATE_KEY_ID` | Valor de `private_key_id` | ID de la clave privada |
| `FIREBASE_PRIVATE_KEY` | Valor de `private_key` | Clave privada completa (incluyendo saltos de línea) |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@callejerusalen-a78aa.iam.gserviceaccount.com` | Email del servicio |
| `FIREBASE_CLIENT_ID` | Valor de `client_id` | ID del cliente |

### 4. Importante para FIREBASE_PRIVATE_KEY
⚠️ **CRÍTICO**: El valor de `FIREBASE_PRIVATE_KEY` debe incluir los saltos de línea exactos:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

### 5. Redesplegar
Después de agregar las variables de entorno:
1. Ve a **Deployments** en Vercel
2. Haz clic en **Redeploy** en el último deployment
3. O haz un nuevo commit y push

## 🔍 Verificación
Después del redespliegue, verifica que:
- ✅ No hay errores 500 en `/api/admin/users`
- ✅ No hay errores 500 en `/api/places`
- ✅ Las APIs devuelven datos (o arrays vacíos si no hay datos)

## 🚨 Troubleshooting

### Si sigues viendo errores 500:
1. Verifica que todas las variables estén configuradas
2. Verifica que `FIREBASE_PRIVATE_KEY` tenga los saltos de línea correctos
3. Revisa los logs de Vercel para más detalles
4. Asegúrate de que el proyecto de Firebase esté activo

### Si las APIs devuelven arrays vacíos:
- Esto es normal si no hay datos en Firestore
- Las APIs están funcionando correctamente
- Puedes agregar datos desde el panel de administración

## 📝 Notas
- Las variables de entorno solo se aplican a nuevos deployments
- Los cambios requieren un redeploy para tomar efecto
- El archivo JSON local solo se usa en desarrollo
- En producción siempre se usan las variables de entorno
