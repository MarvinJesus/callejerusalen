# 🐛 Debug: Banner Amarillo No Aparece

## 🔍 Sistema de Debugging Implementado

He agregado **logs extensivos** en todo el sistema para identificar dónde está el problema.

## 🧪 Cómo Probar AHORA

### Paso 1: Ver la Página de Login

1. Ve a: http://localhost:3000/login
2. **Verás un nuevo botón amarillo** que dice "Probar Banner Amarillo"
3. Click en ese botón

### Paso 2: Verificar en la Consola del Navegador

Abre la consola del navegador (F12 → Console) y busca estos logs:

#### ✅ Logs Esperados al Cargar la Página

```
🔍 LoginPage - showAlert disponible: function [Function]
🎨 GlobalAlertBanner render - Alertas: 0 Visibles: 0
🔔 GlobalAlertBanner - Alertas actuales: []
```

#### ✅ Logs Esperados al Hacer Click en "Probar Banner"

```
🧪 Botón de prueba clickeado
🚨 showAlert llamado: {message: "🚫 Acceso Denegado...", type: "warning", duration: 5000}
📌 Agregando alerta: {id: "abc123", message: "...", type: "warning", duration: 5000}
📋 Alertas actualizadas: [{...}]
🎨 GlobalAlertBanner render - Alertas: 1 Visibles: 0
🔔 GlobalAlertBanner - Alertas actuales: [{...}]
🎭 Mostrando alerta: abc123 🚫 Acceso Denegado...
🎨 GlobalAlertBanner render - Alertas: 1 Visibles: 1
⏰ Auto-cerrando alerta: abc123 (después de 5 segundos)
🗑️ hideAlert llamado: abc123
📋 Alertas después de filtrar: []
```

## 🔴 Posibles Problemas

### Problema 1: showAlert es undefined

**Síntoma:**
```
❌ showAlert no está disponible
```

**Solución:**
- Verificar que GlobalAlertProvider está en el layout
- Reiniciar el servidor: `npm run dev`

### Problema 2: Las alertas se agregan pero no se muestran

**Síntoma:**
```
📋 Alertas actualizadas: [{...}]
🎨 GlobalAlertBanner render - Alertas: 1 Visibles: 0
```
(Pero el banner no aparece visualmente)

**Solución:**
- Problema de z-index o CSS
- Verificar que no hay elementos encima

### Problema 3: No aparecen logs en la consola

**Síntoma:**
- No hay logs en absoluto

**Solución:**
- Asegúrate de estar en la pestaña Console
- Reinicia el servidor
- Borra el caché del navegador (Ctrl+Shift+R)

## 📋 Checklist de Verificación

### En el Navegador

- [ ] Abriste http://localhost:3000/login
- [ ] Ves el botón amarillo "Probar Banner Amarillo"
- [ ] Abriste la consola (F12)
- [ ] Estás en la pestaña "Console"
- [ ] Hiciste click en el botón de prueba

### En la Consola

- [ ] Ves logs que empiezan con 🔍
- [ ] Ves "showAlert disponible: function"
- [ ] Al hacer click, ves "🧪 Botón de prueba clickeado"
- [ ] Ves "🚨 showAlert llamado"
- [ ] Ves "📌 Agregando alerta"
- [ ] Ves "📋 Alertas actualizadas"

### Visualmente

- [ ] Aparece un banner amarillo en la parte superior
- [ ] El banner tiene un icono de advertencia (⚠️)
- [ ] El banner tiene un botón X
- [ ] Hay una barra de progreso en la parte inferior
- [ ] El banner desaparece después de 5 segundos

## 🔧 Acciones de Debugging

### Acción 1: Verificar Contexto

```javascript
// En la consola del navegador, ejecuta:
console.log('GlobalAlertProvider cargado:', !!window);
```

### Acción 2: Probar Manualmente showAlert

Si tienes React DevTools:

1. Encuentra el componente `LoginPage`
2. En la consola, accede a las props
3. Intenta llamar a `showAlert` directamente

### Acción 3: Verificar Orden de Providers

Abre `app/layout.tsx` y verifica que el orden sea:

```typescript
<GlobalAlertProvider>
  <AuthProvider>
    <GlobalAlertBanner />
    {/* ... */}
  </AuthProvider>
</GlobalAlertProvider>
```

## 📸 Capturas de Pantalla Esperadas

### 1. Página de Login con Botón de Prueba

```
┌─────────────────────────────────────┐
│         Iniciar Sesión              │
│                                     │
│  Email: [________________]          │
│  Password: [________________]       │
│                                     │
│  [    Iniciar Sesión    ]          │
│                                     │
│  🧪 Prueba del Banner:              │
│  [ Probar Banner Amarillo ]         │
└─────────────────────────────────────┘
```

### 2. Banner Apareciendo

```
┌──────────────────────────────────────────────────┐
│ ⚠️  🚫 Acceso Denegado: Esta cuenta ha sido  ❌  │
│     desactivada. Contacta al administrador.      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░                   │
└──────────────────────────────────────────────────┘

         ↓ (Página de login abajo)
```

## 🚨 Si NADA Funciona

### Solución de Emergencia

1. **Reiniciar el servidor completamente:**
   ```bash
   # Detener el servidor (Ctrl+C)
   npm run dev
   ```

2. **Limpiar caché del navegador:**
   - Chrome/Edge: Ctrl+Shift+Delete → Borrar todo
   - O simplemente: Ctrl+Shift+R (recarga forzada)

3. **Verificar que los archivos están guardados:**
   - `context/GlobalAlertContext.tsx`
   - `components/GlobalAlertBanner.tsx`
   - `app/layout.tsx`
   - `app/login/page.tsx`

4. **Verificar que no hay errores de compilación:**
   - Mira la terminal donde corre `npm run dev`
   - No debe haber errores en rojo

## 📝 Reportar el Problema

Si después de todos estos pasos el banner NO aparece, copia y pega:

### 1. Logs de la Consola

```
(Pega aquí todos los logs que aparecen al hacer click)
```

### 2. Errores en la Terminal

```
(Pega aquí cualquier error de la terminal donde corre npm run dev)
```

### 3. Screenshot

- Toma screenshot de la página de login
- Toma screenshot de la consola del navegador

## ✅ Solución Rápida

**¿El botón de prueba hace que aparezca el banner?**

- **SÍ** → El sistema funciona, el problema es con el código de autenticación
- **NO** → El problema es con el sistema de banners en sí

Si el banner aparece con el botón de prueba pero no con usuarios bloqueados, el problema está en la función `loginUser` en `lib/auth.ts`.

---

**Fecha:** 8 de octubre de 2025  
**Estado:** 🧪 EN DEBUGGING

