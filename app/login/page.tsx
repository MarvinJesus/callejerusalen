'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGlobalAlert } from '@/context/GlobalAlertContext';
import { loginUser, isMainSuperAdmin } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import RegistrationStatusAlert from '@/components/RegistrationStatusAlert';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegistrationAlert, setShowRegistrationAlert] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  
  const { user, userProfile: profile } = useAuth();
  const { showAlert } = useGlobalAlert();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detectar si viene del registro
  React.useEffect(() => {
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      console.log('👋 Usuario viene del registro');
      toast.success('¡Bienvenido! Inicia sesión para continuar.', { duration: 5000 });
    }
  }, [searchParams]);

  // Redirigir si ya está autenticado Y el usuario está activo
  React.useEffect(() => {
    if (user && profile && !loginAttempted) {
      // Solo redirigir si el usuario está activo
      const canUseApp = (profile.status === 'active' && profile.isActive) ||
        profile.role === 'super_admin' ||
        isMainSuperAdmin(profile.email);

      if (canUseApp) {
        if (profile.role === 'admin' || profile.role === 'super_admin' || isMainSuperAdmin(profile.email)) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, profile, router, loginAttempted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginAttempted(true);

    console.log('🔐 Intentando iniciar sesión con:', email);

    try {
      console.log('📞 Llamando a loginUser...');
      const loginResult = await loginUser(email, password);
      console.log('✅ loginUser retornó:', loginResult);
      
      // Verificar el estado de registro
      if (loginResult.registrationStatus === 'rejected') {
        console.log('❌ Usuario con registro RECHAZADO detectado');
        
        // Mostrar banner rojo con mensaje de rechazo
        showAlert(
          '❌ Solicitud Rechazada: Tu solicitud de registro fue rechazada por un administrador. Si crees que es un error, contacta al administrador para más información.',
          'error',
          15000,
          false
        );
        
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/');
      } else {
        // Login exitoso para usuarios aprobados
        toast.success('¡Bienvenido de vuelta!');
        
        // Redirigir según el rol del usuario
        if (loginResult.userProfile?.role === 'admin' || loginResult.userProfile?.role === 'super_admin' || isMainSuperAdmin(loginResult.userProfile?.email)) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      console.log('❌ ========================================');
      console.log('❌ ERROR CAPTURADO EN CATCH');
      console.log('❌ ========================================');
      console.log('  - error:', error);
      console.log('  - error.code:', error.code);
      console.log('  - error.message:', error.message);
      console.log('  - stack:', error.stack);
      
      let errorMessage = 'Error al iniciar sesión';
      let isBlockedUser = false;
      
      // Mensajes específicos y claros para cada tipo de error
      if (error.code === 'auth/user-not-found') {
        errorMessage = '❌ Usuario no encontrado: No existe una cuenta registrada con este email. Verifica tu email o regístrate si aún no tienes cuenta.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '❌ Contraseña incorrecta: La contraseña ingresada no es correcta. Verifica tu contraseña o usa "¿Olvidaste tu contraseña?" para recuperarla.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Email inválido: El formato del email no es válido. Verifica que esté escrito correctamente.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '⚠️ Demasiados intentos fallidos: Por seguridad, tu acceso ha sido temporalmente bloqueado. Espera unos minutos e intenta nuevamente.';
      } else if (error.code === 'auth/user-pending') {
        errorMessage = '⏳ Cuenta Pendiente de Aprobación: Tu registro ha sido recibido correctamente. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión. Este proceso suele tomar 24-48 horas.';
        isBlockedUser = true;
      } else if (error.code === 'auth/user-deleted') {
        errorMessage = '🚫 Cuenta Eliminada: Esta cuenta ha sido eliminada del sistema. Si crees que esto es un error, contacta al administrador para solicitar la reactivación de tu cuenta.';
        isBlockedUser = true;
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = '🚫 Cuenta Desactivada: Tu cuenta ha sido desactivada por un administrador. Esto puede deberse a inactividad o violación de políticas. Contacta al administrador para obtener más información y solicitar la reactivación.';
        isBlockedUser = true;
      } else if (error.code === 'auth/user-not-active') {
        errorMessage = '❌ Estado de Cuenta Inválido: Tu cuenta tiene un estado no válido. Contacta al administrador para resolver este problema.';
        isBlockedUser = true;
      } else if (error.message) {
        // Si hay un mensaje de error personalizado, usarlo
        errorMessage = error.message;
        // Verificar si el mensaje contiene palabras clave de bloqueo/estado
        if (errorMessage.toLowerCase().includes('eliminada') || 
            errorMessage.toLowerCase().includes('desactivada') || 
            errorMessage.toLowerCase().includes('no está activa') ||
            errorMessage.toLowerCase().includes('ha sido eliminada') ||
            errorMessage.toLowerCase().includes('ha sido desactivada') ||
            errorMessage.toLowerCase().includes('pendiente') ||
            errorMessage.toLowerCase().includes('pending')) {
          isBlockedUser = true;
          console.log('🔍 Detectado usuario bloqueado/pendiente por mensaje:', errorMessage);
        }
      }
      
      // Si es un usuario bloqueado o pendiente, mostrar banner global amarillo
      if (isBlockedUser) {
        console.log('🚨🚨🚨 ========================================');
        console.log('🚨🚨🚨 USUARIO BLOQUEADO/PENDIENTE DETECTADO');
        console.log('🚨🚨🚨 ========================================');
        console.log('📝 Mensaje de error:', errorMessage);
        console.log('🔍 Código de error:', error.code);
        console.log('🔍 showAlert disponible:', typeof showAlert);
        
        // Determinar tipo y duración del banner según el error
        let alertType: 'warning' | 'error' = 'warning';
        let duration = 15000; // Por defecto 15 segundos
        
        if (error.code === 'auth/user-pending') {
          alertType = 'warning';
          duration = 25000; // 25 segundos - mensaje más largo
        } else if (error.code === 'auth/user-deleted') {
          alertType = 'error';
          duration = 20000; // 20 segundos
        } else if (error.code === 'auth/user-disabled') {
          alertType = 'warning';
          duration = 20000; // 20 segundos
        }
        
        console.log('⚡ Llamando a showAlert AHORA...');
        showAlert(errorMessage, alertType, duration, false);
        console.log('✅ showAlert ejecutado');
        
        // Esperar un momento para asegurar que el banner se renderice
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Banner debería estar visible ahora');
      } else {
        // Para otros errores, usar toast normal
        console.log('❌ No es usuario bloqueado, mostrando toast');
        toast.error(errorMessage);
      }
      
      // Resetear flag de intento de login después de un error
      setLoginAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegistrationAlert = () => {
    setShowRegistrationAlert(false);
    setUserProfile(null);
    
    // Si el usuario eligió explorar como visitante, cerrar sesión
    if (registrationStatus === 'pending' || registrationStatus === 'rejected') {
      // El usuario puede cerrar sesión manualmente si lo desea
    }
  };


  return (
    <div className="min-h-screen bg-theme flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className="card-theme">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="input-container">
                <Mail className="input-icon h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-theme pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="input-container">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-theme pl-10 pr-10"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-theme-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Registration Status Alert */}
      {showRegistrationAlert && (
        <RegistrationStatusAlert
          status={registrationStatus}
          userProfile={userProfile}
          onClose={handleCloseRegistrationAlert}
        />
      )}
    </div>
  );
};

export default LoginPage;

