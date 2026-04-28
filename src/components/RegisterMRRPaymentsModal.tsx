import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Check, DollarSign } from 'lucide-react';

interface RegisterMRRPaymentsModalProps {
  open: boolean;
  onClose: () => void;
}

export const RegisterMRRPaymentsModal: React.FC<RegisterMRRPaymentsModalProps> = ({ open, onClose }) => {
  const { clientesMRR, registerMRRPayment } = useFinance();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activos = useMemo(() => clientesMRR.filter(c => c.estado === 'Activo'), [clientesMRR]);

  const totalSeleccionado = useMemo(() => {
    return Array.from(selectedIds).reduce((sum, id) => {
      const cliente = activos.find(c => c.id === id);
      return sum + (cliente?.valor_mensual || 0);
    }, 0);
  }, [selectedIds, activos]);

  if (!open) return null;

  const toggleClient = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleRegisterAll = () => {
    selectedIds.forEach(id => registerMRRPayment(id));
    setSelectedIds(new Set());
    onClose();
  };

  const toggleAll = () => {
    if (selectedIds.size === activos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activos.map(c => c.id)));
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-[32px] w-full max-w-2xl p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-primary/15 p-2.5 rounded-2xl border border-brand-primary/30">
            <DollarSign size={18} className="text-brand-primary" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Registrar Cobros de Hoy</h3>
        </div>

        {activos.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-[11px] font-bold">No hay clientes activos</p>
          </div>
        ) : (
          <>
            {/* Header con seleccionar todo */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === activos.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border border-white/20 bg-white/5 accent-brand-primary"
                />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Seleccionar todo ({activos.length})
                </span>
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Lista de clientes */}
            <div className="space-y-2 mb-6">
              {activos.map(cliente => (
                <label
                  key={cliente.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(cliente.id)}
                    onChange={() => toggleClient(cliente.id)}
                    className="w-4 h-4 rounded border border-white/20 bg-white/5 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-black text-white">{cliente.cliente}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{cliente.servicio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-brand-primary">
                      ${cliente.valor_mensual.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">Día {cliente.dia_cobro}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Resumen */}
            {selectedIds.size > 0 && (
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">
                  Total a registrar
                </p>
                <p className="text-2xl font-black text-white">
                  ${totalSeleccionado.toLocaleString('es-CO')}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterAll}
                disabled={selectedIds.size === 0}
                className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={14} />
                Registrar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
