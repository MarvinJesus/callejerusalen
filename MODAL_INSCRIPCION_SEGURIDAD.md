# 📋 Modal de Inscripción al Plan de Seguridad - Guía Completa

## ✨ Cambios Implementados

Se ha mejorado completamente el flujo de inscripción al Plan de Seguridad con:
- ✅ Modal interactivo en lugar de página separada
- ✅ Recopilación de información detallada del residente
- ✅ Validaciones completas
- ✅ Diseño profesional y moderno

## 🎯 Flujo Completo

### 1. Usuario Ve el Banner
```
Panel de Residentes (no inscrito)
    ↓
Hero Section Verde con mensaje:
"Para acceder a funciones de seguridad, únete al Plan..."
    ↓
[Botón: Inscribirme en el Plan de Seguridad]
```

### 2. Usuario Hace Clic en "Inscribirme"
```
Clic en botón
    ↓
Modal se abre (overlay oscuro + modal centrado)
    ↓
Muestra formulario completo de inscripción
```

### 3. Formulario del Modal

#### Sección 1: Tu Información (Solo Lectura)
- ✅ **Nombre Completo** - Mostrado desde el perfil
- ✅ **Correo Electrónico** - Mostrado desde el perfil
- 🔒 Campos bloqueados (no editables)
- 🎨 Diseño: Fondo azul claro con bordes

#### Sección 2: Información de Contacto
- 📱 **Número de Teléfono** (Requerido)
  - Placeholder: "+1 (555) 123-4567"
  - Validación: Campo obligatorio
  
- 🏠 **Dirección** (Requerido)
  - Placeholder: "Calle Jerusalén #123"
  - Validación: Campo obligatorio

#### Sección 3: Disponibilidad (Requerido)
Opciones tipo radio con descripción:

1. **⏰ Tiempo Completo**
   - "Disponible la mayor parte del tiempo"

2. **🕐 Medio Tiempo**
   - "Disponible en ciertos momentos"

3. **🚨 Solo Emergencias**
   - "Disponible solo en situaciones críticas"

4. **📅 Fines de Semana**
   - "Disponible principalmente sábados y domingos"

#### Sección 4: Habilidades y Características (Requerido)
Selección múltiple con botones visuales:

- 🩹 **Primeros Auxilios**
- ⚕️ **Médico/Enfermero**
- 🚒 **Bombero**
- 🚓 **Seguridad/Policía**
- ⚡ **Electricista**
- 🔧 **Plomero**
- ✨ **Otro** (abre campo de texto para especificar)

**Validación:** Debe seleccionar al menos 1 habilidad

#### Sección 5: Términos y Condiciones
- 📜 Caja scrollable con términos
- ☑️ Checkbox obligatorio de aceptación
- 🔒 Botón deshabilitado hasta aceptar

### 4. Usuario Completa y Envía
```
Llenar todos los campos
    ↓
Aceptar términos
    ↓
Clic "Inscribirme en el Plan"
    ↓
Loading state (spinner + "Inscribiendo...")
    ↓
API POST /api/security-plan/enroll
    ↓
Guardado en Firestore
    ↓
Toast de éxito
    ↓
Modal se cierra
    ↓
Página se recarga automáticamente
    ↓
Hero actualizado (sin botón de inscripción)
    ↓
Funciones desbloqueadas ✅
```

## 📦 Estructura de Datos Guardados

### En Firestore: `users/{uid}`

```typescript
{
  // ... campos existentes del usuario
  securityPlan: {
    enrolled: true,
    enrolledAt: Timestamp,
    agreedToTerms: true,
    phoneNumber: "+1 (555) 123-4567",
    address: "Calle Jerusalén #123",
    availability: "full_time", // o 'part_time', 'emergencies_only', 'weekends'
    skills: ["first_aid", "doctor"], // array de habilidades
    otherSkills: "Carpintero" // si seleccionó "Otro"
  },
  updatedAt: Timestamp
}
```

## 🎨 Características del Modal

### Diseño
- **Header Verde:** Gradiente green-600 a emerald-600
- **Overlay Oscuro:** bg-black/60 con backdrop-blur
- **Tamaño:** max-w-4xl (responsive)
- **Altura:** max-h-90vh con scroll interno
- **Animaciones:** Transiciones suaves en todos los elementos

### Interactividad
- ✅ Clic en overlay cierra el modal
- ✅ Botón X en la esquina superior derecha
- ✅ ESC podría cerrar (no implementado aún)
- ✅ Loading state visual
- ✅ Validaciones en tiempo real
- ✅ Mensajes de error claros

### Validaciones

#### Frontend
1. ✅ Todos los campos requeridos
2. ✅ Al menos 1 habilidad seleccionada
3. ✅ Términos aceptados
4. ✅ Botón deshabilitado si falta algo

#### Backend (API)
1. ✅ UID válido
2. ✅ Términos aceptados
3. ✅ phoneNumber presente
4. ✅ address presente
5. ✅ availability presente
6. ✅ skills array no vacío
7. ✅ Usuario existe
8. ✅ Rol correcto (comunidad/admin/super_admin)
9. ✅ Estado activo

## 🚀 Cómo Probar

### Opción 1: Testing Manual

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
http://localhost:3000

# 3. Iniciar sesión
Email: residente@demo.com
Contraseña: demo123

# 4. Ir a panel
http://localhost:3000/residentes

# 5. Verificar
- Ver botón "Inscribirme en el Plan de Seguridad" en hero verde
- Clic en el botón
- Modal se abre
- Campos de nombre y email están pre-llenados y bloqueados
- Llenar: teléfono, dirección
- Seleccionar disponibilidad
- Seleccionar habilidades
- Aceptar términos
- Clic "Inscribirme en el Plan"
- Ver mensaje de éxito
- Modal se cierra
- Página recarga
- Botón desaparece
- Funciones desbloqueadas
```

### Opción 2: Verificación en Firestore

Después de inscribirse:
1. Ir a Firebase Console
2. Firestore Database
3. Colección `users`
4. Buscar documento del usuario
5. Verificar que existe campo `securityPlan` con todos los datos

### Ejemplo de Datos Guardados

```json
{
  "uid": "abc123...",
  "email": "residente@demo.com",
  "displayName": "Juan Pérez",
  "role": "comunidad",
  "status": "active",
  "securityPlan": {
    "enrolled": true,
    "enrolledAt": "2025-10-10T15:30:00Z",
    "agreedToTerms": true,
    "phoneNumber": "+1 (555) 987-6543",
    "address": "Calle Jerusalén #456",
    "availability": "emergencies_only",
    "skills": ["first_aid", "electrician"],
    "otherSkills": ""
  },
  "updatedAt": "2025-10-10T15:30:00Z"
}
```

## 📊 Campos del Formulario

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| Nombre | Text (readonly) | - | Pre-llenado |
| Email | Email (readonly) | - | Pre-llenado |
| Teléfono | Tel | ✅ | No vacío |
| Dirección | Text | ✅ | No vacío |
| Disponibilidad | Radio | ✅ | Una opción |
| Habilidades | Checkbox multiple | ✅ | Mínimo 1 |
| Otro (habilidad) | Text | ❌ | Solo si "Otro" seleccionado |
| Términos | Checkbox | ✅ | Debe estar marcado |

## 🎯 Beneficios de Esta Implementación

### Para la Comunidad
1. **Mejor Organización**
   - Conocer disponibilidad de cada residente
   - Saber qué habilidades tiene cada persona
   - Contacto directo en emergencias

2. **Respuesta Rápida**
   - Si hay emergencia médica → contactar a médicos/enfermeros inscritos
   - Si hay problema eléctrico → contactar a electricistas
   - Si hay emergencia general → contactar a disponibles "tiempo completo"

3. **Red de Apoyo**
   - Crear equipos de respuesta según habilidades
   - Turnos de vigilancia según disponibilidad
   - Coordinación efectiva

### Para el Usuario
1. **Proceso Rápido**
   - Todo en un solo modal
   - No cambiar de página
   - Campos pre-llenados

2. **Validación Clara**
   - Mensajes específicos
   - No puede enviar si falta algo
   - Botón visual deshabilitado

3. **Transparencia**
   - Ve exactamente qué se comparte
   - Términos claros
   - Control sobre qué habilidades mostrar

## 🔧 Archivos Modificados/Creados

### Nuevos
1. **`components/SecurityPlanModal.tsx`**
   - Componente modal completo
   - ~500 líneas
   - Formulario interactivo

### Modificados
1. **`lib/auth.ts`**
   - Ampliado `securityPlan` con nuevos campos
   - phoneNumber, address, availability, skills, otherSkills

2. **`app/api/security-plan/enroll/route.ts`**
   - Nuevas validaciones
   - Guardado de campos adicionales

3. **`app/residentes/page.tsx`**
   - Importar modal
   - useState para controlar apertura
   - Cambiar Link por button
   - Agregar componente modal

## 🎨 Diseño del Modal

### Layout
```
┌────────────────────────────────────────────┐
│  Header Verde (sticky)                     │
│  🛡️ Plan de Seguridad  [X]                 │
├────────────────────────────────────────────┤
│  Scroll Area                               │
│                                            │
│  📋 Tu Información (bloqueado)             │
│  ┌──────────────────────────────────────┐ │
│  │ Nombre: Juan Pérez                   │ │
│  │ Email: juan@email.com                │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  📱 Información de Contacto                │
│  [ Teléfono ]  [ Dirección ]              │
│                                            │
│  ⏰ Disponibilidad                          │
│  ○ Tiempo Completo                        │
│  ○ Medio Tiempo                           │
│  ○ Solo Emergencias                       │
│  ○ Fines de Semana                        │
│                                            │
│  💼 Habilidades                             │
│  [🩹] [⚕️] [🚒] [🚓]                       │
│  [⚡] [🔧] [✨]                             │
│                                            │
│  📜 Términos                                │
│  [ Scroll box con términos ]              │
│  ☑️ Acepto los términos                    │
│                                            │
├────────────────────────────────────────────┤
│  Footer Gris (sticky)                      │
│              [Cancelar] [Inscribirme] ✅   │
└────────────────────────────────────────────┘
```

## ⚡ Estados del Botón

### Deshabilitado
```tsx
className="bg-gray-400 cursor-not-allowed"
disabled={true}
```
- Color gris
- Cursor not-allowed
- No hace nada al hacer clic

### Habilitado
```tsx
className="bg-gradient-to-r from-green-600 to-emerald-600"
disabled={false}
```
- Gradiente verde brillante
- Hover: sombra más grande
- Cursor pointer

### Loading
```tsx
<div className="spinner"></div>
<span>Inscribiendo...</span>
```
- Spinner animado
- Texto cambia
- Botón deshabilitado

## 🐛 Manejo de Errores

### Errores Comunes

1. **Campos vacíos**
   ```
   Toast: "Por favor completa todos los campos requeridos"
   ```

2. **Sin habilidades**
   ```
   Toast: "Selecciona al menos una habilidad o característica"
   ```

3. **Sin aceptar términos**
   ```
   Toast: "Debes aceptar los términos del Plan de Seguridad"
   ```

4. **Error de API**
   ```
   Toast: "Error al inscribirse en el plan"
   Console.error: Detalles del error
   ```

5. **Usuario no activo**
   ```
   API: "Tu cuenta debe estar activa para inscribirte..."
   ```

## 📱 Responsive Design

### Desktop (1024px+)
- Modal: max-w-4xl
- Grid de habilidades: 4 columnas
- Grid de contacto: 2 columnas
- Grid de disponibilidad: 2 columnas

### Tablet (768px - 1023px)
- Modal: max-w-3xl
- Grid de habilidades: 3 columnas
- Grid de contacto: 2 columnas
- Grid de disponibilidad: 2 columnas

### Mobile (< 768px)
- Modal: max-w-full, padding reducido
- Grid de habilidades: 2 columnas
- Grid de contacto: 1 columna
- Grid de disponibilidad: 1 columna
- Botones apilados verticalmente

## ✅ Checklist de Pruebas

- [ ] Modal se abre al hacer clic en botón
- [ ] Overlay cierra el modal
- [ ] Botón X cierra el modal
- [ ] Nombre y email están pre-llenados
- [ ] Nombre y email no son editables
- [ ] Teléfono es editable
- [ ] Dirección es editable
- [ ] Disponibilidad selecciona solo una opción
- [ ] Habilidades permite múltiples selecciones
- [ ] Campo "Otro" aparece si se selecciona "Otro"
- [ ] Términos se pueden scrollear
- [ ] Checkbox de términos funciona
- [ ] Botón deshabilitado sin términos
- [ ] Validación muestra toast si falta algo
- [ ] API guarda todos los campos
- [ ] Modal se cierra después de éxito
- [ ] Página se recarga
- [ ] Botón de inscripción desaparece
- [ ] Funciones se desbloquean

## 🎉 Resultado Final

Una experiencia de inscripción completa y profesional que:
- ✅ Recopila información valiosa para la comunidad
- ✅ Mantiene al usuario en la misma página
- ✅ Valida todo antes de enviar
- ✅ Diseño moderno y atractivo
- ✅ Responsive en todos los dispositivos
- ✅ Manejo de errores robusto
- ✅ Feedback visual claro

---

**¡Listo para usar!** 🚀

Para probar: `npm run dev` → Login → Panel de Residentes → Clic "Inscribirme"

