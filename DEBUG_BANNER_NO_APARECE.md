# 🐛 Debug: Banner No Aparece

## 🔍 Sistema de Debugging Activado

He agregado **logs extensivos** para identificar exactamente dónde está el problema.

## 🧪 Instrucciones de Prueba

### Paso 1: Abrir la Consola del Navegador

1. Ve a http://localhost:3000/login
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **"Console"**
4. Limpia la consola (icono 🚫 o Ctrl+L)

### Paso 2: Intentar Iniciar Sesión con Usuario Bloqueado

1. Ingresa el email y contraseña de un usuario bloqueado
2. Haz click en "Iniciar Sesión"
3. **OBSERVA LA CONSOLA**

### Paso 3: Buscar Estos Logs

Deberías ver una secuencia específica de logs. Por favor, copia y pega TODO lo que veas.

## 📊 Logs Esperados (en orden)

### 1. Detección de Usuario Bloqueado
```javascript
🚨🚨🚨 USUARIO BLOQUEADO DETECTADO 🚨🚨🚨
📝 Mensaje de error: [mensaje del error]
🔍 showAlert disponible: function
✅ showAlert ejecutado
```

### 2. Llamada a showAlert
```javascript
🔔🔔🔔 showAlert LLAMADO 🔔🔔🔔
📝 Mensaje: [mensaje]
🎨 Tipo: warning
⏱️ Duración: 5000
💾 Persistir: true
📦 Nueva alerta creada: {id: "...", ...}
📋 Alertas anteriores: 0
📋 Alertas actualizadas: 1 [{...}]
💾 Guardando en sessionStorage
⏰ Programando auto-cierre en 5000 ms
```

### 3. Renderizado del Banner
```javascript
🎨 GlobalAlertBanner RENDER
📊 Total alertas: 1
👁️ Alertas visibles: 0
📋 Alertas: [{...}]
🔄 useEffect - Procesando alertas
➕ Agregando alerta visible: [id]
✨ Renderizando 1 alertas
```

## ❓ Diagnóstico por Logs

### Caso A: NO ves "USUARIO BLOQUEADO DETECTADO"
**Problema:** El error no está siendo clasificado como usuario bloqueado

**Verifica:**
- ¿Qué mensaje de error ves?
- ¿El usuario tiene `status: 'inactive'` o `'deleted'` en Firestore?

### Caso B: Ves "USUARIO BLOQUEADO" pero NO "showAlert LLAMADO"
**Problema:** showAlert no está disponible o no se está llamando

**Solución:**
- El contexto no está disponible
- Verificar que GlobalAlertProvider esté en el layout

### Caso C: Ves "showAlert LLAMADO" pero las alertas siguen en 0
**Problema:** setAlerts no está actualizando el estado

**Solución:**
- Problema con React hooks
- Verificar que no haya errores en la consola

### Caso D: Alertas > 0 pero NO ves "GlobalAlertBanner RENDER"
**Problema:** El componente GlobalAlertBanner no se está renderizando

**Solución:**
- Verificar que GlobalAlertBanner esté en el layout
- Verificar que no haya errores de import

### Caso E: Ves "GlobalAlertBanner RENDER" con alertas pero el banner NO aparece visualmente
**Problema:** CSS/z-index/posicionamiento

**Solución:**
- Inspeccionar el elemento en DevTools
- Verificar z-index
- Verificar position: fixed

## 🔴 Posibles Problemas Comunes

### 1. Usuario NO está realmente bloqueado
```bash
# Verificar en Firebase Console o con el script
node scripts/test-blocked-user-login.js
```

Asegúrate de que el usuario tenga:
- `status: "inactive"` o `"deleted"`
- `isActive: false`

### 2. Credenciales Incorrectas
Si las credenciales son incorrectas, verás:
```javascript
❌ No es usuario bloqueado, mostrando toast
```

Esto es correcto, el banner solo debe aparecer para usuarios bloqueados con credenciales **correctas**.

### 3. Caché del Navegador
Prueba en modo incógnito o limpia el caché:
- Chrome: Ctrl+Shift+Delete
- O simplemente: Ctrl+Shift+R (recarga forzada)

### 4. Servidor no actualizado
Reinicia el servidor:
```bash
# Ctrl+C para detener
npm run dev
```

## 📝 Reporte de Debugging

Por favor, copia y pega lo siguiente:

### 1. Todos los logs de la consola
```
[Pega aquí TODO lo que aparece en la consola]
```

### 2. Estado del usuario en Firestore
```javascript
{
  email: "...",
  status: "...",  // ¿inactive? ¿deleted? ¿active?
  isActive: ...,  // ¿true? ¿false?
}
```

### 3. ¿Ves algún error?
```
[Pega aquí cualquier error en rojo]
```

### 4. Screenshot
- Toma screenshot de la página de login
- Toma screenshot de la consola con los logs

## 🧪 Prueba Alternativa Simple

Si nada funciona, prueba esto en la consola del navegador:

```javascript
// Copiar y pegar esto en la consola cuando estés en /login
window.showTestAlert = () => {
  const event = new CustomEvent('showTestAlert');
  window.dispatchEvent(event);
};

// Luego ejecutar:
showTestAlert();
```

Si esto tampoco funciona, el problema es con el sistema de alertas en general.

## 🎯 Siguiente Paso

**Por favor:**
1. Abre la consola (F12)
2. Limpia la consola
3. Intenta iniciar sesión con usuario bloqueado
4. **Copia y pega TODOS los logs que aparecen**
5. Compártelos conmigo

Con esos logs podré identificar exactamente dónde está el problema.

---

**Esperando logs...** 📊

