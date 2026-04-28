import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Plus, CheckCircle, Clock, DollarSign, Trash2 } from 'lucide-react';

interface AddCuentaModalProps {
  open: boolean;
  onClose: () => void;
}

const AddCuentaModal: React.FC<AddCuentaModalProps> = ({ open, onClose }) => {
  const { addCuentaPorCobrar } = useFinance();
  const [cliente, setCliente] = useState('');
  const [monto, setMonto] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!cliente.trim()) return setError('El nombre del cliente es obligatorio.');
    if (monto <= 0) return setError('El monto debe ser mayor a 0.');

    addCuentaPorCobrar({
      cliente: cliente.trim(),
      monto,
      descripcion: descripcion.trim() || 'Servicio profesional',
      fecha_emision: new Date().toISOString().split('T')[0],
      estado: 'Pendiente',
      monto_cobrado: 0,
    });

    setCliente('');
    setMonto(0);
    setDescripcion('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-[32px] w-full max-w-md p-8 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-500/15 p-2.5 rounded-2xl border border-emerald-500/30">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Registrar Cobro Pendiente</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cliente *</label>
            <input
              type="text"
              required
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Ej: Juan Tasama"
              className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monto *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black">$</span>
              <input
                type="number"
                required
                min={1}
                value={monto || ''}
                onChange={e => setMonto(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Servicio profesional"
              className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-[11px] text-rose-300 font-bold">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600/80 transition-all shadow-lg shadow-emerald-600/20"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CuentasPorCobrar: React.FC = () => {
  const { cuentasPorCobrar, marcarCuentaPorCobrar, removeCuentaPorCobrar } = useFinance();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPendiente = cuentasPorCobrar
    .filter(c => c.estado === 'Pendiente')
    .reduce((sum, c) => sum + c.monto, 0);

  const totalCobrado = cuentasPorCobrar.reduce((sum, c) => sum + c.monto_cobrado, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/15 p-2.5 rounded-2xl border border-emerald-500/30">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Cuentas por Cobrar</h3>
            <p className="text-[9px] text-slate-500 font-bold">Dinero que te deben</p>
          </div>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Resumen */}
      {cuentasPorCobrar.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendiente</p>
            <p className="text-lg font-black text-emerald-400">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cobrado</p>
            <p className="text-lg font-black text-emerald-400">${totalCobrado.toLocaleString('es-CO')}</p>
          </div>
        </div>
      )}

      {/* Lista de cuentas */}
      <div className="space-y-2">
        {cuentasPorCobrar.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-[11px] font-bold">No hay cuentas por cobrar</p>
          </div>
        ) : (
          cuentasPorCobrar.map(cuenta => (
            <div
              key={cuenta.id}
              className="bg-slate-800/20 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{cuenta.cliente}</p>
                  <p className="text-[9px] text-slate-500 font-bold">{cuenta.descripcion}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cuenta.estado === 'Cobrado' && <CheckCircle size={16} className="text-emerald-400" />}
                  {cuenta.estado === 'Pendiente' && <Clock size={16} className="text-amber-400" />}
                  {cuenta.estado === 'Parcial' && <Clock size={16} className="text-blue-400" />}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">${cuenta.monto.toLocaleString('es-CO')}</span>
                <button
                  onClick={() => setExpandedId(expandedId === cuenta.id ? null : cuenta.id)}
                  className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                >
                  {expandedId === cuenta.id ? 'Cerrar' : 'Marcar cobro'}
                </button>
              </div>

              {expandedId === cuenta.id && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900/50 rounded-xl overflow-hidden">
                      <div
                        className="bg-emerald-500/40 h-2 transition-all"
                        style={{ width: `${(cuenta.monto_cobrado / cuenta.monto) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">
                      {Math.round((cuenta.monto_cobrado / cuenta.monto) * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[cuenta.monto * 0.25, cuenta.monto * 0.5, cuenta.monto].map((amount, i) => (
                      <button
                        key={i}
                        onClick={() => marcarCuentaPorCobrar(cuenta.id, amount)}
                        className="text-[9px] font-black bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg hover:bg-emerald-600/30 transition-all"
                      >
                        +${(amount / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => removeCuentaPorCobrar(cuenta.id)}
                    className="w-full text-[9px] font-black bg-rose-500/10 border border-rose-500/30 text-rose-400 py-2 rounded-lg hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AddCuentaModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};
