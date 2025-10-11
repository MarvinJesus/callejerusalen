'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Camera, 
  AlertTriangle, 
  Bell, 
  Users, 
  Check, 
  ArrowLeft,
  Lock,
  Sparkles,
  Heart,
  Zap
} from 'lucide-react';

const SecurityPlanEnrollmentPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'checking' | 'enrolled' | 'not_enrolled'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar si el usuario ya está inscrito
    if (userProfile?.securityPlan?.enrolled) {
      setEnrollmentStatus('enrolled');
    } else {
      setEnrollmentStatus('not_enrolled');
    }
  }, [user, userProfile, router]);

  const handleEnroll = async () => {
    if (!agreedToTerms) {
      setError('Debes aceptar los términos del Plan de Seguridad para continuar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security-plan/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          agreedToTerms: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al inscribirse en el plan');
      }

      setSuccess(true);
      setEnrollmentStatus('enrolled');
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/residentes');
      }, 3000);
    } catch (err) {
      console.error('Error al inscribirse:', err);
      setError(err instanceof Error ? err.message : 'Error al inscribirse en el plan');
    } finally {
      setLoading(false);
    }
  };

  if (enrollmentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado de inscripción...</p>
        </div>
      </div>
    );
  }

  if (enrollmentStatus === 'enrolled' && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Ya estás inscrito!
            </h1>
            <p className="text-gray-600 mb-8">
              Ya eres parte del Plan de Seguridad de la Comunidad Calle Jerusalén.
            </p>
            <Link
              href="/residentes"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al Panel de Residentes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const benefits = [
    {
      icon: Camera,
      title: 'Cámaras de Seguridad',
      description: 'Acceso en tiempo real a las cámaras de seguridad distribuidas por la comunidad',
      color: 'blue'
    },
    {
      icon: AlertTriangle,
      title: 'Botón de Pánico',
      description: 'Sistema de emergencia instantáneo para alertar a toda la comunidad y autoridades',
      color: 'red'
    },
    {
      icon: Bell,
      title: 'Alertas Comunitarias',
      description: 'Recibe y envía alertas importantes sobre seguridad en tiempo real',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Red Comunitaria',
      description: 'Forma parte de una red de vecinos comprometidos con la seguridad',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600 bg-blue-100 text-blue-600';
      case 'red':
        return 'from-red-500 to-red-600 bg-red-100 text-red-600';
      case 'yellow':
        return 'from-yellow-500 to-amber-600 bg-yellow-100 text-yellow-600';
      case 'purple':
        return 'from-purple-500 to-purple-600 bg-purple-100 text-purple-600';
      default:
        return 'from-gray-500 to-gray-600 bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/residentes"
            className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full mb-6">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Plan de Seguridad Comunitaria</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Únete al Plan de Seguridad de
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Calle Jerusalén</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Mantengámonos unidos e informados a través de la tecnología. Juntos construimos una comunidad más segura.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-green-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  ¡Bienvenido al Plan de Seguridad!
                </h3>
                <p className="text-green-700">
                  Te has inscrito exitosamente. Ahora tienes acceso a todas las funciones de seguridad de la comunidad.
                  Redirigiendo...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const colors = getColorClasses(benefit.color);
            
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-green-200"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${colors} rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* What You Get Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-12 border-2 border-green-100">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">¿Qué obtienes al inscribirte?</h2>
          </div>
          
          <div className="space-y-4">
            {[
              'Acceso completo a las cámaras de seguridad de la comunidad 24/7',
              'Botón de pánico para emergencias con respuesta inmediata',
              'Sistema de alertas comunitarias en tiempo real',
              'Comunicación directa con otros residentes comprometidos',
              'Notificaciones de eventos de seguridad relevantes',
              'Participación en la toma de decisiones de seguridad comunitaria'
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commitment Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8 border-2 border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Nuestro Compromiso</h2>
          </div>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            El Plan de Seguridad de Calle Jerusalén es más que un sistema tecnológico; es un compromiso comunitario.
            Al inscribirte, te unes a una red de vecinos que se preocupan por el bienestar de todos. Juntos, creamos
            un entorno más seguro y conectado para nuestras familias.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Seguridad</p>
              <p className="text-sm text-gray-600">Tecnología al servicio de tu protección</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Comunidad</p>
              <p className="text-sm text-gray-600">Unidos somos más fuertes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Innovación</p>
              <p className="text-sm text-gray-600">Tecnología para estar conectados</p>
            </div>
          </div>
        </div>

        {/* Terms and Enrollment */}
        {!success && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Términos del Plan</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-64 overflow-y-auto">
              <div className="space-y-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Al inscribirte en el Plan de Seguridad de la Comunidad, aceptas:</p>
                
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Utilizar las herramientas de seguridad de manera responsable y ética</li>
                  <li>Reportar incidentes de seguridad de forma veraz y oportuna</li>
                  <li>Respetar la privacidad de otros miembros de la comunidad</li>
                  <li>No hacer uso indebido del botón de pánico o alertas comunitarias</li>
                  <li>Mantener la confidencialidad de la información de seguridad compartida</li>
                  <li>Participar activamente en el fortalecimiento de la seguridad comunitaria</li>
                  <li>Notificar cualquier cambio en tu situación como residente</li>
                  <li>Colaborar con las autoridades cuando sea necesario</li>
                </ol>

                <p className="mt-4 text-xs text-gray-500">
                  El incumplimiento de estos términos puede resultar en la suspensión o revocación del acceso
                  a las funciones de seguridad del plan.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                </div>
                <span className="text-gray-700 leading-relaxed group-hover:text-gray-900">
                  He leído y acepto los términos del Plan de Seguridad de la Comunidad Calle Jerusalén
                </span>
              </label>
            </div>

            <button
              onClick={handleEnroll}
              disabled={!agreedToTerms || loading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                agreedToTerms && !loading
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Inscribiendo...</span>
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6" />
                  <span>Inscribirme en el Plan de Seguridad</span>
                </>
              )}
            </button>

            {!agreedToTerms && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Debes aceptar los términos para continuar
              </p>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            ¿Tienes preguntas sobre el Plan de Seguridad?{' '}
            <a href="mailto:seguridad@callejerusalen.com" className="text-green-600 hover:text-green-700 font-medium">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityPlanEnrollmentPage;

