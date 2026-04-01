import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PeriodSelector } from './PeriodSelector';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

export const TransactionsList: React.FC = () => {
  const { filteredMovimientos } = useFinance();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-200">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Libro de Filtros</h2>
          <p className="text-brand-gold font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1">Auditoría centralizada de flujo de capital</p>
        </div>
        <div className="bg-[#0a0a0f] border border-white/5 p-2 rounded-2xl flex items-center shadow-2xl">
          <PeriodSelector />
        </div>
      </header>

      <div className="glass-card rounded-[32px] lg:rounded-[40px] overflow-hidden shadow-2xl relative shadow-black/40">
        <div className="p-6 lg:p-8 border-b border-white/5 bg-black/20 flex items-center gap-4">
          <Search className="text-slate-600" size={18} />
          <input type="text" placeholder="BUSCAR TRANSACCIÓN..." className="bg-transparent border-none outline-none text-[10px] lg:text-xs font-black tracking-widest text-white w-full placeholder:text-slate-700" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0a0a0a]">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Fecha</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Entidad / Concepto</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Monto</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovimientos.length > 0 ? (
                filteredMovimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((mov) => {
                  const isIncome = mov.tipo_movimiento === 'Ingreso';
                  return (
                    <tr key={mov.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 lg:px-8 py-4 lg:py-6 whitespace-nowrap text-[10px] lg:text-[11px] text-slate-500 font-black uppercase tracking-tighter">
                        {format(new Date(mov.fecha), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-6 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="text-sm lg:text-base font-black text-white tracking-tighter group-hover:text-brand-primary transition-colors uppercase truncate max-w-[180px] lg:max-w-none">{mov.cliente_proveedor}</span>
                          <span className="text-[10px] lg:text-[11px] text-slate-500 font-bold italic tracking-tight truncate max-w-[180px] lg:max-w-none">{mov.descripcion}</span>
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                            <span className="bg-white/5 text-slate-500 text-[8px] px-2.5 py-1 rounded-md uppercase font-black border border-white/5 whitespace-nowrap">{mov.categoria}</span>
                            <span className="bg-brand-primary/10 text-brand-primary text-[8px] px-2.5 py-1 rounded-md uppercase font-black border border-brand-primary/20 whitespace-nowrap">{mov.unidad}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md ${isIncome ? 'bg-brand-income/10' : 'bg-brand-expense/10'}`}>
                            {isIncome ? <ArrowUpRight size={14} className="text-brand-income" /> : <ArrowDownRight size={14} className="text-brand-expense" />}
                          </div>
                          <span className={`font-black text-base lg:text-lg tracking-tighter ${isIncome ? 'text-brand-income' : 'text-brand-expense'}`}>
                            {isIncome ? '+' : '-'} ${mov.monto.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-6">
                        <span className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-[0.15em] border ${
                          mov.estado === 'Pagado' ? 'bg-brand-income/10 text-brand-income border-brand-income/20' :
                          mov.estado === 'Pendiente' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                          'bg-slate-800/10 text-slate-500 border-slate-700/20'
                        }`}>
                          {mov.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Search size={48} className="text-slate-600" />
                      <div>
                        <p className="text-white font-black uppercase tracking-[0.4em]">Sin Registros</p>
                        <p className="text-slate-500 text-[10px] mt-2 italic font-bold">No se detectaron transacciones para este ciclo financiero.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
