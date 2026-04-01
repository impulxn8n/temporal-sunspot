import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { useNavigate } from 'react-router-dom';
import { Save, X, DollarSign, Calendar } from 'lucide-react';
import type { Unidad, TipoMovimiento, EstadoMovimiento, Impacto } from '../types';

export const POSForm: React.FC = () => {
  const { addMovimiento } = useFinance();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    unidad: 'SM DIGITALS' as Unidad,
    tipo_movimiento: 'Ingreso' as TipoMovimiento,
    categoria: '',
    subcategoria: '',
    cliente_proveedor: '',
    descripcion: '',
    metodo_pago: '',
    monto: 0,
    recurrente: false,
    estado: 'Pagado' as EstadoMovimiento,
    impacto: 'Core' as Impacto,
    cuenta: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMovimiento(formData);
    navigate('/movimientos');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="text-indigo-400" />
            POS SIMPLE
          </h2>
          <p className="text-slate-400 text-sm mt-1">Registro rápido de movimiento financiero</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="date"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={formData.monto || ''}
                  onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidad</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                value={formData.unidad}
                onChange={e => setFormData({ ...formData, unidad: e.target.value as Unidad })}
              >
                <option value="SM DIGITALS">SM DIGITALS</option>
                <option value="Marca Personal">Marca Personal</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                value={formData.tipo_movimiento}
                onChange={e => setFormData({ ...formData, tipo_movimiento: e.target.value as TipoMovimiento })}
              >
                <option value="Ingreso">Ingreso</option>
                <option value="Gasto">Gasto</option>
                <option value="Inversión">Inversión</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente / Proveedor</label>
            <input
              type="text"
              required
              placeholder="Nombre de la entidad"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              value={formData.cliente_proveedor}
              onChange={e => setFormData({ ...formData, cliente_proveedor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalle del movimiento..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <X size={20} />
              CANCELAR
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              GUARDAR MOVIMIENTO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
