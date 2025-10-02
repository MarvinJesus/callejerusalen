'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Edit, Trash2, Plus, ArrowLeft, X, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface HistoryPeriod {
  id?: string;
  period: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  order: number;
}

interface HistoryPageData {
  id?: string;
  title: string;
  subtitle: string;
  periods: HistoryPeriod[];
  traditions: any[];
  places: any[];
  gallery: any[];
  exploreLinks: any[];
  isActive: boolean;
}

const AdminHistoryPeriodsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<HistoryPeriod | null>(null);
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialHistoryData, setInitialHistoryData] = useState<HistoryPageData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/history');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de historia');
      }

      const data = await response.json();
      setHistoryData(data.historyData);
      setInitialHistoryData(data.historyData);
    } catch (error) {
      console.error('Error al cargar datos de historia:', error);
      setError('Error al cargar datos de historia');
    } finally {
      setLoading(false);
    }
  };

  const saveHistoryData = async () => {
    if (!historyData) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar datos de historia');
      }

      const data = await response.json();
      console.log('Datos de historia guardados:', data);
      toast.success('Datos de historia guardados exitosamente');
      setInitialHistoryData(historyData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar datos de historia:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar datos de historia');
      toast.error('Error al guardar datos de historia');
    } finally {
      setSaving(false);
    }
  };

  const updateHistoryData = (updates: Partial<HistoryPageData>) => {
    setHistoryData(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(initialHistoryData));
      return updated;
    });
  };

  const addPeriod = () => {
    const newPeriod: HistoryPeriod = {
      id: `temp-${Date.now()}`, // ID temporal único para nuevos períodos
      period: '',
      title: '',
      description: '',
      image: '',
      highlights: [],
      order: 0, // Se asignará automáticamente al guardar
    };
    setEditingPeriod(newPeriod);
    setEditingPeriodIndex(null); // null indica que es un período nuevo
    setShowForm(true);
    setNewHighlight(''); // Limpiar el campo de highlights
  };

  const editPeriod = (period: HistoryPeriod, index: number) => {
    setEditingPeriod({ ...period });
    setEditingPeriodIndex(index); // Guardar el índice del período que se está editando
    setShowForm(true);
    setNewHighlight(''); // Limpiar el campo de highlights
  };

  const confirmDeletePeriod = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const deletePeriod = async (index: number) => {
    if (!historyData || index < 0 || index >= historyData.periods.length) {
      toast.error('Índice de período inválido');
      return;
    }
    
    try {
      setSaving(true);
      
      // Crear una copia del array y eliminar el período en el índice especificado
      const updatedPeriods = historyData.periods.filter((_, i) => i !== index);
      
      // Reasignar órdenes para mantener la secuencia
      const reorderedPeriods = updatedPeriods.map((period, newIndex) => ({
        ...period,
        order: newIndex + 1
      }));
      
      const updatedHistoryData = { ...historyData, periods: reorderedPeriods };
      setHistoryData(updatedHistoryData);

      console.log('Eliminando período en índice:', index);
      console.log('Períodos restantes:', reorderedPeriods);

      // Guardar en Firebase
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el período');
      }

      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      setShowDeleteConfirm(null);
      toast.success('Período eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar período:', error);
      toast.error(error.message || 'Error al eliminar el período');
      // Revertir cambios en caso de error
      setHistoryData(historyData);
    } finally {
      setSaving(false);
    }
  };

  const savePeriod = async () => {
    if (!editingPeriod || !historyData) return;

    // Validar campos requeridos
    if (!editingPeriod.period.trim() || !editingPeriod.title.trim() || !editingPeriod.description.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      // Crear una copia del array de periodos
      const updatedPeriods = [...historyData.periods];
      
      if (editingPeriodIndex === null) {
        // Es un período nuevo - usar push() para agregarlo al final
        const newPeriod = { 
          ...editingPeriod,
          order: updatedPeriods.length + 1 // Asignar orden automáticamente
        };
        delete newPeriod.id; // Remover ID temporal
        updatedPeriods.push(newPeriod);
        
        console.log('Agregando nuevo período:', newPeriod);
      } else {
        // Es un período existente - actualizar en su posición específica
        if (editingPeriodIndex >= 0 && editingPeriodIndex < updatedPeriods.length) {
          // Mantener el orden original del período existente
          const originalOrder = updatedPeriods[editingPeriodIndex].order;
          const updatedPeriod = { 
            ...editingPeriod, 
            order: originalOrder 
          };
          
          // Reemplazar SOLO el período en la posición específica
          updatedPeriods[editingPeriodIndex] = updatedPeriod;
          
          console.log(`Actualizando período en índice ${editingPeriodIndex}:`, updatedPeriod);
          console.log('Array completo después de actualizar:', updatedPeriods);
        } else {
          throw new Error('Índice de período inválido para edición');
        }
      }

      const updatedHistoryData = { ...historyData, periods: updatedPeriods };
      setHistoryData(updatedHistoryData);

      // Guardar en Firebase
      const response = await fetch('/api/admin/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHistoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el período');
      }

      // Cerrar modal y limpiar estado
      setShowForm(false);
      setEditingPeriod(null);
      setEditingPeriodIndex(null);
      setInitialHistoryData(updatedHistoryData);
      setHasChanges(false);
      
      toast.success('Período guardado exitosamente');
    } catch (error: any) {
      console.error('Error al guardar período:', error);
      toast.error(error.message || 'Error al guardar el período');
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    if (!newHighlight.trim() || !editingPeriod) return;
    
    setEditingPeriod({
      ...editingPeriod,
      highlights: [...editingPeriod.highlights, newHighlight.trim()]
    });
    setNewHighlight('');
  };

  const removeHighlight = (index: number) => {
    if (!editingPeriod) return;
    
    setEditingPeriod({
      ...editingPeriod,
      highlights: editingPeriod.highlights.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando períodos históricos...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 sm:py-6 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/admin/history"
                  className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Volver a Historia
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Períodos Históricos</h1>
                  <p className="text-sm sm:text-base text-gray-600">Gestiona los períodos de la historia de Calle Jerusalén</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <UserMenu />
                {hasChanges && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">Cambios sin guardar</span>
                    </div>
                    <button
                      onClick={saveHistoryData}
                      disabled={saving}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Lista de Períodos */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Períodos Configurados</h2>
              <button
                onClick={addPeriod}
                disabled={saving}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Período
              </button>
            </div>

            <div className="space-y-4">
              {historyData?.periods.map((period, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 w-fit">
                          {period.period}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                          #{period.order}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{period.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-3 break-words overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        maxHeight: '4.2em'
                      }}>
                        {period.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          {period.highlights.length} puntos destacados
                        </span>
                        {period.image && (
                          <span className="flex items-center text-green-600">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            Con imagen
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4 lg:flex-shrink-0">
                      <button
                        onClick={() => editPeriod(period, index)}
                        disabled={saving}
                        className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        title="Editar período"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDeletePeriod(index)}
                        disabled={saving}
                        className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        title="Eliminar período"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {historyData?.periods.length === 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No hay períodos configurados</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">Agrega el primer período histórico para comenzar</p>
                  <button
                    onClick={addPeriod}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Período
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Edición */}
          {showForm && editingPeriod && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
                <div className="p-4 sm:p-6">
                  {/* Header del Modal */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {editingPeriodIndex === null ? 'Nuevo Período Histórico' : 'Editar Período Histórico'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {editingPeriodIndex === null 
                          ? 'Agrega un nuevo período a la historia de Calle Jerusalén'
                          : 'Modifica la información del período seleccionado'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>

                  {/* Formulario en una sola columna */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Período */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Período <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingPeriod.period}
                        onChange={(e) => setEditingPeriod({ ...editingPeriod, period: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Fundación (1950-1960)"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre del período histórico</p>
                    </div>

                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingPeriod.title}
                        onChange={(e) => setEditingPeriod({ ...editingPeriod, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="Ej: Los Primeros Pobladores"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Título descriptivo del período</p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editingPeriod.description}
                        onChange={(e) => setEditingPeriod({ ...editingPeriod, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white resize-none"
                        placeholder="Descripción detallada del período histórico..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Descripción completa del período</p>
                    </div>

                    {/* URL de Imagen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL de Imagen
                      </label>
                      <input
                        type="url"
                        value={editingPeriod.image}
                        onChange={(e) => setEditingPeriod({ ...editingPeriod, image: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">URL de la imagen representativa (opcional)</p>
                    </div>

                    {/* Puntos Destacados */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puntos Destacados
                      </label>
                      
                      {/* Lista de highlights existentes */}
                      {editingPeriod.highlights.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 sm:p-3 bg-gray-50">
                          {editingPeriod.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                              <span className="flex-1 text-xs sm:text-sm text-gray-700 break-words">{highlight}</span>
                              <button
                                onClick={() => removeHighlight(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                title="Eliminar punto destacado"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para agregar nuevo highlight */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                          placeholder="Nuevo punto destacado..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addHighlight();
                            }
                          }}
                        />
                        <button
                          onClick={addHighlight}
                          className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                          title="Agregar punto destacado"
                        >
                          <Plus className="w-4 h-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden text-sm">Agregar</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Agrega puntos clave del período (opcional)</p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={savePeriod}
                      disabled={saving}
                      className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Guardar Período
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmación de Eliminación */}
          {showDeleteConfirm !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
                        Confirmar eliminación
                      </h3>
                    </div>
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <p className="text-sm text-gray-600">
                      ¿Estás seguro de que quieres eliminar este período histórico? Esta acción no se puede deshacer.
                    </p>
                    {historyData?.periods[showDeleteConfirm] && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-900">
                          {historyData.periods[showDeleteConfirm].period}
                        </p>
                        <p className="text-sm text-gray-600">
                          {historyData.periods[showDeleteConfirm].title}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => deletePeriod(showDeleteConfirm)}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </>
                      )}
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

export default AdminHistoryPeriodsPage;
