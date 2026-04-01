import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { Target, Zap, AlertTriangle } from 'lucide-react';

export const Presupuesto: React.FC = () => {
  const { presupuestos } = useFinance();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-200">
      <header>
        <h2 className="text-4xl font-black text-white tracking-tighter">Planificación de Gasto</h2>
        <p className="text-amber-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Control de eficiencia y optimización de capital</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {presupuestos.map((p) => {
          const percentage = (p.real / p.presupuesto) * 100;
          const isOver = p.real > p.presupuesto;

          return (
            <div key={p.id} className="bg-[#111111] border border-[#222222] p-10 rounded-[40px] hover:border-white/10 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all duration-1000" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h4 className="text-xl font-black text-white tracking-tighter mb-1 uppercase">{p.categoria}</h4>
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{p.periodo}</p>
                </div>
                <div className={`p-3 rounded-2xl border ${isOver ? 'bg-rose-500/20 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  {isOver ? <AlertTriangle size={20} className="text-rose-400" /> : <Target size={20} className="text-emerald-400" />}
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-6 bg-black/40 p-5 rounded-3xl border border-[#222222]">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Objetivo</p>
                    <p className="text-xl font-black text-white tracking-tighter">${p.presupuesto.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Ejecución Real</p>
                    <p className={`text-xl font-black tracking-tighter ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>${p.real.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Intensidad de Gasto</span>
                    <span className={`text-sm ${isOver ? 'text-rose-400 font-black' : 'text-emerald-400'}`}>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] h-3.5 rounded-full overflow-hidden border border-[#222222]">
                    <div 
                      className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`} 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Delta Financiero</span>
                  <span className={`text-base font-black italic tracking-tight ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isOver ? '-' : '+'}${Math.abs(p.diferencia).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111111] border border-[#222222] p-12 rounded-[56px] text-center relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <div className="bg-amber-500 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
          <Zap className="text-black" size={32} strokeWidth={2.5} />
        </div>
        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Eficiencia Operativa</h3>
        <p className="text-slate-500 text-base max-w-xl mx-auto font-bold leading-relaxed mb-6">
          Actualmente el negocio mantiene una <span className="text-emerald-400">Eficiencia Púrpura</span> (15% ahorro). Estos capitales remanentes están proyectados para Reinversión en Activos de IA.
        </p>
        <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black px-10 py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px]">
          Simular Presupuesto Mes Siguiente
        </button>
      </div>
    </div>
  );
};
