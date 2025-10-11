# Plan de Seguridad de la Comunidad Calle Jerusalén

## 📋 Descripción General

El Plan de Seguridad de la Comunidad es un sistema de inscripción voluntaria que permite a los residentes de Calle Jerusalén acceder a funciones avanzadas de seguridad a través de la plataforma tecnológica. Este plan fortalece la comunidad al mantener a todos unidos e informados mediante la tecnología.

## 🎯 Objetivo

Crear una red comunitaria de seguridad donde los residentes comprometidos puedan:
- Mantenerse informados en tiempo real
- Responder rápidamente a emergencias
- Colaborar en la seguridad del vecindario
- Utilizar tecnología para mejorar la calidad de vida

## 🔐 Funciones Restringidas

### Requieren Inscripción al Plan de Seguridad

Las siguientes funcionalidades **solo están disponibles** para residentes inscritos en el Plan de Seguridad:

1. **🎥 Cámaras de Seguridad**
   - Acceso en tiempo real a las cámaras de seguridad
   - Visualización 24/7
   - Monitoreo comunitario

2. **🚨 Botón de Pánico**
   - Sistema de emergencia instantáneo
   - Alertas a autoridades y vecinos
   - Respuesta rápida de la comunidad

3. **📢 Alertas Comunitarias**
   - Recibir alertas de seguridad en tiempo real
   - Enviar alertas a la comunidad
   - Sistema de notificaciones push

### Disponibles Sin Inscripción

Funciones públicas que **NO requieren** inscripción:

1. **🗺️ Mapa de Seguridad**
   - Visualización del mapa interactivo
   - Ubicaciones de puntos de interés
   - Información general de la comunidad

2. **🏛️ Lugares de Recreación**
   - Parques y áreas verdes
   - Centros comunitarios
   - Espacios públicos

3. **🏪 Servicios Locales**
   - Directorio de negocios
   - Información de contacto
   - Horarios de atención

## 📝 Proceso de Inscripción

### 1. Requisitos

Para inscribirte en el Plan de Seguridad debes:
- ✅ Ser residente de la comunidad Calle Jerusalén
- ✅ Tener una cuenta activa en la plataforma
- ✅ Aceptar los términos y condiciones del plan

### 2. Pasos para Inscribirte

1. **Iniciar Sesión**
   - Accede a tu cuenta en la plataforma

2. **Visitar la Página de Inscripción**
   - Navega a `/residentes/seguridad/inscribirse`
   - O haz clic en el banner de inscripción en el panel de residentes

3. **Revisar los Beneficios**
   - Lee la información sobre el plan
   - Conoce los beneficios y responsabilidades

4. **Aceptar los Términos**
   - Lee los términos del Plan de Seguridad
   - Marca la casilla de aceptación

5. **Completar la Inscripción**
   - Haz clic en "Inscribirme en el Plan de Seguridad"
   - Recibirás confirmación inmediata

6. **Acceder a las Funciones**
   - Una vez inscrito, tendrás acceso instantáneo
   - Las funciones estarán desbloqueadas en el panel

### 3. Verificación Automática

El sistema verifica automáticamente:
- Estado de inscripción al acceder a funciones de seguridad
- Redirección a la página de inscripción si no estás inscrito
- Mensajes informativos sobre el requisito

## 🤝 Términos del Plan

Al inscribirte en el Plan de Seguridad, aceptas:

1. **Uso Responsable**
   - Utilizar las herramientas de manera ética y responsable
   - No hacer uso indebido del botón de pánico

2. **Veracidad**
   - Reportar incidentes de forma veraz y oportuna
   - No crear falsas alarmas

3. **Privacidad**
   - Respetar la privacidad de otros miembros
   - Mantener confidencialidad de información sensible

4. **Colaboración**
   - Participar activamente en la seguridad comunitaria
   - Colaborar con las autoridades cuando sea necesario

5. **Notificaciones**
   - Informar cambios en tu situación como residente
   - Mantener datos de contacto actualizados

6. **Consecuencias**
   - El incumplimiento puede resultar en suspensión o revocación del acceso

## 🔧 Implementación Técnica

### Estructura de Datos

```typescript
interface UserProfile {
  // ... otros campos
  securityPlan?: {
    enrolled: boolean;
    enrolledAt?: Date;
    agreedToTerms?: boolean;
  };
}
```

### API Endpoint

**POST** `/api/security-plan/enroll`
```json
{
  "uid": "user-id",
  "agreedToTerms": true
}
```

**GET** `/api/security-plan/enroll?uid=user-id`
```json
{
  "enrolled": true,
  "enrolledAt": "2025-10-10T...",
  "agreedToTerms": true
}
```

### Firestore Rules

```javascript
// Función para verificar inscripción
function isEnrolledInSecurityPlan() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.securityPlan.enrolled == true;
}

// Función para verificar acceso a funciones de seguridad
function hasSecurityAccess() {
  return request.auth != null && 
    (isAdminOrSuperAdmin() || 
     (get(/databases/$(database)/documents/users/$(request.auth.uid))
       .data.role == 'comunidad' && 
      isEnrolledInSecurityPlan()));
}
```

### Verificación en el Cliente

```typescript
const isEnrolledInSecurityPlan = userProfile?.securityPlan?.enrolled || false;

if (!isEnrolledInSecurityPlan && !isAdminOrSuperAdmin) {
  // Redirigir a página de inscripción
  router.push('/residentes/seguridad/inscribirse');
}
```

## 👥 Roles y Permisos

### Residentes (comunidad)
- ✅ Pueden inscribirse en el plan
- ✅ Requieren inscripción para funciones de seguridad
- ❌ No tienen acceso sin inscripción

### Administradores (admin)
- ✅ Acceso automático a funciones de seguridad
- ✅ No requieren inscripción
- ✅ Pueden ver quién está inscrito

### Super Administradores (super_admin)
- ✅ Acceso total a todas las funciones
- ✅ No requieren inscripción
- ✅ Pueden gestionar inscripciones

### Visitantes (visitante)
- ❌ No pueden inscribirse
- ❌ No tienen acceso a funciones de seguridad

## 🛠️ Scripts de Utilidad

### Inscribir un Usuario Específico

```bash
node scripts/enroll-user-security-plan.js residente@demo.com
```

### Inscribir Todos los Residentes

```bash
node scripts/enroll-user-security-plan.js --all
```

### Verificar Estado de Inscripción

Desde el código del cliente:
```typescript
const checkEnrollment = async (uid: string) => {
  const response = await fetch(`/api/security-plan/enroll?uid=${uid}`);
  const data = await response.json();
  return data.enrolled;
};
```

## 📊 Estadísticas

El sistema permite rastrear:
- Número de usuarios inscritos
- Fecha de inscripción de cada usuario
- Tasa de adopción del plan
- Uso de funciones de seguridad

## 🔄 Flujo de Usuario

```
Usuario No Inscrito → Intenta Acceder a Función de Seguridad
                   ↓
            Verificación Fallida
                   ↓
         Mensaje de Redirección
                   ↓
      Página de Inscripción al Plan
                   ↓
    Lee Beneficios y Términos
                   ↓
       Acepta Términos
                   ↓
    Completa Inscripción
                   ↓
    Acceso a Funciones de Seguridad ✅
```

## 🎨 Interfaz de Usuario

### Banner Informativo
- Se muestra a usuarios autenticados no inscritos
- Aparece en el panel de residentes
- Enlace directo a la inscripción
- Diseño llamativo color naranja/amarillo

### Página de Inscripción
- Diseño moderno y atractivo
- Explicación clara de beneficios
- Lista de funcionalidades incluidas
- Términos y condiciones visibles
- Checkbox de aceptación
- Botón de inscripción prominente

### Tarjetas de Funciones
- Indicador visual de "Requiere Plan de Seguridad"
- Enlace directo a inscripción
- Estado bloqueado/desbloqueado claro

## 🔒 Seguridad

### Validaciones
1. Usuario debe estar autenticado
2. Usuario debe ser de tipo "comunidad", "admin" o "super_admin"
3. Usuario debe tener estado "active"
4. Términos deben ser aceptados explícitamente

### Protección de Rutas
- Verificación en el cliente (useEffect)
- Verificación en el servidor (API)
- Reglas de Firestore
- Redirección automática

## 📱 Experiencia Móvil

La interfaz está totalmente optimizada para:
- Smartphones (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## 🚀 Despliegue

### Cambios en Firestore
1. Actualizar reglas de Firestore
2. Desplegar nuevas reglas:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Actualización de Usuarios Existentes
Para inscribir usuarios existentes:
```bash
node scripts/enroll-user-security-plan.js --all
```

## 📞 Soporte

Si tienes preguntas sobre el Plan de Seguridad:
- 📧 Email: seguridad@callejerusalen.com
- 📱 Teléfono: +1 (555) 911-0000
- 💬 Chat en la plataforma

## 🎯 Beneficios Comunitarios

El Plan de Seguridad fortalece la comunidad al:
- ✨ Crear sentido de pertenencia
- 🤝 Fomentar la colaboración entre vecinos
- 🛡️ Mejorar la seguridad general
- 📱 Aprovechar la tecnología
- 💪 Empoderar a los residentes
- 🌟 Construir una comunidad más unida

---

**Última actualización:** Octubre 10, 2025
**Versión:** 1.0.0

