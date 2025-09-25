'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { MapPin, Shield, Eye, Users, Camera, AlertTriangle, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { userProfile, loginAsGuest, isGuest } = useAuth();

  return (
    <div className="min-h-screen bg-theme">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Bienvenido a{' '}
            <span className="text-primary-600">Calle Jerusalén</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tu plataforma comunitaria digital para conectar residentes y visitantes. 
            Descubre lugares, servicios, mantente informado y contribuye a la seguridad de la comunidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!userProfile ? (
              <>
                <Link href="/register" className="btn-theme-primary text-lg px-8 py-3">
                  Registrarse como Residente
                </Link>
                <Link href="/login" className="btn-theme-secondary text-lg px-8 py-3">
                  Iniciar Sesión
                </Link>
                <button 
                  onClick={loginAsGuest}
                  className="btn-theme-outline text-lg px-8 py-3 flex items-center justify-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Explorar como Invitado
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-4">
                  ¡Bienvenido, {userProfile.displayName}!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {userProfile.role === 'visitante' && (
                    <Link href="/visitantes" className="btn-theme-primary text-lg px-8 py-3">
                      Explorar Comunidad
                    </Link>
                  )}
                  {userProfile.role === 'comunidad' && (
                    <Link href="/residentes/camaras" className="btn-theme-primary text-lg px-8 py-3">
                      Ver Cámaras
                    </Link>
                  )}
                  <Link href="/mapa" className="btn-theme-secondary text-lg px-8 py-3">
                    Ver Mapa
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características de la Plataforma
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Para Visitantes */}
            <div className="card-theme text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Para Visitantes
              </h3>
              <p className="text-gray-600 mb-4">
                Descubre lugares de recreación, servicios locales y mantente conectado con la comunidad.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Lugares de recreación</li>
                <li>• Servicios locales</li>
                <li>• Información de contacto</li>
                <li>• Mapa interactivo</li>
              </ul>
            </div>

            {/* Para Residentes */}
            <div className="card-theme text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Para Residentes
              </h3>
              <p className="text-gray-600 mb-4">
                Acceso a herramientas de seguridad, alertas comunitarias y botón de pánico.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Cámaras de seguridad</li>
                <li>• Botón de pánico</li>
                <li>• Alertas comunitarias</li>
                <li>• Reportes de seguridad</li>
              </ul>
            </div>

            {/* Comunidad */}
            <div className="card-theme text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Comunidad
              </h3>
              <p className="text-gray-600 mb-4">
                Conecta con tus vecinos, comparte información y construye una comunidad más segura.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Red social local</li>
                <li>• Eventos comunitarios</li>
                <li>• Noticias del barrio</li>
                <li>• Foros de discusión</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl font-bold mb-2">150+</div>
              <div className="text-primary-100">Miembros Activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">25+</div>
              <div className="text-primary-100">Lugares Registrados</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">12</div>
              <div className="text-primary-100">Cámaras de Seguridad</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Monitoreo</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para ser parte de la comunidad?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete hoy y comienza a disfrutar de todos los beneficios de nuestra plataforma comunitaria.
          </p>
          <Link href="/register" className="btn-theme-primary text-lg px-8 py-3">
            Registrarse como Residente
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-theme py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-6 h-6 text-primary-400" />
                <span className="text-xl font-bold">Calle Jerusalén</span>
              </div>
              <p className="text-gray-400">
                Plataforma comunitaria digital para conectar residentes y visitantes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link href="/visitantes/lugares" className="hover:text-white transition-colors">Lugares</Link></li>
                <li><Link href="/visitantes/servicios" className="hover:text-white transition-colors">Servicios</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-gray-400">
                <p>📧 info@callejerusalen.com</p>
                <p>📞 +1 (555) 123-4567</p>
                <p>📍 Calle Jerusalén, Ciudad</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Calle Jerusalén. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

