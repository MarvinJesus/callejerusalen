# Componente UserSearch - Búsqueda de Usuarios por ID

## 🎯 Descripción

Componente exclusivo para Super Administradores que permite buscar cualquier usuario del sistema por su ID (UID) y visualizar toda su información detallada.

## 🔐 Seguridad

### Restricción de Acceso
- ✅ **Solo Super Admin** puede acceder
- ❌ **Admins regulares** ven mensaje de acceso denegado
- 🛡️ **Verificación automática** del rol del usuario

### Verificación de Acceso
```typescript
// Verificar que solo super admin puede acceder
if (!userProfile || userProfile.role !== 'super_admin') {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center space-x-3">
        <XCircle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-lg font-semibold text-red-900">Acceso Denegado</h3>
          <p className="text-red-700">Solo los Super Administradores pueden acceder a esta funcionalidad.</p>
        </div>
      </div>
    </div>
  );
}
```

## 🔍 Funcionalidades

### 1. **Búsqueda por ID**
- 📝 Campo de entrada para UID del usuario
- 🔍 Búsqueda en tiempo real
- ⌨️ Búsqueda con Enter
- 🧹 Botón para limpiar búsqueda

### 2. **Información del Usuario**
- 👤 **Información Básica**: Nombre, email, fecha de registro, último acceso
- 🛡️ **Estado y Configuración**: Rol, estado, registro, última actualización
- 🔑 **Permisos Asignados**: Lista completa de permisos del usuario
- ⚠️ **Información Técnica**: UID, aprobado por, fecha de aprobación (oculta por defecto)

### 3. **Interfaz Visual**
- 🎨 **Diseño profesional** con gradientes y colores
- 📱 **Responsive** - funciona en móviles y escritorio
- 🏷️ **Badges de estado** con colores semánticos
- 👁️ **Información sensible** oculta por defecto

## 🎨 Diseño del Componente

### Header del Usuario
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Búsqueda de Usuario                    ❌           │
│ Buscar usuario por ID - Solo Super Administrador       │
├─────────────────────────────────────────────────────────┤
│ ID del Usuario: [________________] [Buscar] [Limpiar]   │
└─────────────────────────────────────────────────────────┘
```

### Información del Usuario Encontrado
```
┌─────────────────────────────────────────────────────────┐
│ 🟣 Marvin Calvo                    👑 Super Admin      │
│ 📧 mar90jesus@gmail.com            ✅ Activo           │
├─────────────────────────────────────────────────────────┤
│ 👤 Información Básica                                  │
│ 📧 Email: mar90jesus@gmail.com                         │
│ 👤 Nombre: Marvin Calvo                                │
│ 📅 Registro: 15 de enero de 2024, 10:30               │
│ 🕐 Último acceso: 20 de enero de 2024, 14:45          │
├─────────────────────────────────────────────────────────┤
│ ⚙️ Estado y Configuración                              │
│ 🛡️ Rol: 👑 Super Admin                                │
│ 📊 Estado: ✅ Activo                                   │
│ ✅ Registro: Aprobado                                  │
│ 📅 Actualización: 20 de enero de 2024, 14:45          │
├─────────────────────────────────────────────────────────┤
│ 🔑 Permisos Asignados                                  │
│ [users.view] [users.create] [users.edit] [users.delete]│
│ [permissions.view] [permissions.assign] ...            │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Información Técnica                    [👁️ Mostrar] │
│ 🔑 UID: abc123def456ghi789...                         │
│ ✅ Aprobado por: admin@example.com                     │
│ 📅 Fecha: 15 de enero de 2024, 10:30                  │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Implementación Técnica

### Función de Búsqueda
```typescript
// En lib/auth.ts
export const getUserById = async (uid: string): Promise<UserProfile | null> => {
  try {
    if (!uid || uid.trim() === '') {
      throw new Error('ID de usuario requerido');
    }

    console.log(`🔍 Buscando usuario con ID: ${uid}`);

    const userDoc = await getDoc(doc(db, 'users', uid.trim()));
    
    if (!userDoc.exists()) {
      console.log(`❌ Usuario no encontrado: ${uid}`);
      return null;
    }

    const userData = userDoc.data();
    
    // Convertir fechas de Firestore a Date
    const userProfile: UserProfile = {
      ...userData,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      lastLogin: userData.lastLogin?.toDate() || null,
      approvedAt: userData.approvedAt?.toDate() || null,
    } as UserProfile;

    console.log(`✅ Usuario encontrado: ${userProfile.email}`);
    return userProfile;
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    throw error;
  }
};
```

### Estados del Componente
```typescript
const [searchId, setSearchId] = useState('');
const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
```

### Manejo de Búsqueda
```typescript
const handleSearch = async () => {
  if (!searchId.trim()) {
    toast.error('Por favor ingresa un ID de usuario');
    return;
  }

  setLoading(true);
  setError(null);
  setSearchedUser(null);

  try {
    const user = await getUserById(searchId.trim());
    if (user) {
      setSearchedUser(user);
      toast.success('Usuario encontrado');
    } else {
      setError('Usuario no encontrado');
      toast.error('Usuario no encontrado');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error al buscar usuario';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

## 🎯 Integración en Dashboard

### Botón de Acceso
```tsx
{/* En la sección de Gestión de Usuarios */}
{isSuperAdmin() && (
  <button
    onClick={() => setShowUserSearch(true)}
    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    title="Buscar usuario por ID - Solo Super Admin"
  >
    <Search className="w-4 h-4" />
    <span>Buscar Usuario</span>
  </button>
)}
```

### Modal de Búsqueda
```tsx
{/* Modal para búsqueda de usuario */}
{showUserSearch && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <UserSearch onClose={() => setShowUserSearch(false)} />
      </div>
    </div>
  </div>
)}
```

## 🧪 Casos de Uso

### Caso 1: Super Admin Busca Usuario
```
1. Super admin hace clic en "Buscar Usuario"
2. Se abre el modal de búsqueda
3. Ingresa el UID del usuario
4. Hace clic en "Buscar"
5. Ve toda la información del usuario
6. Puede mostrar/ocultar información sensible
```

### Caso 2: Admin Regular Intenta Acceder
```
1. Admin regular hace clic en "Buscar Usuario"
2. El botón no aparece (solo para super admin)
3. Si accede directamente, ve mensaje de acceso denegado
```

### Caso 3: Usuario No Encontrado
```
1. Super admin ingresa UID incorrecto
2. Hace clic en "Buscar"
3. Ve mensaje de error "Usuario no encontrado"
4. Puede intentar con otro UID
```

## 🎨 Elementos Visuales

### Badges de Estado
```typescript
// Estado del usuario
const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Activo' },
    inactive: { icon: UserX, color: 'bg-yellow-100 text-yellow-800', label: 'Inactivo' },
    deleted: { icon: Trash2, color: 'bg-red-100 text-red-800', label: 'Eliminado' }
  };
  // ...
};

// Rol del usuario
const getRoleBadge = (role: string) => {
  const roleConfig = {
    super_admin: { color: 'bg-purple-100 text-purple-800', label: 'Super Admin' },
    admin: { color: 'bg-blue-100 text-blue-800', label: 'Admin' },
    comunidad: { color: 'bg-green-100 text-green-800', label: 'Comunidad' },
    visitante: { color: 'bg-gray-100 text-gray-800', label: 'Visitante' }
  };
  // ...
};
```

### Información Sensible
- 🔒 **Oculta por defecto** - Botón "Mostrar/Ocultar"
- ⚠️ **Advertencia visual** - Fondo amarillo
- 🔑 **UID completo** - Texto monoespaciado
- 👤 **Información de aprobación** - Si está disponible

## 🎉 Beneficios del Componente

### 1. **Acceso Exclusivo**
- ✅ Solo Super Admin puede usar la funcionalidad
- 🛡️ Verificación de seguridad integrada
- 🚫 Acceso denegado automático para otros roles

### 2. **Información Completa**
- 📋 **Todos los datos** del usuario en un lugar
- 🔍 **Búsqueda directa** por UID
- 📊 **Estado actual** del usuario
- 🔑 **Permisos asignados** visibles

### 3. **Interfaz Profesional**
- 🎨 **Diseño moderno** con gradientes
- 📱 **Responsive** para todos los dispositivos
- 🏷️ **Badges informativos** con colores semánticos
- 👁️ **Información sensible** protegida

### 4. **Funcionalidad Completa**
- 🔍 **Búsqueda rápida** por ID
- 🧹 **Limpiar búsqueda** fácilmente
- ⚠️ **Manejo de errores** claro
- 📝 **Feedback visual** en tiempo real

## 🚀 Uso del Componente

### Para Super Administradores:
1. **Acceder** al dashboard de administración
2. **Ir** a la sección "Gestión de Usuarios"
3. **Hacer clic** en "Buscar Usuario" (botón púrpura)
4. **Ingresar** el UID del usuario a buscar
5. **Ver** toda la información detallada del usuario

### Información Disponible:
- ✅ Datos básicos (nombre, email, fechas)
- ✅ Estado y configuración (rol, estado, registro)
- ✅ Permisos asignados (lista completa)
- ✅ Información técnica (UID, aprobaciones)

**¡El componente UserSearch proporciona acceso completo y seguro a la información de cualquier usuario del sistema!**

---

**Última actualización:** Componente UserSearch completamente implementado ✨
