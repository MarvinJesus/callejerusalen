'use client';

import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  Settings,
  Key,
  Users,
  FileText,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserById, UserProfile } from '@/lib/auth';
import toast from 'react-hot-toast';

interface UserSearchProps {
  onClose?: () => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose }) => {
  const { userProfile } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

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

  const handleClear = () => {
    setSearchId('');
    setSearchedUser(null);
    setError(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'Activo' },
      inactive: { icon: UserX, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Inactivo' },
      deleted: { icon: Trash2, color: 'bg-red-100 text-red-800 border-red-200', label: 'Eliminado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Super Admin' },
      admin: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Admin' },
      comunidad: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Comunidad' },
      visitante: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Visitante' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.visitante;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Search className="w-6 h-6 text-purple-600" />
            <span>Búsqueda de Usuario</span>
          </h2>
          <p className="text-gray-600 mt-1">Buscar usuario por ID - Solo Super Administrador</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              ID del Usuario
            </label>
            <input
              id="userId"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Ingresa el ID del usuario (UID)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              disabled={loading || !searchId.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información del Usuario */}
      {searchedUser && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header del Usuario */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{searchedUser.displayName}</h3>
                  <p className="text-purple-100">{searchedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getRoleBadge(searchedUser.role)}
                {getStatusBadge(searchedUser.status)}
              </div>
            </div>
          </div>

          {/* Información Detallada */}
          <div className="p-6 space-y-6">
            {/* Información Básica */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span>Información Básica</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{searchedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-900">{searchedUser.displayName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Registro</p>
                    <p className="font-medium text-gray-900">
                      {new Date(searchedUser.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Último Acceso</p>
                    <p className="font-medium text-gray-900">
                      {searchedUser.lastLogin ? 
                        new Date(searchedUser.lastLogin).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Nunca'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Estado */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Estado y Configuración</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Rol</p>
                    <div className="mt-1">{getRoleBadge(searchedUser.role)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <div className="mt-1">{getStatusBadge(searchedUser.status)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Estado de Registro</p>
                    <p className="font-medium text-gray-900">
                      {searchedUser.registrationStatus === 'approved' ? 'Aprobado' :
                       searchedUser.registrationStatus === 'pending' ? 'Pendiente' :
                       searchedUser.registrationStatus === 'rejected' ? 'Rechazado' : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Última Actualización</p>
                    <p className="font-medium text-gray-900">
                      {new Date(searchedUser.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permisos */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5 text-gray-600" />
                <span>Permisos Asignados</span>
              </h4>
              {searchedUser.permissions && searchedUser.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchedUser.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Key className="w-3 h-3 mr-1" />
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-center">No hay permisos asignados</p>
                </div>
              )}
            </div>

            {/* Información Sensible */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  <span>Información Técnica</span>
                </h4>
                <button
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showSensitiveInfo ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              
              {showSensitiveInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Key className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-800">UID</p>
                      <p className="font-mono text-sm text-yellow-900 break-all">{searchedUser.uid}</p>
                    </div>
                  </div>
                  {searchedUser.approvedBy && (
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <UserCheck className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-800">Aprobado por</p>
                        <p className="font-medium text-yellow-900">{searchedUser.approvedBy}</p>
                      </div>
                    </div>
                  )}
                  {searchedUser.approvedAt && (
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-800">Fecha de Aprobación</p>
                        <p className="font-medium text-yellow-900">
                          {new Date(searchedUser.approvedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
