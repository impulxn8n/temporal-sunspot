import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { projectCashFlow, calcularRetiroSeguro } from '../lib/projection';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle, ArrowDownCircle, Calendar } from 'lucide-react';

const RANGES = [
  { days: 7, label: '7 días' },
  { days: 15, label: '15 días' },
  { days: 30, label: '30 días' },
  { days: 60, label: '60 días' },
];

export const CashFlowProjection: React.FC = () => {
  const { movimientos, clientesMRR, deudas, proyectos, spaces, selectedView } = useFinance();
  const [days, setDays] = useState(30);

  const result = useMemo(
    () => projectCashFlow({
      movimientos,
      clientesMRR,
      deudas,
      proyectos,
      spaces,
      view: selectedView,
      days,
    }),
    [movimientos, clientesMRR, deudas, proyectos, spaces, selectedView, days]
  );

  const retiroSeguro = calcularRetiroSeguro(result, 500000);
  const isBusiness = selectedView === 'business' || spaces.find(s => s.id === selectedView)?.type === 'business';

  const chartData = [
    { label: 'Hoy', balance: result.startBalance, inflows: 0, outflows: 0 },
    ...result.points.map(p => ({ label: p.label, balance: p.balance, inflows: p.inflows, outflows: p.outflows })),
  ];

  return (
    <div className="glass-card p-6 lg:p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/5 blur-[100px] -mr-32 -mt-32" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={18} className="text-brand-secondary" />
            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter">Proyección de Caja</h3>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Considera MRR, cuotas de deuda, proyectos pendientes y gastos recurrentes
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                days === r.days
                  ? 'bg-brand-secondary/15 border-brand-secondary/40 text-brand-secondary'
                  : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Saldo Hoy</p>
          <p className="text-base lg:text-lg font-black text-white">${result.startBalance.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Saldo en {days}d</p>
          <p className={`text-base lg:text-lg font-black ${result.endBalance >= 0 ? 'text-brand-income' : 'text-brand-expense'}`}>
            ${result.endBalance.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Mínimo Proyectado</p>
          <p className={`text-base lg:text-lg font-black ${result.minBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            ${result.minBalance.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">
            {result.daysToZero ? 'Caja se agota en' : 'Caja estable'}
          </p>
          <p className={`text-base lg:text-lg font-black ${result.daysToZero ? 'text-rose-400' : 'text-brand-income'}`}>
            {result.daysToZero ? `${result.daysToZero} días` : 'OK ✓'}
          </p>
        </div>
      </div>

      <div className="h-[280px] lg:h-[320px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
            <XAxis dataKey="label" stroke="#444444" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={6} />
            <YAxis stroke="#444444" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
            <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a2b', borderRadius: '20px', padding: '12px' }}
              itemStyle={{ fontSize: '11px', fontWeight: '900' }}
              formatter={(value: any) => `$${Number(value).toLocaleString('es-CO')}`}
            />
            <Area type="monotone" dataKey="balance" stroke="var(--color-brand-secondary)" strokeWidth={3} fill="url(#colorProj)" name="Saldo proyectado" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 relative z-10">
        {result.daysToZero && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Alerta Crítica</p>
              <p className="text-xs text-slate-300 font-bold">
                Tu caja se agotará en <b>{result.daysToZero} días</b> al ritmo proyectado.
              </p>
            </div>
          </div>
        )}

        {result.minBalance < 500000 && result.minBalance > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Caja Apretada</p>
              <p className="text-xs text-slate-300 font-bold">
                Saldo bajará hasta <b>${result.minBalance.toLocaleString('es-CO')}</b> el {result.minBalanceDate}.
              </p>
            </div>
          </div>
        )}

        {isBusiness && retiroSeguro > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
            <ArrowDownCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Retiro Seguro Disponible</p>
              <p className="text-xs text-slate-300 font-bold">
                Puedes transferir hasta <b>${retiroSeguro.toLocaleString('es-CO')}</b> a Personal manteniendo $500.000 de colchón en {days}d.
              </p>
            </div>
          </div>
        )}

        {result.totalInflows > 0 && (
          <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-4 flex items-start gap-3">
            <TrendingUp size={18} className="text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Flujo Esperado</p>
              <p className="text-xs text-slate-300 font-bold">
                Entradas: <b className="text-brand-income">+${result.totalInflows.toLocaleString('es-CO')}</b> · Salidas: <b className="text-brand-expense">-${result.totalOutflows.toLocaleString('es-CO')}</b>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
