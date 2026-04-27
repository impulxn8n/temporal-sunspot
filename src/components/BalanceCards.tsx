import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowLeftRight } from 'lucide-react';

export const BalanceCards: React.FC = () => {
  const { spaces, balancesBySpace, globalBalance, selectedView } = useFinance();

  if (selectedView === 'global') {
    const visibleSpaces = spaces.filter(s => !s.archived);
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 lg:p-8 rounded-[32px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] -mr-32 -mt-32" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Wallet size={18} className="text-brand-primary" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Patrimonio Total (Global)</p>
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter relative z-10">
            ${globalBalance.balance.toLocaleString('es-CO')}
          </h2>
          <div className="flex flex-wrap gap-6 mt-4 relative z-10">
            <span className="text-[11px] text-brand-income font-black flex items-center gap-1">
              <ArrowUpRight size={12} /> Ingresos: ${globalBalance.income.toLocaleString('es-CO')}
            </span>
            <span className="text-[11px] text-brand-expense font-black flex items-center gap-1">
              <ArrowDownRight size={12} /> Gastos: ${globalBalance.expenses.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleSpaces.map(s => {
            const b = balancesBySpace[s.id];
            if (!b) return null;
            return (
              <div
                key={s.id}
                className="glass-card p-6 rounded-[24px] relative overflow-hidden"
                style={{ borderColor: `${s.color}30` }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 opacity-30"
                  style={{ backgroundColor: s.color }}
                />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: s.color }}>
                    {s.name}
                  </p>
                  <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">
                    {s.type === 'business' ? 'Negocio' : 'Personal'}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter relative z-10">
                  ${b.balance.toLocaleString('es-CO')}
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] relative z-10">
                  <span className="text-brand-income font-black">+${b.income.toLocaleString('es-CO')}</span>
                  <span className="text-brand-expense font-black text-right">-${b.expenses.toLocaleString('es-CO')}</span>
                </div>
                {(b.transfersIn > 0 || b.transfersOut > 0) && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">
                    <span className="flex items-center gap-1">
                      <ArrowLeftRight size={10} /> Net transf
                    </span>
                    <span className={b.transfersIn - b.transfersOut >= 0 ? 'text-brand-income' : 'text-brand-expense'}>
                      {b.transfersIn - b.transfersOut >= 0 ? '+' : ''}
                      ${(b.transfersIn - b.transfersOut).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista de un grupo (personal/business) o espacio individual
  let aggregated = { income: 0, expenses: 0, transfersIn: 0, transfersOut: 0, balance: 0 };
  let title = '';
  let color = '#3B82F6';

  if (selectedView === 'personal' || selectedView === 'business') {
    const filterType = selectedView === 'personal' ? 'personal' : 'business';
    const matchingSpaces = spaces.filter(s => s.type === filterType && !s.archived);
    title = filterType === 'personal' ? 'Patrimonio Personal' : 'Patrimonio Negocio';
    color = filterType === 'personal' ? '#3B82F6' : '#10B981';

    for (const sp of matchingSpaces) {
      const b = balancesBySpace[sp.id];
      if (!b) continue;
      aggregated.income += b.income;
      aggregated.expenses += b.expenses;
      aggregated.transfersIn += b.transfersIn;
      aggregated.transfersOut += b.transfersOut;
    }
    aggregated.balance = aggregated.income - aggregated.expenses + aggregated.transfersIn - aggregated.transfersOut;
  } else {
    const sp = spaces.find(s => s.id === selectedView);
    const b = balancesBySpace[selectedView];
    if (sp && b) {
      title = `Balance ${sp.name}`;
      color = sp.color;
      aggregated = { ...b };
    }
  }

  return (
    <div className="glass-card p-6 lg:p-8 rounded-[32px] relative overflow-hidden" style={{ borderColor: `${color}30` }}>
      <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 opacity-20" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <Wallet size={18} style={{ color }} />
        <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color }}>{title}</p>
      </div>
      <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter relative z-10">
        ${aggregated.balance.toLocaleString('es-CO')}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 relative z-10">
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Ingresos</p>
          <p className="text-sm font-black text-brand-income">${aggregated.income.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Gastos</p>
          <p className="text-sm font-black text-brand-expense">${aggregated.expenses.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Transf. IN</p>
          <p className="text-sm font-black text-emerald-400">+${aggregated.transfersIn.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Transf. OUT</p>
          <p className="text-sm font-black text-amber-400">-${aggregated.transfersOut.toLocaleString('es-CO')}</p>
        </div>
      </div>
    </div>
  );
};
