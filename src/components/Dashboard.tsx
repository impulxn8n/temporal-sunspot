import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from 'lucide-react';
import { PeriodSelector } from './PeriodSelector';
import { SpaceSelector } from './SpaceSelector';
import { BalanceCards } from './BalanceCards';
import { CashFlowProjection } from './CashFlowProjection';

export const Dashboard: React.FC = () => {
  const { stats } = useFinance();

  const kpis = [
    { label: 'Ingresos Periodo', value: stats.periodIncome, icon: TrendingUp, color: 'text-brand-income', bg: 'bg-brand-income/10', border: 'border-brand-income/20', shadow: 'shadow-brand-income/5' },
    { label: 'Gastos Periodo', value: stats.periodExpenses, icon: TrendingDown, color: 'text-brand-expense', bg: 'bg-brand-expense/10', border: 'border-brand-expense/20', shadow: 'shadow-brand-expense/5' },
    { label: 'Utilidad Neta', value: stats.periodIncome - stats.periodExpenses, icon: DollarSign, color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', shadow: 'shadow-brand-primary/5' },
    { label: 'MRR Actual', value: stats.mrr, icon: Users, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', border: 'border-brand-secondary/20', shadow: 'shadow-brand-secondary/5' },
    { label: 'Deuda Total', value: stats.totalDebt, icon: AlertCircle, color: 'text-brand-gold', bg: 'bg-brand-gold/10', border: 'border-brand-gold/20', shadow: 'shadow-brand-gold/5' },
  ];

  const chartData = stats.chartData.length > 0 ? stats.chartData : [
    { name: 'N/A', ingresos: 0, gastos: 0, utilidad: 0 },
  ];

  const currentMonth = stats.chartData[stats.chartData.length - 1];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Financial Intelligence</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1">SM DIGITALS Dashboard v3.0</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-[#0a0a0f] border border-white/5 p-2 rounded-2xl flex items-center shadow-2xl">
            <SpaceSelector />
          </div>
          <div className="bg-[#0a0a0f] border border-white/5 p-2 rounded-2xl flex items-center shadow-2xl">
            <PeriodSelector />
          </div>
        </div>
      </header>

      {/* Balance Summary Section */}
      <BalanceCards />

      {/* KPI Cards (Mini stats) */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`glass-card p-6 lg:p-8 rounded-[32px] transition-all hover:bg-white/[0.03] group ${kpi.shadow}`}>
            <div className={`w-12 h-12 lg:w-14 lg:h-14 ${kpi.bg} ${kpi.border} border rounded-[20px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">{kpi.label}</p>
            <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter">${kpi.value.toLocaleString('es-CO')}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Main Chart */}
        <div className="glass-card p-6 lg:p-10 rounded-[40px] h-[400px] lg:h-[450px] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-income/5 blur-[100px] -mr-32 -mt-32" />
          <h3 className="text-lg lg:text-xl font-black text-white mb-8 tracking-tighter">Comparativa Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis dataKey="name" stroke="#444444" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#444444" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a2b', borderRadius: '20px', padding: '15px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Bar dataKey="ingresos" fill="var(--color-brand-income)" radius={[6, 6, 0, 0]} name="Ingresos" barSize={25} />
              <Bar dataKey="gastos" fill="var(--color-brand-expense)" radius={[6, 6, 0, 0]} name="Gastos" barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Evolution */}
        <div className="glass-card p-6 lg:p-10 rounded-[40px] h-[400px] lg:h-[450px] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] -mr-32 -mt-32" />
          <h3 className="text-lg lg:text-xl font-black text-white mb-8 tracking-tighter">Evolución de Utilidad Neta</h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUtilidad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis dataKey="name" stroke="#444444" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#444444" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #1a1a2b', borderRadius: '20px', padding: '15px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Area type="monotone" dataKey="utilidad" stroke="var(--color-brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorUtilidad)" name="Utilidad Neta" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intelligence Center (n8n) */}
      <div className="bg-gradient-to-r from-brand-primary/10 to-transparent border border-brand-primary/20 p-6 lg:p-10 rounded-[40px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 lg:opacity-10 group-hover:scale-150 transition-transform duration-1000 pointer-events-none">
          <TrendingUp size={120} className="text-brand-primary" />
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-liquid border border-brand-primary/30 p-2.5 rounded-2xl shadow-xl shadow-brand-primary/20">
            <Users className="text-white" size={20} />
          </div>
          <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter">Reporting Intelligence Hub</h3>
        </div>
        
        <div className="bg-black/40 rounded-3xl p-6 lg:p-10 font-mono text-xs lg:text-sm border border-white/5 relative z-10 backdrop-blur-xl">
          <p className="text-brand-primary font-black mb-6 tracking-[0.2em] border-b border-white/10 pb-4">📊 RESUMEN EJECUTIVO ({currentMonth?.name || '---'})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <div className="space-y-3">
              <p className="flex justify-between items-center text-slate-400 gap-4"><span>Ingresos Totales:</span> <b className="text-brand-income text-base lg:text-lg">${currentMonth?.ingresos?.toLocaleString('es-CO') || 0}</b></p>
              <p className="flex justify-between items-center text-slate-400 gap-4"><span>Gastos Operativos:</span> <b className="text-brand-expense text-base lg:text-lg">${currentMonth?.gastos?.toLocaleString('es-CO') || 0}</b></p>
            </div>
            <div className="space-y-3">
              <p className="flex justify-between items-center text-slate-400 gap-4"><span>Utilidad del Mes:</span> <b className="text-white text-base lg:text-lg font-black">${currentMonth?.utilidad?.toLocaleString('es-CO') || 0}</b></p>
              <p className="flex justify-between items-center text-slate-400 gap-4"><span>MRR Activo:</span> <b className="text-brand-primary text-base lg:text-lg font-black">${stats.mrr.toLocaleString('es-CO')}</b></p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-brand-income flex items-center gap-2 text-[8px] lg:text-[10px] font-black uppercase tracking-widest bg-brand-income/10 px-3 py-1.5 rounded-full border border-brand-income/20">
                <TrendingUp size={12} /> Crecimiento +
              </span>
              <span className="text-brand-primary flex items-center gap-2 text-[8px] lg:text-[10px] font-black uppercase tracking-widest bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20">
                <AlertCircle size={12} /> Deuda Estable
              </span>
            </div>
            <p className="text-slate-600 text-[8px] lg:text-[10px] font-black italic uppercase tracking-[0.2em]">Automated vía n8n & Evolution API</p>
          </div>
        </div>
      </div>

      {/* Cash Flow Projection */}
      <CashFlowProjection />
    </div>
  );
};
