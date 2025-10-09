'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerUser, UserRole, logoutUser } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Shield, Eye as EyeIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado (pero NO durante el proceso de registro)
  React.useEffect(() => {
    if (user && !isRegistering && !loading) {
      router.push('/');
    }
  }, [user, router, isRegistering, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (!formData.displayName.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setIsRegistering(true); // ✅ Marcar que estamos en proceso de registro

    try {
      console.log('📝 Iniciando proceso de registro...');
      
      // Registrar usuario - la función registerUser automáticamente inicia sesión
      await registerUser(
        formData.email,
        formData.password,
        formData.displayName,
        'comunidad' // Solo se pueden registrar usuarios de la comunidad
      );
      
      console.log('✅ Usuario registrado exitosamente');
      
      // Cerrar sesión inmediatamente para que el usuario deba hacer login
      console.log('🚪 Cerrando sesión para redirigir al login...');
      await logoutUser();
      
      // Mensaje de éxito
      toast.success('¡Registro exitoso! Ahora inicia sesión con tus credenciales.', { duration: 3000 });
      
      // Esperar un momento para que el toast sea visible y el logout se complete
      console.log('⏳ Esperando para asegurar logout completo...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirigir al login con parámetro para mostrar mensaje de bienvenida
      console.log('↪️ Redirigiendo al login...');
      router.push('/login?registered=true');
    } catch (error: any) {
      let errorMessage = 'Error al crear la cuenta';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ya existe una cuenta con este email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      }
      
      toast.error(errorMessage);
      
      // Resetear el flag de registro en caso de error
      setIsRegistering(false);
    } finally {
      setLoading(false);
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
            Registro de Comunidad
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Solo para miembros de la comunidad Calle Jerusalén
          </p>
          <p className="mt-1 text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Inicia sesión aquí
            </Link>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            ¿Eres visitante? Puedes explorar la comunidad sin registro
          </p>
        </div>

        {/* Form */}
        <div className="card-theme">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="input-container">
                <User className="input-icon h-5 w-5" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="input-theme pl-10"
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-theme pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Información del rol */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">Registro de Comunidad</span>
              </div>
              <p className="text-xs text-primary-700 mb-3">
                Al registrarte como miembro de la comunidad, tendrás acceso completo a todas las funcionalidades de la comunidad, 
                incluyendo cámaras de seguridad, botón de pánico y alertas comunitarias.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-2">
                <p className="text-xs text-yellow-800">
                  <strong>📋 Proceso de Registro:</strong>
                </p>
                <ol className="text-xs text-yellow-800 list-decimal list-inside space-y-1 ml-2">
                  <li>Completa el formulario de registro</li>
                  <li>Serás redirigido al login automáticamente</li>
                  <li>Inicia sesión con tus credenciales</li>
                  <li>Tu cuenta estará <strong>pendiente de aprobación</strong></li>
                  <li>Un administrador revisará tu solicitud</li>
                  <li>Recibirás acceso completo una vez aprobada</li>
                </ol>
                <p className="text-xs text-yellow-700 font-medium mt-2 pt-2 border-t border-yellow-300">
                  ⏳ Tiempo de aprobación: Usualmente 24-48 horas
                </p>
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-theme pl-10 pr-10"
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="input-container">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-theme pl-10 pr-10"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-theme-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Registro'}
              </button>
            </div>
          </form>
        </div>

        {/* Terms */}
        <div className="text-center text-xs text-gray-500">
          Al registrarte, aceptas nuestros{' '}
          <Link href="/terms" className="text-primary-600 hover:text-primary-500">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
            Política de Privacidad
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

