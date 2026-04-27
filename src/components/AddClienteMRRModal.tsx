import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { calcularDistribucionCliente, COSTO_OPERATIVO_DEFAULT, AHORRO_PCT_DEFAULT } from '../lib/clienteCalc';
import type { ReglaAhorro } from '../types';
import { X, UserPlus, Wallet, Shield, TrendingUp } from 'lucide-react';

interface AddClienteMRRModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddClienteMRRModal: React.FC<AddClienteMRRModalProps> = ({ open, onClose }) => {
  const { addClienteMRR } = useFinance();

  const [cliente, setCliente] = useState('');
  const [servicio, setServicio] = useState('');
  const [valorMensual, setValorMensual] = useState<number>(0);
  const [diaCobro, setDiaCobro] = useState<number>(15);
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [reglaAhorro, setReglaAhorro] = useState<ReglaAhorro>('margen_30');
  const [costoOperativo, setCostoOperativo] = useState<number>(COSTO_OPERATIVO_DEFAULT);
  const [ahorroPct, setAhorroPct] = useState<number>(AHORRO_PCT_DEFAULT);
  const [error, setError] = useState<string | null>(null);

  const distribucion = useMemo(
    () =>
      calcularDistribucionCliente({
        valor_mensual: valorMensual,
        costo_operativo: reglaAhorro === 'pago_30' ? 0 : costoOperativo,
        regla_ahorro: reglaAhorro,
        ahorro_pct: ahorroPct,
      }),
    [valorMensual, costoOperativo, reglaAhorro, ahorroPct]
  );

  if (!open) return null;

  const reset = () => {
    setCliente(''); setServicio(''); setValorMensual(0); setDiaCobro(15);
    setMetodoPago('Transferencia'); setReglaAhorro('margen_30');
    setCostoOperativo(COSTO_OPERATIVO_DEFAULT); setAhorroPct(AHORRO_PCT_DEFAULT);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!cliente.trim()) return setError('El nombre del cliente es obligatorio.');
    if (valorMensual <= 0) return setError('El valor mensual debe ser mayor a 0.');
    if (diaCobro < 1 || diaCobro > 31) return setError('El día de cobro debe estar entre 1 y 31.');

    addClienteMRR({
      cliente: cliente.trim(),
      servicio: servicio.trim() || 'Servicio recurrente',
      valor_mensual: valorMensual,
      dia_cobro: diaCobro,
      estado: 'Activo',
      fecha_inicio: new Date().toISOString().split('T')[0],
      metodo_pago: metodoPago,
      costo_operativo: reglaAhorro === 'pago_30' ? 0 : costoOperativo,
      regla_ahorro: reglaAhorro,
      ahorro_pct: ahorroPct,
    });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
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

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-brand-primary/15 p-2.5 rounded-2xl border border-brand-primary/30">
            <UserPlus size={18} className="text-brand-primary" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Nuevo Cliente Recurrente</h3>
        </div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">
          La regla calcula automáticamente cuánto va a cada bolsillo
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cliente *</label>
              <input
                type="text"
                required
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                placeholder="Ej: KP Skincare"
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Servicio</label>
              <input
                type="text"
                value={servicio}
                onChange={e => setServicio(e.target.value)}
                placeholder="Ej: IA + Soporte"
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pago mensual *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary font-black">$</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={valorMensual || ''}
                  onChange={e => setValorMensual(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Día cobro</label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaCobro}
                onChange={e => setDiaCobro(parseInt(e.target.value) || 1)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Método</label>
              <select
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              >
                <option>Transferencia</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>PSE</option>
              </select>
            </div>
          </div>

          {/* Regla de distribución */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-4">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Regla de distribución</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReglaAhorro('margen_30')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reglaAhorro === 'margen_30'
                    ? 'bg-brand-primary/10 border-brand-primary/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Estándar</p>
                <p className="text-[9px] font-bold opacity-80">Costo operativo + % del margen</p>
              </button>
              <button
                type="button"
                onClick={() => setReglaAhorro('pago_30')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reglaAhorro === 'pago_30'
                    ? 'bg-brand-secondary/10 border-brand-secondary/40 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Solo % directo</p>
                <p className="text-[9px] font-bold opacity-80">Sin costo operativo (caso Impulsy)</p>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {reglaAhorro === 'margen_30' && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Costo operativo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-black">$</span>
                    <input
                      type="number"
                      min={0}
                      value={costoOperativo}
                      onChange={e => setCostoOperativo(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#050508] border border-white/5 rounded-xl py-2.5 pl-7 pr-3 text-white text-xs focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>
              )}
              <div className={`space-y-2 ${reglaAhorro === 'pago_30' ? 'col-span-2' : ''}`}>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">% Ahorro</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ahorroPct}
                    onChange={e => setAhorroPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#050508] border border-white/5 rounded-xl py-2.5 pl-3 pr-7 text-white text-xs focus:outline-none focus:border-rose-400/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 font-black">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview en vivo */}
          {valorMensual > 0 && (
            <div className="bg-gradient-to-br from-brand-primary/5 to-transparent border border-brand-primary/20 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3">📊 Distribución mensual</p>

              <div className="grid grid-cols-2 gap-3">
                {distribucion.costoOperativo > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                      <Wallet size={11} />
                      <p className="text-[9px] font-black uppercase tracking-widest">Bolsillo Operativo</p>
                    </div>
                    <p className="text-base font-black text-white">${distribucion.costoOperativo.toLocaleString('es-CO')}</p>
                  </div>
                )}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                    <Shield size={11} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Bolsillo Emergencia</p>
                  </div>
                  <p className="text-base font-black text-white">${distribucion.ahorro.toLocaleString('es-CO')}</p>
                </div>
                <div className={`bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 ${distribucion.costoOperativo === 0 ? '' : 'col-span-2'}`}>
                  <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                    <TrendingUp size={11} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Dinero Libre</p>
                  </div>
                  <p className="text-base font-black text-white">${distribucion.dineroLibre.toLocaleString('es-CO')}</p>
                </div>
              </div>

              {distribucion.margen > 0 && (
                <div className="pt-3 border-t border-white/5 flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>Margen tras costo operativo:</span>
                  <span className="text-white">${distribucion.margen.toLocaleString('es-CO')}</span>
                </div>
              )}
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
              onClick={() => { reset(); onClose(); }}
              className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-brand-primary text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
            >
              Crear Cliente Recurrente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
