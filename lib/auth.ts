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
export type UserStatus = 'active' | 'inactive' | 'deleted' | 'pending' | 'blocked';

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
  // Plan de Seguridad de la Comunidad - REMOVIDO: ahora se maneja en securityRegistrations collection
}

// Interfaz para el Plan de Seguridad desde securityRegistrations
export interface SecurityPlanRegistration {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  phoneNumber: string;
  address: string;
  availability: string;
  skills: string[];
  otherSkills?: string;
  status: 'pending' | 'active' | 'rejected';
  sector?: string;
  submittedAt: any; // Firestore timestamp
  reviewedBy?: string;
  reviewedAt?: any; // Firestore timestamp
  reviewNotes?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
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


// Función para registrar un nuevo usuario usando API route del servidor
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'comunidad'
): Promise<User> => {
  console.log('🚀 Iniciando registro de usuario:', { email, displayName, role });

  try {
    // Usar la API route del servidor para crear el usuario
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        displayName: displayName,
        role: role
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar usuario');
    }

    const result = await response.json();
    console.log('✅ Usuario registrado exitosamente:', result);

    // Ahora crear la sesión del usuario en el cliente
    if (!auth) {
      throw new Error('Firebase Auth no está inicializado');
    }

    // Iniciar sesión con las credenciales del usuario
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sesión iniciada para el usuario:', user.uid);
    return user;
    
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    throw error;
  }
};

// Función para verificar el estado de registro de un usuario
export const checkRegistrationStatus = async (uid: string): Promise<{
  status: 'pending' | 'approved' | 'rejected' | 'not_found';
  userProfile?: UserProfile;
}> => {
  if (!db) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile) {
      return { status: 'not_found' };
    }

    return {
      status: userProfile.registrationStatus || 'approved',
      userProfile
    };
  } catch (error) {
    console.error('Error al verificar estado de registro:', error);
    return { status: 'not_found' };
  }
};

// Función para iniciar sesión con verificación de estado de registro
export const loginUser = async (email: string, password: string): Promise<{
  user: User;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'not_found';
  userProfile?: UserProfile;
}> => {
  if (!auth) {
    throw new Error('Firebase no está inicializado');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verificar el estado de registro y el estado del usuario
    const registrationStatus = await checkRegistrationStatus(user.uid);
    
    console.log('🔍 Estado de registro verificado:', registrationStatus.status);
    console.log('🔍 Perfil de usuario:', registrationStatus.userProfile);

    // ⚠️ VERIFICACIÓN CRÍTICA: Bloquear usuarios inactivos, eliminados o bloqueados
    if (registrationStatus.userProfile) {
      const userStatus = registrationStatus.userProfile.status;
      const isActive = registrationStatus.userProfile.isActive;
      const userEmail = registrationStatus.userProfile.email;

      // 🔐 PROTECCIÓN SUPER ADMIN: El super admin NUNCA puede ser bloqueado
      const isSuperAdmin = isMainSuperAdmin(userEmail);
      
      if (isSuperAdmin) {
        console.log('👑 Super Admin detectado - Acceso garantizado:', userEmail);
        // El super admin siempre tiene acceso, sin importar el estado
        // Continuar con el login sin verificar estado
      } else {
        // Para usuarios normales, verificar el estado
        // Solo permitir login a usuarios con status='active'
        // ⚠️ IMPORTANTE: El orden importa - verificar estados específicos primero
        
        // 1. Verificar usuarios ELIMINADOS
        if (userStatus === 'deleted') {
          await signOut(auth);
          
          const error: any = new Error('🚫 Cuenta Eliminada: Esta cuenta ha sido eliminada del sistema. Si crees que esto es un error, contacta al administrador para solicitar la reactivación de tu cuenta.');
          error.code = 'auth/user-deleted';
          throw error;
        }

        // 2. Verificar usuarios PENDIENTES (antes de inactive porque también tienen isActive=false)
        if (userStatus === 'pending') {
          await signOut(auth);
          
          const error: any = new Error('⏳ Cuenta Pendiente de Aprobación: Tu registro ha sido recibido correctamente. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión. Este proceso suele tomar 24-48 horas.');
          error.code = 'auth/user-pending';
          throw error;
        }

        // 3. Verificar usuarios INACTIVOS/DESACTIVADOS
        if (userStatus === 'inactive' || isActive === false) {
          await signOut(auth);
          
          const error: any = new Error('🚫 Cuenta Desactivada: Tu cuenta ha sido desactivada por un administrador. Esto puede deberse a inactividad o violación de políticas. Contacta al administrador para obtener más información y solicitar la reactivación.');
          error.code = 'auth/user-disabled';
          throw error;
        }

        // 4. Verificar que el status sea 'active' (cualquier otro estado no permitido)
        if (userStatus !== 'active') {
          await signOut(auth);
          
          const error: any = new Error(`❌ Estado de Cuenta Inválido: Tu cuenta tiene un estado no válido (${userStatus}). Contacta al administrador para resolver este problema.`);
          error.code = 'auth/user-not-active';
          throw error;
        }
        
        console.log(`✅ Login permitido para usuario con status: ${userStatus}`);
      }
    }

    return {
      user,
      registrationStatus: registrationStatus.status,
      userProfile: registrationStatus.userProfile
    };
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
    // Obtener información del usuario antes del cambio
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data() as UserProfile;
    
    // 🔐 PROTECCIÓN CRÍTICA: No se puede modificar el estado del super admin principal
    if (isMainSuperAdmin(userData.email)) {
      console.error('❌ Intento de modificar estado del Super Admin:', userData.email);
      throw new Error('No se puede modificar el estado del super administrador principal. Este usuario tiene protección permanente.');
    }

    // Obtener el perfil del usuario que está haciendo el cambio
    const changerProfile = await getUserProfile(changedBy);
    if (!changerProfile) {
      throw new Error('Usuario que realiza el cambio no encontrado');
    }

    // 🔐 PROTECCIÓN: Solo super-admins pueden modificar el estado de otros super-admins
    if (userData.role === 'super_admin' && changerProfile.role !== 'super_admin') {
      throw new Error('Solo un super administrador puede modificar el estado de otro super administrador');
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

    // 🔐 PROTECCIÓN CRÍTICA: NADIE puede editar al super-admin principal
    if (isMainSuperAdmin(userProfile.email)) {
      throw new Error('No se puede editar al super administrador principal');
    }

    // Obtener el perfil del usuario que está haciendo la actualización
    const updaterProfile = await getUserProfile(updatedBy);
    if (!updaterProfile) {
      throw new Error('Usuario actualizador no encontrado');
    }

    // 🔐 PROTECCIÓN: Solo super-admins pueden editar a otros super-admins
    if (userProfile.role === 'super_admin' && updaterProfile.role !== 'super_admin') {
      throw new Error('Solo un super administrador puede editar a otro super administrador');
    }

    // 🔐 PROTECCIÓN: Solo el super-admin principal puede asignar el rol de super_admin
    if (updates.role === 'super_admin') {
      if (updaterProfile.email !== 'mar90jesus@gmail.com') {
        throw new Error('Solo el super administrador principal puede asignar el rol de Super Administrador');
      }
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
    // 🔐 PROTECCIÓN: Solo el super-admin principal puede aprobar con rol de super_admin
    if (approvedRole === 'super_admin') {
      const approverProfile = await getUserProfile(approvedBy);
      if (!approverProfile || approverProfile.email !== 'mar90jesus@gmail.com') {
        throw new Error('Solo el super administrador principal puede aprobar usuarios con el rol de Super Administrador');
      }
    }

    // Obtener la solicitud de registro
    const requestRef = doc(db, 'registrationRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Solicitud de registro no encontrada');
    }

    const requestData = requestDoc.data() as RegistrationRequest;
    
    // Actualizar la solicitud de registro
    await updateDoc(requestRef, {
      status: 'approved',
      processedBy: approvedBy,
      processedAt: new Date()
    });

    // Actualizar el perfil del usuario con estado activo y todos los campos necesarios
    const userRef = doc(db, 'users', requestId);
    const userUpdateData: Partial<UserProfile> = {
      status: 'active',
      isActive: true,
      registrationStatus: 'approved',
      approvedBy: approvedBy,
      approvedAt: new Date(),
      permissions: DEFAULT_PERMISSIONS[approvedRole] || [],
      updatedAt: new Date(),
      statusChangedBy: approvedBy,
      statusChangedAt: new Date(),
      statusReason: 'Registro aprobado por administrador'
    };

    await updateDoc(userRef, userUpdateData);

    // Log de la acción en el servidor
    const userProfile = await getUserProfile(approvedBy);
    await logSystemAction('registration_approved', approvedBy, userProfile?.email || 'unknown', {
      requestId,
      approvedRole,
      approvedUserEmail: requestData.email,
      approvedUserName: requestData.displayName
    });

    console.log('✅ Registro aprobado para:', requestData.email);
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
    // Obtener la solicitud de registro
    const requestRef = doc(db, 'registrationRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Solicitud de registro no encontrada');
    }

    const requestData = requestDoc.data() as RegistrationRequest;
    
    // Actualizar la solicitud de registro
    await updateDoc(requestRef, {
      status: 'rejected',
      processedBy: rejectedBy,
      processedAt: new Date(),
      reason
    });

    // Actualizar el perfil del usuario con estado rechazado
    const userRef = doc(db, 'users', requestId);
    const userUpdateData: Partial<UserProfile> = {
      status: 'inactive',
      isActive: false,
      registrationStatus: 'rejected',
      updatedAt: new Date(),
      statusChangedBy: rejectedBy,
      statusChangedAt: new Date(),
      statusReason: `Registro rechazado: ${reason}`
    };

    await updateDoc(userRef, userUpdateData);

    // Log de la acción en el servidor
    const userProfile = await getUserProfile(rejectedBy);
    await logSystemAction('registration_rejected', rejectedBy, userProfile?.email || 'unknown', {
      requestId,
      reason,
      rejectedUserEmail: requestData.email,
      rejectedUserName: requestData.displayName
    });

    console.log('❌ Registro rechazado para:', requestData.email);
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

// Función para obtener un usuario por ID
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
}

// Función para obtener el estado del plan de seguridad de un usuario
export async function getUserSecurityPlanStatus(userId: string): Promise<SecurityPlanRegistration | null> {
  try {
    console.log('🔍 getUserSecurityPlanStatus - Buscando para userId:', userId);
    
    if (!db) {
      console.error('Firebase no está inicializado');
      return null;
    }

    // Buscar en securityRegistrations por userId
    const registrationsRef = collection(db, 'securityRegistrations');
    const q = query(registrationsRef, where('userId', '==', userId));
    
    // Intentar con timeout para manejar problemas de conectividad
    const querySnapshot = await Promise.race([
      getDocs(q),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]) as any;

    console.log('🔍 getUserSecurityPlanStatus - Resultados encontrados:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('🔍 getUserSecurityPlanStatus - No se encontraron registros para userId:', userId);
      return null; // No tiene registro en el plan de seguridad
    }

    // Tomar el primer registro (debería ser único por usuario)
    const doc = querySnapshot.docs[0];
    const data = doc.data();

    console.log('🔍 getUserSecurityPlanStatus - Registro encontrado:', {
      id: doc.id,
      userId: data.userId,
      status: data.status,
      userDisplayName: data.userDisplayName
    });

    return {
      id: doc.id,
      userId: data.userId,
      userDisplayName: data.userDisplayName,
      userEmail: data.userEmail,
      phoneNumber: data.phoneNumber,
      address: data.address,
      availability: data.availability,
      skills: data.skills || [],
      otherSkills: data.otherSkills,
      status: data.status,
      sector: data.sector,
      submittedAt: data.submittedAt,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt,
      reviewNotes: data.reviewNotes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.error('Error al obtener estado del plan de seguridad:', error);
    
    // En caso de error de conectividad, usar fallback
    if (error instanceof Error && (error.message.includes('unavailable') || error.message.includes('Timeout'))) {
      console.warn('⚠️ Firebase offline - Usando fallback para verificar plan de seguridad');
      return createFallbackSecurityPlan(userId);
    }
    
    return null;
  }
}

// Lista temporal de usuarios aprobados (para cuando Firebase esté offline)
const APPROVED_USERS_FALLBACK = [
  'qwBKaOMEZCgePXPTHsuNhAoz9uC2', // Marvin Calvo
  // Agregar más UIDs aquí según sea necesario
];

// Función para crear un SecurityPlanRegistration simulado cuando Firebase esté offline
function createFallbackSecurityPlan(userId: string): SecurityPlanRegistration | null {
  if (APPROVED_USERS_FALLBACK.includes(userId)) {
    return {
      id: `fallback-${userId}`,
      userId: userId,
      userDisplayName: 'Usuario Aprobado',
      userEmail: '',
      phoneNumber: '',
      address: '',
      availability: 'full_time',
      skills: [],
      otherSkills: '',
      status: 'active',
      sector: 'Centro',
      submittedAt: new Date(),
      reviewedBy: 'system-fallback',
      reviewedAt: new Date(),
      reviewNotes: 'Usuario aprobado (modo offline)',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  return null;
}

// Función para verificar si un usuario está inscrito y aprobado en el plan de seguridad
export async function isUserEnrolledInSecurityPlan(userId: string): Promise<boolean> {
  try {
    const registration = await getUserSecurityPlanStatus(userId);
    if (registration) {
      return registration.status === 'active';
    }
    
    // Fallback para cuando Firebase esté offline
    console.warn('⚠️ Usando lista de usuarios aprobados (Firebase offline)');
    return APPROVED_USERS_FALLBACK.includes(userId);
  } catch (error) {
    console.error('Error verificando estado del plan de seguridad:', error);
    // Fallback para errores de conectividad
    return APPROVED_USERS_FALLBACK.includes(userId);
  }
}

// Función para verificar si un usuario tiene una solicitud pendiente
export async function isUserSecurityPlanPending(userId: string): Promise<boolean> {
  const registration = await getUserSecurityPlanStatus(userId);
  return registration !== null && registration.status === 'pending';
}

// === FUNCIONES PARA EL SISTEMA DE BOTÓN DE PÁNICO ===

// Interfaz para configuración del botón de pánico
export interface PanicButtonSettings {
  userId: string;
  emergencyContacts: string[]; // Array de userIds del plan de seguridad
  notifyAll: boolean; // Si es true, notifica a todos los usuarios activos del plan
  customMessage?: string;
  location?: string;
  // Configuración del botón flotante
  floatingButtonEnabled: boolean; // Si está habilitado el botón flotante
  holdTime: number; // Tiempo en segundos para mantener presionado (default: 5)
  extremeModeEnabled: boolean; // Si está habilitado el modo extremo con cámara
  autoRecordVideo: boolean; // Si graba automáticamente al activar pánico
  // Configuración de geolocalización GPS
  shareGPSLocation: boolean; // Si comparte ubicación GPS en tiempo real
  // Configuración de duración de alerta
  alertDurationMinutes: number; // Duración de la señal de alerta en minutos (default: 5)
  createdAt: any;
  updatedAt: any;
}

// Función para obtener todos los usuarios activos del plan de seguridad
export async function getActiveSecurityPlanUsers(): Promise<SecurityPlanRegistration[]> {
  try {
    console.log('🔍 Obteniendo usuarios activos del plan de seguridad...');
    
    if (!db) {
      console.error('Firebase no está inicializado');
      return [];
    }

    // Primero obtener usuarios aprobados en registrationRequests
    const registrationRequestsRef = collection(db, 'registrationRequests');
    const approvedQuery = query(registrationRequestsRef, where('status', '==', 'approved'));
    const approvedSnapshot = await getDocs(approvedQuery);
    
    console.log('🔍 Usuarios aprobados encontrados:', approvedSnapshot.size);
    
    if (approvedSnapshot.empty) {
      console.log('❌ No hay usuarios aprobados en registrationRequests');
      return [];
    }

    // Obtener IDs de usuarios aprobados
    const approvedUserIds: string[] = [];
    approvedSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        approvedUserIds.push(data.userId);
      }
    });

    console.log('🔍 IDs de usuarios aprobados:', approvedUserIds);

    // Ahora obtener datos completos de securityRegistrations para usuarios aprobados
    const users: SecurityPlanRegistration[] = [];
    
    for (const userId of approvedUserIds) {
      const securityQuery = query(
        collection(db, 'securityRegistrations'),
        where('userId', '==', userId)
      );
      const securitySnapshot = await getDocs(securityQuery);
      
      if (!securitySnapshot.empty) {
        const doc = securitySnapshot.docs[0];
        const data = doc.data();
        
        // Solo incluir si el status es 'active'
        if (data.status === 'active') {
          users.push({
            id: doc.id,
            userId: data.userId,
            userDisplayName: data.userDisplayName,
            userEmail: data.userEmail,
            phoneNumber: data.phoneNumber,
            address: data.address,
            availability: data.availability,
            skills: data.skills || [],
            otherSkills: data.otherSkills,
            status: data.status,
            sector: data.sector,
            submittedAt: data.submittedAt,
            reviewedBy: data.reviewedBy,
            reviewedAt: data.reviewedAt,
            reviewNotes: data.reviewNotes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        }
      }
    }
    
    // Ordenar por sector y disponibilidad
    users.sort((a, b) => {
      // Primero por sector
      if (a.sector && b.sector && a.sector !== b.sector) {
        return a.sector.localeCompare(b.sector);
      }
      // Luego por nombre (manejar casos donde userDisplayName puede ser undefined)
      const nameA = a.userDisplayName || a.userEmail || 'Sin nombre';
      const nameB = b.userDisplayName || b.userEmail || 'Sin nombre';
      return nameA.localeCompare(nameB);
    });
    
    console.log('✅ Usuarios del plan de seguridad obtenidos:', users.length);
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios del plan de seguridad:', error);
    return [];
  }
}

// Función para guardar configuración del botón de pánico
export async function savePanicButtonSettings(
  userId: string,
  settings: Partial<PanicButtonSettings>
): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase no está inicializado');
    }

    const settingsRef = doc(db, 'panicButtonSettings', userId);
    
    const settingsData: PanicButtonSettings = {
      userId,
      emergencyContacts: settings.emergencyContacts || [],
      notifyAll: settings.notifyAll || false,
      customMessage: settings.customMessage || '',
      location: settings.location || '',
      floatingButtonEnabled: settings.floatingButtonEnabled !== undefined ? settings.floatingButtonEnabled : true,
      holdTime: settings.holdTime || 5,
      extremeModeEnabled: settings.extremeModeEnabled || false,
      autoRecordVideo: settings.autoRecordVideo !== undefined ? settings.autoRecordVideo : true,
      shareGPSLocation: settings.shareGPSLocation || false,
      alertDurationMinutes: settings.alertDurationMinutes || 5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(settingsRef, settingsData, { merge: true });
    
    console.log('✅ Configuración del botón de pánico guardada para:', userId);
  } catch (error) {
    console.error('Error al guardar configuración del botón de pánico:', error);
    throw error;
  }
}

// Función para obtener configuración del botón de pánico
export async function getPanicButtonSettings(userId: string): Promise<PanicButtonSettings | null> {
  try {
    if (!db) {
      console.error('Firebase no está inicializado');
      return null;
    }

    const settingsRef = doc(db, 'panicButtonSettings', userId);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      console.log('No hay configuración del botón de pánico para:', userId);
      return null;
    }

    const data = settingsDoc.data();
    return {
      userId: data.userId,
      emergencyContacts: data.emergencyContacts || [],
      notifyAll: data.notifyAll || false,
      customMessage: data.customMessage || '',
      location: data.location || '',
      floatingButtonEnabled: data.floatingButtonEnabled !== undefined ? data.floatingButtonEnabled : true,
      holdTime: data.holdTime || 5,
      extremeModeEnabled: data.extremeModeEnabled || false,
      autoRecordVideo: data.autoRecordVideo !== undefined ? data.autoRecordVideo : true,
      shareGPSLocation: data.shareGPSLocation || false,
      alertDurationMinutes: data.alertDurationMinutes || 5,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.error('Error al obtener configuración del botón de pánico:', error);
    return null;
  }
}
