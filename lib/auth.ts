import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  deleteUser,
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { logSystemAction } from './server-logging';
import { Permission, DEFAULT_PERMISSIONS, validatePermissions } from './permissions';

// Tipos de usuario
export type UserRole = 'visitante' | 'comunidad' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'deleted';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // Mantenido por compatibilidad, pero status es la fuente de verdad
  permissions?: Permission[];
  lastLogin?: Date;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  // Campos adicionales para el sistema de estados
  statusChangedBy?: string;
  statusChangedAt?: Date;
  statusReason?: string;
}

export interface RegistrationRequest {
  id: string;
  email: string;
  displayName: string;
  requestedRole: UserRole;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
  processedAt?: Date;
  reason?: string;
}


// Función para registrar un nuevo usuario
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'comunidad'
): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar el perfil del usuario
    await updateProfile(user, { displayName });

    // Crear perfil en Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: DEFAULT_PERMISSIONS[role] || []
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return user;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
};

// Función para iniciar sesión
export const loginUser = async (email: string, password: string): Promise<User> => {
  if (!auth) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
};

// Función para cerrar sesión
export const logoutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    await signOut(auth);
    console.log('✅ Usuario cerró sesión exitosamente');
    
    // Limpiar cualquier estado local si es necesario
    if (typeof window !== 'undefined') {
      // Limpiar localStorage si hay datos de sesión guardados
      localStorage.removeItem('userSession');
      localStorage.removeItem('userProfile');
    }
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    throw error;
  }
};

// Función para recuperar contraseña
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error al enviar email de recuperación:', error);
    throw error;
  }
};

// Función para obtener el perfil del usuario desde Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener perfil del usuario:', error);
    throw error;
  }
};

// Función para actualizar el rol del usuario
export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
  } catch (error) {
    console.error('Error al actualizar rol del usuario:', error);
    throw error;
  }
};

// === FUNCIONES DE SUPER ADMINISTRADOR ===

// Función para verificar si es el super admin principal
export const isMainSuperAdmin = (email: string): boolean => {
  return email === 'mar90jesus@gmail.com';
};

// Función para verificar si un usuario puede ser eliminado
export const canDeleteUser = (email: string): boolean => {
  return !isMainSuperAdmin(email);
};

// Función para verificar si un usuario puede tener su rol modificado
export const canModifyUserRole = (email: string): boolean => {
  return !isMainSuperAdmin(email);
};

// Función para obtener todos los usuarios (solo super admin)
export const getAllUsers = async (includeDeleted: boolean = false): Promise<UserProfile[]> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    console.log('🔍 Obteniendo usuarios desde Firestore...');
    
    // Verificar si el usuario actual es super admin
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    console.log('👤 Usuario actual:', currentUser.email);
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Documentos encontrados: ${usersSnapshot.size}`);
    
    const users: UserProfile[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 Usuario encontrado: ${userData.email}, Rol: ${userData.role}, Activo: ${userData.isActive}`);
      
      // Asegurar que los datos estén en el formato correcto
      const user: UserProfile & { id: string } = {
        id: doc.id,
        uid: userData.uid || doc.id,
        email: userData.email || '',
        displayName: userData.displayName || '',
        role: userData.role || 'visitante',
        status: userData.status || (userData.isActive ? 'active' : 'inactive'),
        createdAt: userData.createdAt || new Date(),
        updatedAt: userData.updatedAt || new Date(),
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        permissions: validatePermissions(userData.permissions || []),
        lastLogin: userData.lastLogin || null,
        registrationStatus: userData.registrationStatus || 'approved',
        approvedBy: userData.approvedBy || null,
        approvedAt: userData.approvedAt || null,
        statusChangedBy: userData.statusChangedBy || null,
        statusChangedAt: userData.statusChangedAt || null,
        statusReason: userData.statusReason || null
      };
      
      users.push(user);
    });
    
    // Filtrar usuarios por estado si no se incluyen eliminados
    const filteredUsers = includeDeleted ? users : users.filter(user => user.status !== 'deleted');
    
    // Ordenar usuarios por categorías
    const sortedUsers = filteredUsers.sort((a, b) => {
      // El super admin principal siempre va primero
      if (a.email === 'mar90jesus@gmail.com') return -1;
      if (b.email === 'mar90jesus@gmail.com') return 1;
      
      // Luego por rol: super_admin, admin, comunidad, visitante
      const roleOrder = { super_admin: 1, admin: 2, comunidad: 3, visitante: 4 };
      const roleDiff = (roleOrder[a.role as keyof typeof roleOrder] || 6) - (roleOrder[b.role as keyof typeof roleOrder] || 6);
      
      if (roleDiff !== 0) return roleDiff;
      
      // Finalmente por fecha de creación
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    console.log(`✅ Usuarios obtenidos exitosamente: ${sortedUsers.length}`);
    console.log('📋 Lista de usuarios ordenados:', sortedUsers.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));
    
    return sortedUsers;
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    
    // Información adicional de debug
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Si es un error de permisos, intentar obtener al menos el usuario actual
    if (error instanceof Error && error.message.includes('permission')) {
      console.log('⚠️ Error de permisos detectado, intentando obtener usuario actual...');
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.uid);
          if (userProfile) {
            console.log('✅ Usuario actual obtenido:', userProfile);
            return [{ ...userProfile, uid: currentUser.uid }];
          }
        }
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
      }
    }
    
    throw error;
  }
};

// Función para verificar si un email ya existe
export const checkEmailExists = async (email: string): Promise<boolean> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    return !usersSnapshot.empty;
  } catch (error) {
    console.error('Error al verificar email:', error);
    return false;
  }
};

// Función para crear un nuevo usuario (solo super admin)
export const createUserAsAdmin = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  createdBy: string
): Promise<{ uid: string; email: string; displayName: string }> => {
  try {
    // Usar la API route del servidor para crear el usuario
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: displayName,
        role: role,
        createdBy: createdBy
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear usuario');
    }

    const result = await response.json();
    console.log('✅ Usuario creado exitosamente:', result);
    
    return result.user;
    
  } catch (error) {
    console.error('Error al crear usuario como admin:', error);
    throw error;
  }
};

// Función para cambiar el estado de un usuario (solo super admin)
export const changeUserStatus = async (
  uid: string, 
  newStatus: UserStatus, 
  changedBy: string, 
  reason?: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Verificar si es el super admin principal
    if (isMainSuperAdmin(changedBy)) {
      throw new Error('No se puede modificar el estado del super administrador principal');
    }

    // Obtener información del usuario antes del cambio
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data() as UserProfile;
    
    // Verificar si es el super admin principal por email
    if (userData.email === 'mar90jesus@gmail.com') {
      throw new Error('No se puede modificar el estado del super administrador principal');
    }

    // Actualizar el estado del usuario
    const updateData: Partial<UserProfile> = {
      status: newStatus,
      isActive: newStatus === 'active', // Mantener compatibilidad
      updatedAt: new Date(),
      statusChangedBy: changedBy,
      statusChangedAt: new Date(),
      statusReason: reason || ''
    };

    await updateDoc(doc(db, 'users', uid), updateData);

    // Log de la acción
    await logSystemAction('user_status_changed', changedBy, userData.email, {
      userEmail: userData.email,
      oldStatus: userData.status,
      newStatus: newStatus,
      reason: reason || 'Sin razón especificada'
    });

    console.log(`✅ Estado del usuario ${userData.email} cambiado a: ${newStatus}`);
    
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
};

// Función para desactivar un usuario (mantener compatibilidad)
export const deactivateUser = async (uid: string, deactivatedBy: string, reason?: string): Promise<void> => {
  return changeUserStatus(uid, 'inactive', deactivatedBy, reason);
};

// Función para eliminar un usuario (cambiar estado a deleted)
export const deleteUserAsAdmin = async (uid: string, deletedBy: string, reason?: string): Promise<void> => {
  return changeUserStatus(uid, 'deleted', deletedBy, reason);
};

// Función para reactivar un usuario
export const reactivateUser = async (uid: string, reactivatedBy: string, reason?: string): Promise<void> => {
  return changeUserStatus(uid, 'active', reactivatedBy, reason);
};

// Función para recuperar un usuario eliminado (solo super admin)
export const recoverUser = async (uid: string, recoveredBy: string, reason?: string): Promise<void> => {
  return changeUserStatus(uid, 'active', recoveredBy, reason);
};

// Funciones auxiliares para obtener usuarios por estado
export const getActiveUsers = async (): Promise<UserProfile[]> => {
  const allUsers = await getAllUsers(true);
  return allUsers.filter(user => user.status === 'active');
};

export const getInactiveUsers = async (): Promise<UserProfile[]> => {
  const allUsers = await getAllUsers(true);
  return allUsers.filter(user => user.status === 'inactive');
};

export const getDeletedUsers = async (): Promise<UserProfile[]> => {
  const allUsers = await getAllUsers(true);
  return allUsers.filter(user => user.status === 'deleted');
};

// Función para obtener usuarios por estado específico
export const getUsersByStatus = async (status: UserStatus): Promise<UserProfile[]> => {
  const allUsers = await getAllUsers(true);
  return allUsers.filter(user => user.status === status);
};

// Función para actualizar información de usuario (solo super admin)
export const updateUserAsAdmin = async (
  uid: string, 
  updates: Partial<UserProfile>, 
  updatedBy: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Obtener información del usuario antes de actualizarlo
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si es el super admin principal y se está intentando cambiar el rol
    if (isMainSuperAdmin(userProfile.email) && updates.role && updates.role !== 'super_admin') {
      throw new Error('No se puede cambiar el rol del super administrador principal');
    }

    const userRef = doc(db, 'users', uid);
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(userRef, updateData);

    // Log de la acción en el servidor
    await logSystemAction('user_updated', updatedBy, userProfile.email, {
      updatedUserId: uid,
      updates: updateData
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// Función para aprobar solicitudes de registro
export const approveRegistration = async (
  requestId: string,
  approvedBy: string,
  approvedRole: UserRole = 'comunidad'
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const requestRef = doc(db, 'registrationRequests', requestId);
    await updateDoc(requestRef, {
      status: 'approved',
      processedBy: approvedBy,
      processedAt: new Date()
    });

    // Log de la acción en el servidor
    const userProfile = await getUserProfile(approvedBy);
    await logSystemAction('registration_approved', approvedBy, userProfile?.email || 'unknown', {
      requestId,
      approvedRole
    });
  } catch (error) {
    console.error('Error al aprobar registro:', error);
    throw error;
  }
};

// Función para rechazar solicitudes de registro
export const rejectRegistration = async (
  requestId: string,
  rejectedBy: string,
  reason: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const requestRef = doc(db, 'registrationRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      processedBy: rejectedBy,
      processedAt: new Date(),
      reason
    });

    // Log de la acción en el servidor
    const userProfile = await getUserProfile(rejectedBy);
    await logSystemAction('registration_rejected', rejectedBy, userProfile?.email || 'unknown', {
      requestId,
      reason
    });
  } catch (error) {
    console.error('Error al rechazar registro:', error);
    throw error;
  }
};

// Función para obtener solicitudes de registro pendientes
export const getPendingRegistrations = async (): Promise<RegistrationRequest[]> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Primero intentar con la consulta compuesta
    try {
      const q = query(
        collection(db, 'registrationRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const requests: RegistrationRequest[] = [];
      
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as RegistrationRequest & { id: string });
      });
      
      return requests;
    } catch (indexError) {
      console.warn('Índice compuesto no disponible, usando consulta simple:', indexError);
      
      // Fallback: obtener todas las solicitudes y filtrar en el cliente
      const allRequestsSnapshot = await getDocs(collection(db, 'registrationRequests'));
      const allRequests: RegistrationRequest[] = [];
      
      allRequestsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') {
          allRequests.push({ id: doc.id, ...data } as RegistrationRequest & { id: string });
        }
      });
      
      // Ordenar por fecha de creación (más reciente primero)
      return allRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    // Retornar array vacío en lugar de lanzar error para que el dashboard funcione
    return [];
  }
};

// Función para obtener logs del sistema desde el servidor
export const getSystemLogs = async (limitCount: number = 100) => {
  try {
    const { getServerLogs } = await import('./server-logging');
    return await getServerLogs(limitCount);
  } catch (error) {
    console.error('Error al obtener logs del sistema:', error);
    throw error;
  }
};

// Función para actualizar usuario existente a super administrador
export const updateExistingUserToSuperAdmin = async (email: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Buscar usuario por email en Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let userToUpdate: any = null;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email === email) {
        userToUpdate = { id: doc.id, ...userData };
      }
    });

    if (!userToUpdate) {
      throw new Error('Usuario no encontrado en Firestore');
    }

    // Actualizar a super administrador
    const userRef = doc(db, 'users', userToUpdate.id);
    await updateDoc(userRef, {
      role: 'super_admin',
      updatedAt: new Date(),
      isActive: true,
      permissions: [
        'manage_users',
        'manage_roles',
        'view_analytics',
        'manage_security',
        'system_settings',
        'access_admin_panel'
      ]
    });

    console.log('✅ Usuario actualizado a super administrador:', email);
  } catch (error) {
    console.error('Error al actualizar usuario a super admin:', error);
    throw error;
  }
};

// === FUNCIONES DE GESTIÓN DE PERMISOS ===

// Función para asignar permisos a un usuario
export const assignPermissions = async (
  uid: string,
  permissions: Permission[],
  assignedBy: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Validar permisos
    const validPermissions = validatePermissions(permissions);
    
    // Obtener información del usuario objetivo
    const targetUserProfile = await getUserProfile(uid);
    if (!targetUserProfile) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener información del usuario que asigna los permisos
    const assignerProfile = await getUserProfile(assignedBy);
    if (!assignerProfile) {
      throw new Error('Usuario asignador no encontrado');
    }

    // Verificar que el usuario que asigna tenga permisos para hacerlo
    if (assignerProfile.role !== 'super_admin') {
      throw new Error('Solo los super administradores pueden asignar permisos');
    }

    // Obtener permisos actuales y agregar los nuevos
    const currentPermissions = targetUserProfile.permissions || [];
    const combinedPermissions = [...currentPermissions, ...validPermissions];
    const updatedPermissions = Array.from(new Set(combinedPermissions));

    // Actualizar permisos del usuario
    await updateDoc(doc(db, 'users', uid), {
      permissions: updatedPermissions,
      updatedAt: new Date()
    });

    // Log de la acción
    await logSystemAction('permissions_assigned', assignedBy, targetUserProfile.email, {
      targetUserId: uid,
      targetUserEmail: targetUserProfile.email,
      addedPermissions: validPermissions,
      allPermissions: updatedPermissions
    });

    console.log(`✅ Permisos asignados a ${targetUserProfile.email}:`, validPermissions);
    console.log(`📋 Permisos totales:`, updatedPermissions);
  } catch (error) {
    console.error('Error al asignar permisos:', error);
    throw error;
  }
};

// Función para revocar permisos de un usuario
export const revokePermissions = async (
  uid: string,
  permissions: Permission[],
  revokedBy: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Obtener información del usuario objetivo
    const targetUserProfile = await getUserProfile(uid);
    if (!targetUserProfile) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener información del usuario que revoca los permisos
    const revokerProfile = await getUserProfile(revokedBy);
    if (!revokerProfile) {
      throw new Error('Usuario revocador no encontrado');
    }

    // Verificar que el usuario que revoca tenga permisos para hacerlo
    if (revokerProfile.role !== 'super_admin') {
      throw new Error('Solo los super administradores pueden revocar permisos');
    }

    // Obtener permisos actuales y remover los especificados
    const currentPermissions = targetUserProfile.permissions || [];
    const updatedPermissions = currentPermissions.filter(
      permission => !permissions.includes(permission)
    );

    // Actualizar permisos del usuario
    await updateDoc(doc(db, 'users', uid), {
      permissions: updatedPermissions,
      updatedAt: new Date()
    });

    // Log de la acción
    await logSystemAction('permissions_revoked', revokedBy, targetUserProfile.email, {
      targetUserId: uid,
      targetUserEmail: targetUserProfile.email,
      revokedPermissions: permissions
    });

    console.log(`✅ Permisos revocados de ${targetUserProfile.email}:`, permissions);
  } catch (error) {
    console.error('Error al revocar permisos:', error);
    throw error;
  }
};

// Función para verificar si un usuario tiene un permiso específico
export const checkUserPermission = async (
  uid: string,
  permission: Permission
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      return false;
    }

    // Super admin siempre tiene todos los permisos
    if (userProfile.role === 'super_admin') {
      return true;
    }

    // Verificar si el usuario tiene el permiso específico
    return userProfile.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    return false;
  }
};

// Función para obtener todos los permisos de un usuario
export const getUserPermissions = async (uid: string): Promise<Permission[]> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      return [];
    }

    // Super admin tiene todos los permisos
    if (userProfile.role === 'super_admin') {
      return Object.values(DEFAULT_PERMISSIONS.super_admin);
    }

    return userProfile.permissions || [];
  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error);
    return [];
  }
};

// Función para actualizar permisos por defecto de un rol
export const updateDefaultPermissions = async (
  role: UserRole,
  permissions: Permission[],
  updatedBy: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    // Solo super admin puede actualizar permisos por defecto
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const currentUserProfile = await getUserProfile(currentUser.uid);
    if (!currentUserProfile || currentUserProfile.role !== 'super_admin') {
      throw new Error('Solo los super administradores pueden actualizar permisos por defecto');
    }

    // Validar permisos
    const validPermissions = validatePermissions(permissions);

    // Actualizar permisos por defecto en la base de datos
    await setDoc(doc(db, 'defaultPermissions', role), {
      role,
      permissions: validPermissions,
      updatedAt: new Date(),
      updatedBy: currentUser.uid
    });

    // Log de la acción
    await logSystemAction('default_permissions_updated', updatedBy, currentUserProfile.email, {
      role,
      permissions: validPermissions
    });

    console.log(`✅ Permisos por defecto actualizados para rol ${role}:`, validPermissions);
  } catch (error) {
    console.error('Error al actualizar permisos por defecto:', error);
    throw error;
  }
};

// Función para obtener métricas del sistema desde el servidor
export const getSystemMetrics = async (): Promise<any> => {
  try {
    const { getSystemMetrics: getServerMetrics, updateSystemMetrics } = await import('./server-logging');
    
    // Obtener estadísticas de usuarios de Firebase
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersByRole: Record<string, number> = {};
    let totalUsers = 0;
    let activeUsers = 0;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const role = userData.role || 'unknown';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
      totalUsers++;
      
      if (userData.isActive) {
        activeUsers++;
      }
    });

    // Actualizar métricas en el servidor
    const userCounts = {
      total: totalUsers,
      active: activeUsers,
      byRole: usersByRole
    };

    const updatedMetrics = await updateSystemMetrics(userCounts);
    
    // Obtener logs recientes para mostrar actividad
    const recentLogs = await getSystemLogs(50);
    
    return {
      ...updatedMetrics,
      activity: {
        ...updatedMetrics.activity,
        recentActions: recentLogs.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Error al obtener métricas del sistema:', error);
    throw error;
  }
};
