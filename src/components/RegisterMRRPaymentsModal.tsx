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
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [shouldDistribute, setShouldDistribute] = useState(false);

  const activos = useMemo(() => clientesMRR.filter(c => c.estado === 'Activo'), [clientesMRR]);

  const totalSeleccionado = useMemo(() => {
    return Array.from(selectedIds).reduce((sum, id) => {
      const cliente = activos.find(c => c.id === id);
      if (!cliente) return sum;
      const amount = customAmounts[id] !== undefined ? customAmounts[id] : cliente.valor_mensual;
      return sum + amount;
    }, 0);
  }, [selectedIds, activos, customAmounts]);

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
    selectedIds.forEach(id => {
      const amount = customAmounts[id];
      registerMRRPayment(id, shouldDistribute, amount);
    });
    setSelectedIds(new Set());
    setCustomAmounts({});
    onClose();
  };

  const handleAmountChange = (id: string, val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    setCustomAmounts(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
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
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all"
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
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
                  </label>
                  <div className="text-right flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                      <input
                        type="text"
                        value={(customAmounts[cliente.id] !== undefined ? customAmounts[cliente.id] : cliente.valor_mensual).toLocaleString('es-CO')}
                        onChange={(e) => handleAmountChange(cliente.id, e.target.value)}
                        className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-black rounded-lg pl-5 pr-2 py-1 text-sm w-28 text-right outline-none focus:border-brand-primary/50"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold w-12 text-center">Día {cliente.dia_cobro}</p>
                  </div>
                </div>
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

            {/* Toggle Distribuir */}
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldDistribute}
                  onChange={e => setShouldDistribute(e.target.checked)}
                  className="w-4 h-4 rounded border border-white/20 bg-white/5 accent-brand-primary"
                />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Distribuir en bolsillos (150k costos + 30% emergencia)
                </span>
              </label>
            </div>

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
