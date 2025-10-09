# 🚀 Inicio Rápido - Alerta Global de Registro Pendiente

## ⚡ Cómo Probar en 2 Minutos

### Paso 1: Iniciar la Aplicación

```bash
npm run dev
```

Espera a que la aplicación esté lista en: `http://localhost:3000`

---

### Paso 2: Registrar un Usuario de Prueba

1. **Ir a:** `http://localhost:3000/register`

2. **Llenar el formulario:**
   - Nombre: `Usuario Prueba`
   - Email: `prueba@test.com`
   - Contraseña: `prueba123`
   - Confirmar Contraseña: `prueba123`

3. **Click:** "Enviar Solicitud de Registro"

---

### Paso 3: Verificar la Alerta

✅ **Deberías ver:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🕐  Solicitud de Registro Pendiente                          │
│                                                              │
│ Tu solicitud está siendo revisada por un administrador.      │
│ Podrás acceder a todas las funcionalidades una vez aprobada. │
│                                   [Explorar como Visitante]  │
└─────────────────────────────────────────────────────────────┘
```

📍 **Ubicación:** Parte superior de la página, color amarillo

---

### Paso 4: Navegar por el Sitio

**Visita diferentes páginas:**
- `http://localhost:3000/visitantes`
- `http://localhost:3000/mapa`
- `http://localhost:3000/visitantes/lugares`

✅ **La alerta amarilla debe aparecer en TODAS las páginas**

---

### Paso 5: Aprobar el Registro (Opcional)

1. **Cerrar sesión del usuario de prueba**

2. **Iniciar sesión como Super Admin:**
   - Ir a: `http://localhost:3000/login`
   - Usar credenciales de super admin

3. **Ir a:** `http://localhost:3000/admin/super-admin/users`

4. **Buscar:** `prueba@test.com`

5. **Click:** "Aprobar Registro"

6. **Iniciar sesión como usuario de prueba**

7. **Verificar:** La alerta amarilla ya no aparece

---

## 🎯 Checklist de Verificación

### ✅ Después del Registro:

- [ ] Toast verde: "¡Registro exitoso!"
- [ ] Redirección automática a la página principal
- [ ] Alerta amarilla visible en la parte superior
- [ ] Texto: "Solicitud de Registro Pendiente"
- [ ] Botón: "Explorar como Visitante"

### ✅ Al Navegar:

- [ ] La alerta aparece en `/visitantes`
- [ ] La alerta aparece en `/mapa`
- [ ] La alerta aparece en `/visitantes/lugares`
- [ ] El contenido no está oculto detrás de la alerta
- [ ] La alerta tiene altura fija y se ve bien

### ✅ Después de Aprobar:

- [ ] La alerta desaparece completamente
- [ ] El usuario tiene acceso completo
- [ ] No hay errores en la consola

---

## 🧪 Script de Prueba Automatizado

Si prefieres usar el script automatizado:

```bash
node scripts/test-registration-alert-flow.js
```

El script:
1. ✅ Crea un usuario de prueba automáticamente
2. ✅ Configura el estado como "pendiente"
3. ✅ Muestra instrucciones detalladas
4. ✅ Ofrece aprobar/eliminar el usuario

---

## 🐛 Troubleshooting

### Problema: La alerta no aparece

**Solución:**
1. Verificar en la consola del navegador si hay errores
2. Verificar que el usuario está autenticado:
   ```javascript
   // En la consola del navegador
   console.log(firebase.auth().currentUser);
   ```
3. Verificar el estado en Firestore:
   - Abrir Firebase Console
   - Ir a Firestore Database
   - Colección: `users`
   - Documento: [UID del usuario]
   - Verificar: `registrationStatus: "pending"`

---

### Problema: La alerta oculta el contenido

**Solución:**
El componente debería agregar padding automáticamente. Si no funciona:

1. Verificar en DevTools que `body` tiene `padding-top: 80px`
2. Si no, agregar manualmente en `globals.css`:
   ```css
   body {
     padding-top: 80px;
   }
   ```

---

### Problema: La alerta no desaparece después de aprobar

**Solución:**
1. Recargar la página completamente (F5)
2. Verificar en Firestore que `registrationStatus` cambió a `"approved"`
3. Limpiar caché del navegador
4. Cerrar sesión y volver a iniciar

---

## 📱 Vista en Móvil

Para probar en vista móvil:

1. **Abrir DevTools:** F12
2. **Toggle Device Toolbar:** Ctrl+Shift+M
3. **Seleccionar:** iPhone 12 Pro o similar
4. **Verificar:** La alerta se adapta correctamente

---

## 🎨 Personalización (Opcional)

### Cambiar el Color de la Alerta

En `components/GlobalRegistrationAlert.tsx`, línea ~37:

```tsx
// Cambiar de:
<div className="... bg-yellow-500 border-yellow-600 ...">

// A:
<div className="... bg-orange-500 border-orange-600 ...">
```

### Cambiar el Mensaje

En `components/GlobalRegistrationAlert.tsx`, línea ~54:

```tsx
<p className="text-yellow-100 text-xs sm:text-sm">
  Tu mensaje personalizado aquí...
</p>
```

---

## 📚 Documentación Completa

Para más detalles, consulta:

- **Flujo Completo:** `FLUJO_ALERTA_REGISTRO_PENDIENTE.md`
- **Resumen Técnico:** `RESUMEN_IMPLEMENTACION_ALERTA.md`
- **Código Fuente:** `components/GlobalRegistrationAlert.tsx`

---

## ✨ Funcionalidades Destacadas

### 🟡 Alerta Amarilla (Pendiente)
- Color: Amarillo (`bg-yellow-500`)
- Icono: Reloj (⏰)
- Mensaje: "Solicitud de Registro Pendiente"
- Acción: "Explorar como Visitante"

### 🔴 Alerta Roja (Rechazado)
- Color: Rojo (`bg-red-500`)
- Icono: X Circle (❌)
- Mensaje: "Solicitud de Registro Rechazada"
- Acción: "Intentar de Nuevo"

### ✅ Características Generales
- Posición fija en la parte superior
- Aparece en todas las páginas
- No se puede cerrar manualmente
- Responsive y adaptable
- Padding automático al contenido

---

## 🎉 ¡Listo!

Ya tienes todo configurado. La alerta global debería funcionar perfectamente.

**¿Necesitas ayuda?**
- Revisa la documentación completa
- Ejecuta el script de prueba
- Verifica los logs de la consola

---

**¡Feliz Testing!** 🚀

