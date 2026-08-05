import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { calcularDistribucionCliente, COSTO_OPERATIVO_DEFAULT, AHORRO_PCT_DEFAULT } from '../lib/clienteCalc';
import type { ClienteMRR, ReglaAhorro } from '../types';
import { X, Edit3, Wallet, Shield, TrendingUp } from 'lucide-react';

interface EditClienteMRRModalProps {
  cliente: ClienteMRR | null;
  open: boolean;
  onClose: () => void;
}

export const EditClienteMRRModal: React.FC<EditClienteMRRModalProps> = ({ cliente: targetCliente, open, onClose }) => {
  const { updateClienteMRR } = useFinance();

  const [cliente, setCliente] = useState('');
  const [servicio, setServicio] = useState('');
  const [valorMensual, setValorMensual] = useState<number>(0);
  const [diaCobro, setDiaCobro] = useState<number>(15);
  const [estado, setEstado] = useState<'Activo' | 'Pausado' | 'Finalizado'>('Activo');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [reglaAhorro, setReglaAhorro] = useState<ReglaAhorro>('margen_30');
  const [costoOperativo, setCostoOperativo] = useState<number>(COSTO_OPERATIVO_DEFAULT);
  const [ahorroPct, setAhorroPct] = useState<number>(AHORRO_PCT_DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (targetCliente) {
      setCliente(targetCliente.cliente);
      setServicio(targetCliente.servicio);
      setValorMensual(targetCliente.valor_mensual);
      setDiaCobro(targetCliente.dia_cobro || 15);
      setEstado(targetCliente.estado);
      setMetodoPago(targetCliente.metodo_pago || 'Transferencia');
      setReglaAhorro(targetCliente.regla_ahorro || 'margen_30');
      setCostoOperativo(targetCliente.costo_operativo ?? COSTO_OPERATIVO_DEFAULT);
      setAhorroPct(targetCliente.ahorro_pct ?? AHORRO_PCT_DEFAULT);
      setError(null);
    }
  }, [targetCliente]);

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

  if (!open || !targetCliente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!cliente.trim()) return setError('El nombre del cliente es obligatorio.');
    if (valorMensual <= 0) return setError('El valor mensual debe ser mayor a 0.');
    if (diaCobro < 1 || diaCobro > 31) return setError('El día de cobro debe estar entre 1 y 31.');

    updateClienteMRR(targetCliente.id, {
      cliente: cliente.trim(),
      servicio: servicio.trim() || 'Servicio recurrente',
      valor_mensual: valorMensual,
      dia_cobro: diaCobro,
      estado,
      metodo_pago: metodoPago,
      costo_operativo: reglaAhorro === 'pago_30' ? 0 : costoOperativo,
      regla_ahorro: reglaAhorro,
      ahorro_pct: ahorroPct,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
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
            <Edit3 size={18} className="text-brand-primary" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tighter">Editar Cliente MRR</h3>
        </div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">
          Modifica el día de cobro, monto mensual o distribución de bolsillos
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Día de cobro *</label>
              <input
                type="number"
                required
                min={1}
                max={31}
                value={diaCobro}
                onChange={e => setDiaCobro(parseInt(e.target.value) || 1)}
                className="w-full bg-[#050508] border border-amber-500/30 rounded-xl py-3 px-3 text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as any)}
                className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
              >
                <option value="Activo">Activo</option>
                <option value="Pausado">Pausado</option>
                <option value="Finalizado">Finalizado</option>
              </select>
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

          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-4">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Regla de distribución</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReglaAhorro('margen_30')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reglaAhorro === 'margen_30'
                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <p className="text-[10px] font-black uppercase">Margen (Operativo + 30%)</p>
                <p className="text-[9px] text-slate-500 mt-1">Descuenta costo fijo operativo y luego separa el 30% a Emergencia.</p>
              </button>
              <button
                type="button"
                onClick={() => setReglaAhorro('pago_30')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reglaAhorro === 'pago_30'
                    ? 'border-brand-primary bg-brand-primary/10 text-white'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <p className="text-[10px] font-black uppercase">Directo (Sin Operativo)</p>
                <p className="text-[9px] text-slate-500 mt-1">Separa el 30% del pago total directamente a Emergencia.</p>
              </button>
            </div>

            {reglaAhorro === 'margen_30' && (
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Costo operativo fijo ($)</label>
                <input
                  type="number"
                  min={0}
                  value={costoOperativo}
                  onChange={e => setCostoOperativo(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-brand-primary/50"
                />
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Distribución Estimada</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Wallet size={12} />
                <span>Operativo: <b>${distribucion.costoOperativo.toLocaleString('es-CO')}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <Shield size={12} />
                <span>Emergencia: <b>${distribucion.ahorro.toLocaleString('es-CO')}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <TrendingUp size={12} />
                <span>Libre: <b>${distribucion.dineroLibre.toLocaleString('es-CO')}</b></span>
              </div>
            </div>
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
              className="flex-1 bg-white/5 border border-white/5 text-slate-400 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-all shadow-lg shadow-brand-primary/20"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
