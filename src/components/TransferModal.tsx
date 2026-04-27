import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowLeftRight, X, ArrowRight } from 'lucide-react';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ open, onClose }) => {
  const { spaces, addTransferencia, balancesBySpace } = useFinance();
  const visibleSpaces = spaces.filter(s => !s.archived);

  const [fromSpaceId, setFromSpaceId] = useState(visibleSpaces[0]?.id ?? '');
  const [toSpaceId, setToSpaceId] = useState(visibleSpaces[1]?.id ?? '');
  const [monto, setMonto] = useState<number>(0);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const fromSpace = spaces.find(s => s.id === fromSpaceId);
  const toSpace = spaces.find(s => s.id === toSpaceId);
  const fromBalance = balancesBySpace[fromSpaceId]?.balance ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      addTransferencia({
        fromSpaceId,
        toSpaceId,
        monto,
        fecha,
        descripcion: descripcion.trim() || undefined,
      });
      setMonto(0);
      setDescripcion('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-[32px] w-full max-w-lg p-8 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-brand-primary/15 p-2.5 rounded-2xl border border-brand-primary/30">
            <ArrowLeftRight size={18} className="text-brand-primary" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Transferencia Interna</h3>
        </div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">
          No afecta utilidad — solo mueve dinero entre espacios
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* From → To visual */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Desde</label>
              <select
                value={fromSpaceId}
                onChange={e => setFromSpaceId(e.target.value)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              >
                {visibleSpaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-slate-600 font-bold">
                Balance: <span className="text-slate-400">${fromBalance.toLocaleString('es-CO')}</span>
              </p>
            </div>

            <ArrowRight size={20} className="text-brand-primary mt-6" />

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hacia</label>
              <select
                value={toSpaceId}
                onChange={e => setToSpaceId(e.target.value)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              >
                {visibleSpaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={monto || ''}
                  onChange={e => setMonto(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Descripción (opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Retiro mensual de utilidades"
              className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
            />
          </div>

          {fromSpace && toSpace && monto > 0 && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 text-[11px] text-slate-300 font-bold">
              <p>
                Saldrán <b className="text-brand-expense">${monto.toLocaleString('es-CO')}</b> de <b style={{ color: fromSpace.color }}>{fromSpace.name}</b>
                {' → '}
                entrarán a <b style={{ color: toSpace.color }}>{toSpace.name}</b>.
              </p>
              <p className="text-slate-500 mt-1 text-[10px]">Tu utilidad NO cambia. Solo el balance por espacio.</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-[11px] text-rose-300 font-bold">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={fromSpaceId === toSpaceId || monto <= 0}
              className="flex-[2] bg-brand-primary text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
            >
              Confirmar Transferencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
