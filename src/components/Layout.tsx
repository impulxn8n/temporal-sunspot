import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, Briefcase, CreditCard, PieChart, PlusCircle, Sparkles, Calendar, Trash2, Cloud, RefreshCw, Menu, X, LogOut, CloudDownload, Database, ArrowLeftRight } from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { deleteFinanceCalendar } from '../lib/googleCalendar';
import { useFinance } from '../context/FinanceContext';
import { usePrivateAccess } from '../hooks/usePrivateAccess';
import { TransferModal } from './TransferModal';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Movimientos', path: '/movimientos', icon: Receipt },
  { name: 'Clientes MRR', path: '/clientes', icon: Users },
  { name: 'Proyectos', path: '/proyectos', icon: Briefcase },
  { name: 'Deudas', path: '/deudas', icon: CreditCard },
  { name: 'Presupuesto', path: '/presupuesto', icon: PieChart },
  { name: 'Finanzita IA', path: '/finanzita', icon: Sparkles, special: true },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { login, logout, isConnected, accessToken } = useGoogleAuth();
  const { lock } = usePrivateAccess();
  const { syncAllToGoogleSheets, importAllFromGoogleSheets } = useFinance();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#050508] text-slate-200 overflow-hidden font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center">
          <span className="text-lg font-black tracking-tighter text-gradient-primary">SM DIGITALS</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col z-[60] transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8">
          <div className="mb-4">

            <div className="flex flex-col">
              <h1 className="text-xl font-black text-gradient-primary tracking-tighter leading-none">
                SM DIGITALS
              </h1>
              <p className="text-[7px] text-slate-500 mt-1 uppercase font-black tracking-[0.2em]">Plataforma Financiera Inteligente</p>
            </div>
          </div>

          {/* Google Sync Button */}
          <div className="flex gap-2">
            <button 
              onClick={isConnected ? logout : () => login()}
              className={`mt-8 flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all border ${
                isConnected 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' 
                  : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
              <Calendar size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isConnected ? 'Calendar: ON' : 'Sync Calendar'}
              </span>
            </button>
            {isConnected && (
              <>
                <button 
                  onClick={async () => {
                    if (isSyncing) return;
                    setIsSyncing(true);
                    try {
                      await syncAllToGoogleSheets(accessToken!);
                      alert(`✅ Datos SUBIDOS con éxito a Google Sheets.`);
                    } catch (e: any) {
                      alert(`❌ Error al subir: ${e.message}`);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="mt-8 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5 disabled:opacity-50"
                  title="Subir todo a Google Sheets (Push)"
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
                </button>
                <button 
                  onClick={async () => {
                    if (isSyncing) return;
                    if (!confirm('¿Descargar datos de la nube? Esto sobrescribirá tus datos locales con los de Google Sheets.')) return;
                    setIsSyncing(true);
                    try {
                      await importAllFromGoogleSheets(accessToken!);
                      alert(`✅ Datos DESCARGADOS con éxito desde Google Sheets.`);
                    } catch (e: any) {
                      alert(`❌ Error al descargar: ${e.message}`);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="mt-8 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/5 disabled:opacity-50"
                  title="Descargar todo de Google Sheets (Pull)"
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <CloudDownload size={16} />}
                </button>
                <button 
                  onClick={() => {
                    if (confirm('⚠️ ¿BORRAR TODOS LOS DATOS LOCALES?\n\nEsto reiniciará la base de datos a los valores de fábrica. Perderás los registros que no hayas subido a la nube.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="mt-8 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                  title="Reiniciar Base de Datos"
                >
                  <Database size={16} />
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('¿Borrar el calendario "Pagos Finanzita" y todos sus eventos? Podrás volver a sincronizar todo en limpio.')) {
                      const ok = await deleteFinanceCalendar(accessToken!);
                      if (ok) alert('Calendario eliminado. Ahora puedes volver a sincronizar.');
                    }
                  }}
                  className="mt-8 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                  title="Limpiar Calendario"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? (item.special ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.08)]' : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]')
                    : (item.special ? 'text-emerald-600 hover:bg-emerald-500/5 hover:text-emerald-400' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300')
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-3 border-t border-white/5">
          <Link
            to="/pos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black py-4 rounded-2xl shadow-xl shadow-amber-500/10 transition-all active:scale-95 border border-amber-500/20"
          >
            <PlusCircle size={20} />
            <span className="text-xs tracking-[0.2em] uppercase">Registrar</span>
          </Link>
          <button
            onClick={() => { setIsTransferOpen(true); setIsMobileMenuOpen(false); }}
            className="flex items-center justify-center gap-2 w-full bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-black py-3.5 rounded-2xl transition-all border border-brand-primary/20"
          >
            <ArrowLeftRight size={16} />
            <span className="text-[10px] tracking-[0.2em] uppercase">Transferir entre espacios</span>
          </button>
          <button
            onClick={() => {
              if (confirm('¿Cerrar sesión en SM DIGITALS?')) lock();
            }}
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 font-black py-4 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={16} />
            <span className="text-[10px] tracking-[0.2em] uppercase">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-10 lg:p-10 pt-24 lg:pt-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <TransferModal open={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </div>
  );
};
