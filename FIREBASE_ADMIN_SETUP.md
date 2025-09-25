# Configuración de Firebase Admin SDK

Para que la eliminación completa de usuarios funcione correctamente, necesitas configurar las credenciales de Firebase Admin SDK.

## Pasos para configurar Firebase Admin SDK

### 1. Obtener las credenciales de Firebase Admin

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto `callejerusalen-a78aa`
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. Ve a la pestaña **Cuentas de servicio**
5. Haz clic en **Generar nueva clave privada**
6. Descarga el archivo JSON

### 2. Configurar las variables de entorno

Crea o actualiza tu archivo `.env.local` con las siguientes variables:

```env
# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@callejerusalen-a78aa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Importante:**
- Reemplaza `xxxxx` con el ID real de tu cuenta de servicio
- Copia la clave privada completa del archivo JSON descargado
- Mantén las comillas dobles y los `\n` en la clave privada

### 3. Ejemplo de configuración

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@callejerusalen-a78aa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 4. Reiniciar el servidor

Después de configurar las variables de entorno, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Funcionalidades habilitadas

Con Firebase Admin SDK configurado, tendrás:

- ✅ **Eliminación completa de usuarios**: Se elimina tanto de Firestore como de Firebase Authentication
- ✅ **Operaciones administrativas**: Creación y gestión de usuarios desde el servidor
- ✅ **Logs del sistema**: Registro automático de todas las acciones administrativas

## Seguridad

- Las credenciales de Firebase Admin SDK solo se usan en el servidor
- Nunca expongas estas credenciales en el código del cliente
- Mantén el archivo `.env.local` fuera del control de versiones

## Solución de problemas

Si encuentras errores:

1. **Verifica las credenciales**: Asegúrate de que las variables de entorno estén correctamente configuradas
2. **Revisa los permisos**: La cuenta de servicio debe tener permisos de administrador
3. **Reinicia el servidor**: Después de cambiar las variables de entorno
4. **Revisa los logs**: Los errores se mostrarán en la consola del servidor
