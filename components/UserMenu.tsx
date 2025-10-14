'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Home,
  Settings,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const UserMenu: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Sesión cerrada correctamente');
      setIsOpen(false);
      // Redirigir al home después del logout exitoso
      router.push('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
      console.error('Error al cerrar sesión:', error);
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

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 transition-colors duration-200 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:block">{userProfile?.displayName || user.email}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menú desplegable */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[101]">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                    {getRoleIcon(userProfile?.role || 'visitante')}
                    <span>{getRoleLabel(userProfile?.role || 'visitante')}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {/* Enlaces de navegación */}
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </Link>

              {(userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
                <>
                  <Link
                    href="/admin/admin-dashboard"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Panel de Administración</span>
                  </Link>
                  <Link
                    href="/admin/places"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gestión de Lugares</span>
                  </Link>
                  <Link
                    href="/admin/history"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gestión de Historia</span>
                  </Link>
                  <Link
                    href="/visitantes"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Vista Visitante</span>
                  </Link>
                </>
              )}

              {userProfile?.role === 'comunidad' && (
                <>
                  <Link
                    href="/comunidads/camaras"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cámaras</span>
                  </Link>
                  <Link
                    href="/comunidads/alertas"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Alertas</span>
                  </Link>
                </>
              )}

              {userProfile?.role === 'visitante' && (
                <>
                  <Link
                    href="/visitantes"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Para Visitantes</span>
                  </Link>
                  <Link
                    href="/visitantes/lugares"
                    className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lugares</span>
                  </Link>
                </>
              )}

              {/* Separador */}
              <div className="border-t border-gray-200 my-2" />

              {/* Botón de cerrar sesión */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
