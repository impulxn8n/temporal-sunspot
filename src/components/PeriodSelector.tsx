import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export const PeriodSelector: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod, periods } = useFinance();

  const handlePrev = () => {
    const current = parseISO(`${selectedPeriod}-01`);
    setSelectedPeriod(format(subMonths(current, 1), 'yyyy-MM'));
  };

  const handleNext = () => {
    const current = parseISO(`${selectedPeriod}-01`);
    setSelectedPeriod(format(addMonths(current, 1), 'yyyy-MM'));
  };

  const displayDate = parseISO(`${selectedPeriod}-01`);

  return (
    <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 p-2 rounded-2xl backdrop-blur-sm">
      <button 
        onClick={handlePrev}
        className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-3 px-4 py-1 border-x border-slate-700/50 min-w-[180px] justify-center text-center">
        <Calendar size={18} className="text-indigo-400" />
        <span className="font-bold text-white uppercase tracking-tight">
          {format(displayDate, 'MMMM yyyy', { locale: es })}
        </span>
      </div>

      <button 
        onClick={handleNext}
        className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
      >
        <ChevronRight size={20} />
      </button>

      <select 
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {periods.map(p => (
          <option key={p} value={p}>
            {format(parseISO(`${p}-01`), 'MMM yyyy', { locale: es }).toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};
