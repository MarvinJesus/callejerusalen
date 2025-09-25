# Configuración de Variables de Entorno

## 📋 Pasos para Configurar .env.local

### 1. Crear el archivo .env.local

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyEXAMPLE123456789abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mi-proyecto-ejemplo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mi-proyecto-ejemplo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mi-proyecto-ejemplo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Maps API Key (opcional para mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyEXAMPLE_GOOGLE_MAPS_KEY_HERE
```

### 2. Comandos para crear el archivo

#### En Windows (PowerShell):
```powershell
# Crear el archivo .env.local
New-Item -Path ".env.local" -ItemType File

# Agregar contenido al archivo
@"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyEXAMPLE123456789abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mi-proyecto-ejemplo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mi-proyecto-ejemplo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mi-proyecto-ejemplo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Maps API Key (opcional para mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyEXAMPLE_GOOGLE_MAPS_KEY_HERE
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
```

#### En Windows (CMD):
```cmd
# Crear el archivo .env.local
echo # Firebase Configuration > .env.local
echo NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyEXAMPLE123456789abcdefghijklmnopqrstuvwxyz >> .env.local
echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mi-proyecto-ejemplo.firebaseapp.com >> .env.local
echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=mi-proyecto-ejemplo >> .env.local
echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mi-proyecto-ejemplo.appspot.com >> .env.local
echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012 >> .env.local
echo NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef >> .env.local
echo NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX >> .env.local
echo. >> .env.local
echo # Google Maps API Key (opcional para mapas) >> .env.local
echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyEXAMPLE_GOOGLE_MAPS_KEY_HERE >> .env.local
```

#### En Linux/Mac:
```bash
# Crear el archivo .env.local
cat > .env.local << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyEXAMPLE123456789abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mi-proyecto-ejemplo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mi-proyecto-ejemplo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mi-proyecto-ejemplo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Maps API Key (opcional para mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyEXAMPLE_GOOGLE_MAPS_KEY_HERE
EOF
```

### 3. Verificar que el archivo se creó correctamente

```bash
# Ver el contenido del archivo
cat .env.local
```

### 4. Reiniciar el servidor de desarrollo

Después de crear el archivo `.env.local`, reinicia el servidor:

```bash
# Detener el servidor (Ctrl+C) y volver a ejecutar
npm run dev
```

## 🔒 Seguridad

- ✅ El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- ✅ Las variables `NEXT_PUBLIC_*` son públicas y se pueden usar en el cliente
- ✅ Para variables sensibles del servidor, usa variables sin el prefijo `NEXT_PUBLIC_`

## 📝 Notas Importantes

1. **Nunca subas el archivo `.env.local` al repositorio**
2. **Para producción, configura las variables de entorno en Vercel**
3. **Las variables `NEXT_PUBLIC_*` son visibles en el navegador**
4. **Reinicia el servidor después de cambiar variables de entorno**

## 🚀 Para Deploy en Vercel

Cuando despliegues en Vercel, agrega estas variables en:
- Vercel Dashboard > Tu Proyecto > Settings > Environment Variables

Agrega cada variable con su valor correspondiente.


