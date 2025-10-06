'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { AlertTriangle, MapPin, Save, Image as ImageIcon, List, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmergencyForm {
  title: string;
  subtitle: string;
  description: string;
  safeAreaName: string;
  safeAreaAddress: string;
  imageUrl: string;
  tips: string[];
  instructions: string[];
  map: { lat: number; lng: number; zoom?: number };
  isActive: boolean;
}

const AdminEmergencyPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmergencyForm>({
    title: 'Área Segura de Reunión',
    subtitle: 'Punto de reunión en caso de siniestro o catástrofe',
    description: '',
    safeAreaName: '',
    safeAreaAddress: '',
    imageUrl: '',
    tips: [],
    instructions: [],
    map: { lat: 0, lng: 0, zoom: 16 },
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/emergency');
        if (res.ok) {
          const data = await res.json();
          if (data?.emergency) {
            setForm({
              title: data.emergency.title || '',
              subtitle: data.emergency.subtitle || '',
              description: data.emergency.description || '',
              safeAreaName: data.emergency.safeAreaName || '',
              safeAreaAddress: data.emergency.safeAreaAddress || '',
              imageUrl: data.emergency.imageUrl || '',
              tips: data.emergency.tips || [],
              instructions: data.emergency.instructions || [],
              map: data.emergency.map || { lat: 0, lng: 0, zoom: 16 },
              isActive: data.emergency.isActive !== false,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateField = (field: keyof EmergencyForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'tips' | 'instructions', value: string) => {
    if (!value.trim()) return;
    setForm(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
  };

  const removeFromArray = (field: 'tips' | 'instructions', index: number) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/emergency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      toast.success('Información de emergencia guardada');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800">No tienes permiso para editar esta sección.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Área Segura / Información de Emergencia</h1>
        </div>

        {loading ? (
          <div className="p-6 bg-white rounded-xl border flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            <span>Cargando...</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-6 space-y-6 text-gray-900">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.title} onChange={e => updateField('title', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea className="w-full border rounded px-3 py-2 text-gray-900 bg-white" rows={3} value={form.description} onChange={e => updateField('description', e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Área Segura</label>
                <input className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.safeAreaName} onChange={e => updateField('safeAreaName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del Área Segura</label>
                <input className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.safeAreaAddress} onChange={e => updateField('safeAreaAddress', e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                <input type="number" step="any" className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.map.lat} onChange={e => updateField('map', { ...form.map, lat: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                <input type="number" step="any" className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.map.lng} onChange={e => updateField('map', { ...form.map, lng: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                <input type="number" className="w-full border rounded px-3 py-2 text-gray-900 bg-white" value={form.map.zoom || 16} onChange={e => updateField('map', { ...form.map, zoom: parseInt(e.target.value || '16', 10) })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL)</label>
              <div className="flex gap-2">
                <input className="flex-1 border rounded px-3 py-2 text-gray-900 bg-white" value={form.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} />
                <div className="w-16 h-16 border rounded flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <List className="w-4 h-4" />
                  <h3 className="font-semibold text-gray-900">Consejos</h3>
                </div>
                <div className="space-y-2">
                  {form.tips.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 border rounded px-3 py-2 text-gray-900 bg-white" value={t} onChange={e => {
                        const v = e.target.value;
                        setForm(prev => ({ ...prev, tips: prev.tips.map((x, idx) => (idx === i ? v : x)) }));
                      }} />
                      <button className="px-3 py-2 bg-red-50 text-red-700 border rounded" onClick={e => { e.preventDefault(); removeFromArray('tips', i); }}>Quitar</button>
                    </div>
                  ))}
                  <button className="px-3 py-2 border rounded" onClick={e => { e.preventDefault(); addToArray('tips', ''); }}>Agregar consejo</button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  <h3 className="font-semibold text-gray-900">Indicaciones</h3>
                </div>
                <div className="space-y-2">
                  {form.instructions.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 border rounded px-3 py-2 text-gray-900 bg-white" value={t} onChange={e => {
                        const v = e.target.value;
                        setForm(prev => ({ ...prev, instructions: prev.instructions.map((x, idx) => (idx === i ? v : x)) }));
                      }} />
                      <button className="px-3 py-2 bg-red-50 text-red-700 border rounded" onClick={e => { e.preventDefault(); removeFromArray('instructions', i); }}>Quitar</button>
                    </div>
                  ))}
                  <button className="px-3 py-2 border rounded" onClick={e => { e.preventDefault(); addToArray('instructions', ''); }}>Agregar indicación</button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => updateField('isActive', e.target.checked)} />
                <span className="text-sm text-gray-700">Sección activa (visible en Home)</span>
              </label>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmergencyPage;


