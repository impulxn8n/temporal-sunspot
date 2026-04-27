import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard, ShieldCheck, TrendingDown, RotateCcw } from 'lucide-react';

export const Deudas: React.FC = () => {
  const { deudas, updateDebt, undoDebtPayment } = useFinance();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-200">
      <header>
        <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Deudas e Instituciones</h2>
        <p className="text-brand-primary font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1">Control de pasivos bajo plataforma SM DIGITALS</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {deudas.map((deuda) => {
          const progress = (deuda.pagado / deuda.saldo_inicial) * 100;
          return (
            <div key={deuda.id} className="glass-card rounded-[32px] lg:rounded-[48px] p-8 lg:p-10 hover:border-brand-primary/20 transition-all group relative overflow-hidden shadow-brand-primary/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-brand-primary/10 transition-all duration-700 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-8 lg:mb-10 relative z-10">
                <div className="max-w-[70%]">
                  <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter mb-2 truncate">{deuda.acreedor}</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-brand-gold" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{deuda.tipo}</p>
                  </div>
                </div>
                <div className="bg-brand-primary/10 p-3 lg:p-4 rounded-[16px] lg:rounded-[20px] border border-brand-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} className="text-brand-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 lg:gap-8 mb-8 lg:mb-10 relative z-10">
                <div className="bg-[#050508] p-5 lg:p-6 rounded-3xl border border-white/5 shadow-inner">
                  <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Pasivo Inicial</p>
                  <p className="text-xl lg:text-2xl font-black text-white tracking-tighter">${deuda.saldo_inicial.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-[#050508] p-5 lg:p-6 rounded-3xl border border-white/5 shadow-inner">
                  <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Amortización</p>
                  <p className="text-xl lg:text-2xl font-black text-brand-gold tracking-tighter">${deuda.cuota_mensual.toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-10 relative z-10">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Estado de Liquidación</span>
                  <span className="text-amber-500">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-[#0a0a0a] h-3.5 rounded-full overflow-hidden border border-[#222222]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-10 bg-[#050508]/50 p-6 rounded-[32px] border border-white/5 relative z-10">
                <div>
                  <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Pendiente</p>
                  <p className="text-2xl lg:text-3xl font-black text-white tracking-tighter">${deuda.saldo_restante.toLocaleString('es-CO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Corte</p>
                  <p className="text-xs lg:text-sm font-black text-brand-primary italic tracking-tight">{deuda.fecha_pago}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <button 
                  onClick={() => {
                    const amount = deuda.cuota_mensual > 0 
                      ? deuda.cuota_mensual 
                      : Number(window.prompt(`Monto a pagar para ${deuda.acreedor}:`, deuda.saldo_restante.toString()));
                    if (amount > 0) updateDebt(deuda.id, amount);
                  }}
                  className="w-full bg-brand-primary text-white font-black py-5 rounded-2xl hover:bg-brand-primary/80 transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  {deuda.cuota_mensual > 0 ? 'EFECTUAR PAGO DE CUOTA' : 'EFECTUAR ABONO PERSONALIZADO'}
                </button>
                <button 
                  onClick={() => {
                    const amount = deuda.cuota_mensual > 0 ? deuda.cuota_mensual : deuda.pagado;
                    undoDebtPayment(deuda.id, amount);
                  }}
                  className="w-full bg-[#111111] border border-[#222222] text-slate-500 hover:text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <RotateCcw size={14} />
                  Revertir Último Pago
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
        <div className="bg-amber-500 p-4 rounded-3xl shadow-xl shadow-amber-500/20 relative z-10">
          <TrendingDown className="text-black" size={32} strokeWidth={3} />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-white text-xl font-black tracking-tighter mb-1">Optimización de Pasivos</p>
          <p className="text-sm text-slate-500 font-bold max-w-2xl leading-relaxed">
            Tu ratio de apalancamiento se mantiene estable. Considera abonos adicionales a capital para reducir el costo financiero anualizado de tus préstamos bancarios.
          </p>
        </div>
      </div>
    </div>
  );
};
