'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/auth';
import { Mail, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Email de recuperación enviado');
    } catch (error: any) {
      let errorMessage = 'Error al enviar email de recuperación';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-theme flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al login
            </Link>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Email Enviado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hemos enviado un enlace de recuperación a tu email
            </p>
          </div>

          {/* Success Message */}
          <div className="card-theme">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Revisa tu bandeja de entrada
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Hemos enviado un enlace de recuperación a:
                </p>
                <p className="text-sm font-medium text-green-800 bg-green-100 rounded px-3 py-1 inline-block">
                  {email}
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>¿No recibiste el email?</strong>
                </p>
                <ul className="text-left space-y-1 mb-4">
                  <li>• Revisa tu carpeta de spam</li>
                  <li>• Verifica que el email esté correcto</li>
                  <li>• Espera unos minutos y vuelve a intentar</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full btn-theme-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Reenviando...' : 'Reenviar Email'}
                </button>
                
                <Link 
                  href="/login" 
                  className="w-full btn-theme-outline flex items-center justify-center"
                >
                  Volver al Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </Link>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-theme-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </button>
            </div>
          </form>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Inicia sesión
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
