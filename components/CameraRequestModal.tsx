import React, { useState } from 'react';
import { X, Check, XCircle, Trash2, Camera, User, MessageSquare, Calendar, Shield } from 'lucide-react';

interface CameraRequest {
  id: string;
  userId: string;
  cameraId: string;
  cameraName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  requestedBy: string;
  userEmail: string;
  userName: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface CameraRequestModalProps {
  request: CameraRequest;
  onClose: () => void;
  onApprove: (reviewNotes: string) => void;
  onReject: (reviewNotes: string) => void;
  onDelete: () => void;
}

const CameraRequestModal: React.FC<CameraRequestModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
  onDelete
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(reviewNotes);
      // Limpiar el estado después de la acción exitosa
      setReviewNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(reviewNotes);
      // Limpiar el estado después de la acción exitosa
      setReviewNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onDelete();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestionar Solicitud de Acceso
              </h2>
              <p className="text-sm text-gray-600">
                Revisar y decidir sobre la solicitud de acceso a cámara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del Usuario */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Información del Usuario</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{request.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{request.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID de Usuario</p>
                <p className="font-mono text-sm text-gray-700">{request.userId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado de la Solicitud</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : request.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {request.status === 'pending' ? 'Pendiente' : 
                   request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de la Cámara */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Camera className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Información de la Cámara</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre de la Cámara</p>
                <p className="font-medium text-gray-900">{request.cameraName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID de la Cámara</p>
                <p className="font-mono text-sm text-gray-700">{request.cameraId}</p>
              </div>
            </div>
          </div>

          {/* Razón de la Solicitud */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Razón de la Solicitud</h3>
            </div>
            <p className="text-gray-900 bg-white p-3 rounded-lg border border-green-200">
              {request.reason}
            </p>
          </div>

          {/* Fecha de Solicitud */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Información de Fecha</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha de Solicitud</p>
                <p className="font-medium text-gray-900">
                  {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'No disponible'}
                </p>
              </div>
              {request.reviewedAt && (
                <div>
                  <p className="text-sm text-gray-600">Fecha de Revisión</p>
                  <p className="font-medium text-gray-900">
                    {new Date(request.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {request.reviewedBy && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Revisado por</p>
                <p className="font-medium text-gray-900">{request.reviewedBy}</p>
              </div>
            )}
            {request.reviewNotes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Notas de Revisión</p>
                <p className="font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {request.reviewNotes}
                </p>
              </div>
            )}
          </div>

          {/* Notas de Revisión (si está pendiente, aprobada o rechazada) */}
          {(request.status === 'pending' || request.status === 'approved' || request.status === 'rejected') && (
            <div className={`p-4 rounded-lg ${
              request.status === 'pending' ? 'bg-yellow-50' : 
              request.status === 'approved' ? 'bg-green-50' : 
              'bg-red-50'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <Shield className={`w-5 h-5 ${
                  request.status === 'pending' ? 'text-yellow-600' : 
                  request.status === 'approved' ? 'text-green-600' : 
                  'text-red-600'
                }`} />
                <h3 className="font-semibold text-gray-900">
                  {request.status === 'pending' ? 'Notas de Revisión (Opcional)' : 
                   request.status === 'approved' ? 'Notas de Cambio de Estado (Opcional)' :
                   'Notas de Re-aprobación (Opcional)'}
                </h3>
              </div>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  request.status === 'pending' ? "Agrega notas sobre tu decisión..." : 
                  request.status === 'approved' ? "Agrega notas sobre el cambio de estado..." :
                  "Agrega notas sobre la re-aprobación..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-2">
                Estas notas se guardarán en el historial de la solicitud
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {request.status === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>{isProcessing ? 'Procesando...' : 'Aprobar'}</span>
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isProcessing ? 'Procesando...' : 'Rechazar'}</span>
                </button>
              </>
            )}
            {request.status === 'approved' && (
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Procesando...' : 'Desaprobar'}</span>
              </button>
            )}
            {request.status === 'rejected' && (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Procesando...' : 'Re-aprobar'}</span>
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirmar Eliminación
                    </h3>
                    <p className="text-sm text-gray-600">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  ¿Estás seguro de que quieres eliminar esta solicitud de acceso a cámara?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraRequestModal;

