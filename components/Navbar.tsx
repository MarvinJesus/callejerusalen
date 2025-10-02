'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/auth';
import { 
  Home, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Eye,
  MapPin,
  Phone,
  AlertTriangle,
  Settings,
  Crown,
  BookOpen
} from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Sesión cerrada correctamente');
      setIsMenuOpen(false);
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };


  const getRoleIcon = (role: string) => {
    if (role === 'super_admin') return <Crown className="w-4 h-4" />;
    if (role === 'admin') return <Settings className="w-4 h-4" />;
    if (role === 'comunidad') return <Shield className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  const getRoleLabel = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Administrador';
    if (role === 'comunidad') return 'Comunidad';
    return 'Visitante';
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar-theme sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Calle Jerusalén
              </span>
            </Link>
          </div>

          {/* Navegación desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1 font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </Link>

            {user ? (
              <>
                {userProfile?.role === 'comunidad' && (
                  <>
                    <Link 
                      href="/comunidads/camaras" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Cámaras
                    </Link>
                    <Link 
                      href="/comunidads/alertas" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Alertas</span>
                    </Link>
                  </>
                )}

                {(userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
                  <>
                    <Link 
                      href="/admin/admin-dashboard" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                    <Link 
                      href="/admin/places" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Lugares</span>
                    </Link>
                    <Link 
                      href="/admin/history" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Historia</span>
                    </Link>
                    <Link 
                      href="/visitantes" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Vista Visitante</span>
                    </Link>
                  </>
                )}

                {userProfile?.role === 'visitante' && (
                  <>
                    <Link 
                      href="/visitantes" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Para Visitantes
                    </Link>
                    <Link 
                      href="/visitantes/guia" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Guía
                    </Link>
                    <Link 
                      href="/visitantes/lugares" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Lugares
                    </Link>
                    <Link 
                      href="/visitantes/servicios" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Servicios
                    </Link>
                    <Link 
                      href="/visitantes/eventos" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    >
                      Eventos
                    </Link>
                    <Link 
                      href="/visitantes/contacto" 
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Contacto</span>
                    </Link>
                  </>
                )}

                {/* Mostrar rol actual */}
                <div className="flex items-center space-x-2 text-gray-700">
                  {getRoleIcon(userProfile?.role || 'visitante')}
                  <span className="text-sm">{getRoleLabel(userProfile?.role || 'visitante')}</span>
                </div>

                {/* Configuración */}
                <SettingsDropdown />

                {/* Usuario */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {userProfile?.displayName || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Enlaces para visitantes no autenticados */}
                <Link 
                  href="/visitantes" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Para Visitantes
                </Link>
                <Link 
                  href="/visitantes/lugares" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Lugares
                </Link>
                <Link 
                  href="/visitantes/servicios" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Servicios
                </Link>
                <Link 
                  href="/visitantes/eventos" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Eventos
                </Link>
                <Link 
                  href="/visitantes/contacto" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contacto</span>
                </Link>
                
                <div className="flex items-center space-x-4">
                  <SettingsDropdown />
                  <Link 
                    href="/login" 
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Iniciar Sesión</span>
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              <Link 
                href="/" 
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>

              {user ? (
                <>
                  {userProfile?.role === 'visitante' && (
                    <>
                      <Link 
                        href="/visitantes" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Para Visitantes
                      </Link>
                      <Link 
                        href="/visitantes/guia" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Guía
                      </Link>
                      <Link 
                        href="/visitantes/lugares" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Lugares
                      </Link>
                      <Link 
                        href="/visitantes/servicios" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Servicios
                      </Link>
                      <Link 
                        href="/visitantes/eventos" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Eventos
                      </Link>
                      <Link 
                        href="/visitantes/contacto" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Contacto
                      </Link>
                    </>
                  )}

                  {userProfile?.role === 'comunidad' && (
                    <>
                      <Link 
                        href="/comunidads/camaras" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Cámaras
                      </Link>
                      <Link 
                        href="/comunidads/alertas" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Alertas
                      </Link>
                    </>
                  )}

                  {(userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
                    <>
                      <Link 
                        href="/admin/admin-dashboard" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Panel de Administración
                      </Link>
                      <Link 
                        href="/admin/places" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Gestión de Lugares
                      </Link>
                      <Link 
                        href="/admin/history" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Gestión de Historia
                      </Link>
                      <Link 
                        href="/visitantes" 
                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Vista Visitante
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-200 pt-2">
                    <div className="px-3 py-2 text-sm text-gray-600">
                      {userProfile?.displayName || user.email}
                    </div>
                    <div className="px-3 py-2 text-xs text-gray-500 flex items-center space-x-2">
                      {getRoleIcon(userProfile?.role || 'visitante')}
                      <span>{getRoleLabel(userProfile?.role || 'visitante')}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Enlaces para visitantes no autenticados en móvil */}
                  <Link 
                    href="/visitantes" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Para Visitantes
                  </Link>
                  <Link 
                    href="/visitantes/lugares" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lugares
                  </Link>
                  <Link 
                    href="/visitantes/servicios" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Servicios
                  </Link>
                  <Link 
                    href="/visitantes/eventos" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Eventos
                  </Link>
                  <Link 
                    href="/visitantes/contacto" 
                    className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contacto
                  </Link>
                  
                  <div className="border-t border-gray-200 pt-2 px-3 py-2">
                    <Link 
                      href="/login" 
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Iniciar Sesión</span>
                      </span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

