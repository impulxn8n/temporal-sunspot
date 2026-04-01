import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Briefcase, Clock, CheckCircle, PlusCircle, X, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import type { Proyecto } from '../types';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { getOrCreateFinanceCalendar, createPaymentEvent } from '../lib/googleCalendar';

export const Proyectos: React.FC = () => {
  const { proyectos, addProyecto, registrarPagoProyecto } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isConnected, accessToken } = useGoogleAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);
  const [numCuotas, setNumCuotas] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [newProyecto, setNewProyecto] = useState<Omit<Proyecto, 'id'>>({
    cliente: '',
    nombre_proyecto: '',
    tipo: '',
    valor_total: 0,
    anticipo: 0,
    cobrado: 0,
    pendiente: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    estado: 'En Proceso',
    rentabilidad_estimada: 0,
    fase: 'Inicio'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    const projectId = crypto.randomUUID();
    const proyectoData = {
      ...newProyecto,
      id: projectId,
      pendiente: newProyecto.valor_total - newProyecto.cobrado
    };

    addProyecto(proyectoData);

    if (isConnected && accessToken) {
      try {
        const calendarId = await getOrCreateFinanceCalendar(accessToken);
        
        // Create installments events
        const cuotaValor = proyectoData.pendiente / numCuotas;
        const startDate = new Date(proyectoData.fecha_inicio);
        
        for (let i = 0; i < numCuotas; i++) {
          const eventDate = new Date(startDate);
          eventDate.setMonth(startDate.getMonth() + i);
          
          await createPaymentEvent(accessToken, calendarId, {
            summary: `Cobrar cuota ${i + 1}/${numCuotas} — ${proyectoData.nombre_proyecto}`,
            description: `Cliente: ${proyectoData.cliente}\nProyecto: ${proyectoData.nombre_proyecto}\nCuota ${i+1} de ${numCuotas}`,
            date: eventDate.toISOString().split('T')[0],
            amount: cuotaValor
          });
        }
      } catch (error) {
        console.error('Error syncing with Calendar:', error);
      }
    }

    setIsSyncing(false);
    setShowForm(false);
  };

  const handleSyncExistingToCalendar = async (proyecto: Proyecto) => {
    if (!isConnected || !accessToken) return;
    
    setSyncingProjectId(proyecto.id);
    try {
      const calendarId = await getOrCreateFinanceCalendar(accessToken);
      
      // Calculate installments (assuming remaining or total depending on user preference)
      // For existing, we'll ask or default to 1 for simplicity unless we add a prompt
      const installments = 1; 
      const cuotaValor = proyecto.pendiente / installments;
      const startDate = new Date(proyecto.fecha_inicio);
      
      for (let i = 0; i < installments; i++) {
        const eventDate = new Date(startDate);
        if (eventDate < new Date()) eventDate.setMonth(new Date().getMonth() + i); // Start from now if past
        else eventDate.setMonth(startDate.getMonth() + i);
        
        await createPaymentEvent(accessToken, calendarId, {
          summary: `Cobrar — ${proyecto.nombre_proyecto}`,
          description: `Cliente: ${proyecto.cliente}\nProyecto: ${proyecto.nombre_proyecto}`,
          date: eventDate.toISOString().split('T')[0],
          amount: cuotaValor
        });
      }
      alert(`Sincronizado: ${proyecto.nombre_proyecto}`);
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Error al sincronizar con Google Calendar');
    }
    setSyncingProjectId(null);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) {
      registrarPagoProyecto(selectedProject.id, paymentAmount, paymentMethod);
      setShowPaymentModal(false);
      setSelectedProject(null);
      setPaymentAmount(0);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-200">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Proyectos Real-Time</h2>
          <p className="text-brand-gold font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1">Control de entregas y facturación estratégica</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-3 bg-white text-black hover:bg-brand-gold px-6 lg:px-8 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 text-[10px] lg:text-xs tracking-widest uppercase"
        >
          <PlusCircle size={18} strokeWidth={3} />
          <span>NUEVO PROYECTO</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 sm:p-10">
          <div className="bg-[#111111] border border-[#222222] w-full max-w-2xl rounded-[40px] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
            <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">Configurar Proyecto</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] lg:text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] pl-1">Cliente</label>
                <input required type="text" value={newProyecto.cliente} onChange={e => setNewProyecto({...newProyecto, cliente: e.target.value})} className="w-full bg-[#050508] border border-white/5 rounded-xl lg:rounded-2xl px-5 py-3 lg:py-4 text-white focus:border-brand-gold outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Nombre Proyecto</label>
                <input required type="text" value={newProyecto.nombre_proyecto} onChange={e => setNewProyecto({...newProyecto, nombre_proyecto: e.target.value})} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Tipo</label>
                <input required type="text" value={newProyecto.tipo} onChange={e => setNewProyecto({...newProyecto, tipo: e.target.value})} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Fase Actual</label>
                <select value={newProyecto.fase} onChange={e => setNewProyecto({...newProyecto, fase: e.target.value as any})} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-black appearance-none">
                  <option value="Propuesta">Propuesta</option>
                  <option value="Inicio">Inicio</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Entrega">Entrega</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Valor Total (COP)</label>
                <input required type="number" value={newProyecto.valor_total} onChange={e => setNewProyecto({...newProyecto, valor_total: Number(e.target.value)})} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Total Cobrado (COP)</label>
                <input required type="number" value={newProyecto.cobrado} onChange={e => setNewProyecto({...newProyecto, cobrado: Number(e.target.value)})} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pl-1">Número de Cuotas (Calendar)</label>
                <input type="number" min="1" max="24" value={numCuotas} onChange={e => setNumCuotas(Number(e.target.value))} className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold" />
              </div>
              <div className="col-span-2 mt-6">
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-wait flex items-center justify-center gap-3"
                >
                  {isSyncing ? (
                    <>
                      <Clock className="animate-spin" size={20} />
                      SINCRONIZANDO...
                    </>
                  ) : (
                    <>
                      <CalendarIcon size={20} />
                      DAR DE ALTA Y AGENDAR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedProject && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 sm:p-10">
          <div className="bg-[#111111] border border-[#222222] w-full max-w-md rounded-[40px] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-white tracking-tighter">Registrar Pago</h3>
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">{selectedProject.nombre_proyecto}</p>
            </div>
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Monto a Recibir (COP)</label>
                <input 
                  required 
                  type="number" 
                  value={paymentAmount || ''} 
                  onChange={e => setPaymentAmount(Number(e.target.value))} 
                  placeholder={`Max: $${selectedProject.pendiente.toLocaleString('es-CO')}`}
                  className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-bold text-xl" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Método de Pago</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)} 
                  className="w-full bg-black border border-[#222222] rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none transition-all font-black appearance-none"
                >
                  <option value="Transferencia">Transferencia (Bancolombia)</option>
                  <option value="Efectivo">Efectivo (Billetera)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl uppercase tracking-widest text-xs">
                CONFIRMAR INGRESO
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {proyectos.map((proyecto) => {
          const progress = (proyecto.cobrado / proyecto.valor_total) * 100;
          return (
            <div key={proyecto.id} className="glass-card rounded-[32px] lg:rounded-[40px] p-8 lg:p-10 hover:border-brand-primary/20 transition-all group relative overflow-hidden shadow-brand-primary/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-brand-primary/10 transition-all duration-700 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-8 lg:mb-10 relative z-10">
                <div className="max-w-[70%]">
                  <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter mb-2 truncate">{proyecto.nombre_proyecto}</h3>
                  <p className="text-xs lg:text-sm font-bold text-brand-gold tracking-tight flex items-center gap-2 truncate">
                    {proyecto.cliente.toUpperCase()} 
                    <span className="text-slate-700 font-black">•</span>
                    <span className="text-slate-400">{proyecto.tipo}</span>
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl text-[8px] lg:text-[10px] font-black tracking-widest border uppercase whitespace-nowrap ${
                  proyecto.estado === 'Completado' ? 'bg-brand-income/5 text-brand-income border-brand-income/20' : 
                  'bg-brand-gold/5 text-brand-gold border-brand-gold/20'
                }`}>
                  {proyecto.estado === 'Completado' ? <CheckCircle size={14} strokeWidth={3} /> : <Clock size={14} strokeWidth={3} />}
                  <span className="hidden sm:inline">{proyecto.estado}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10 relative z-10">
                <div className="bg-[#050508] p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-white/5 text-center">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Acordado</p>
                  <p className="text-base lg:text-lg font-black text-white tracking-tighter">${proyecto.valor_total.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-[#050508] p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-white/5 text-center">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Ingresado</p>
                  <p className="text-base lg:text-lg font-black text-brand-income tracking-tighter">${proyecto.cobrado.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-[#050508] p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-white/5 text-center">
                  <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Balance</p>
                  <p className="text-base lg:text-lg font-black text-brand-gold tracking-tighter">${proyecto.pendiente.toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-10 relative z-10">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                  <span className="text-slate-500">Recuperación Financiera</span>
                  <span className={progress === 100 ? 'text-emerald-400' : 'text-amber-500'}>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-[#222222]">
                  <div 
                    className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="pt-6 lg:pt-8 border-t border-white/5 flex flex-col sm:flex-row lg:justify-between items-center gap-6 relative z-10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="bg-[#050508] p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-white/5">
                    <Briefcase size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Fase Operativa</p>
                    <p className="text-xs lg:text-sm font-black text-white tracking-tight uppercase truncate">{proyecto.fase}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full sm:w-auto relative z-10">
                  <button 
                    onClick={() => {
                      setSelectedProject(proyecto);
                      setPaymentAmount(proyecto.pendiente);
                      setShowPaymentModal(true);
                    }}
                    disabled={proyecto.estado === 'Completado'}
                    className="py-3 lg:py-4 px-4 lg:px-6 bg-white text-black text-[9px] lg:text-[10px] font-black rounded-xl lg:rounded-2xl hover:bg-brand-gold transition-all uppercase tracking-widest disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 shadow-xl shadow-black/20"
                  >
                    Ingresar
                  </button>
                  {isConnected && (
                    <button 
                      onClick={() => handleSyncExistingToCalendar(proyecto)}
                      disabled={syncingProjectId === proyecto.id}
                      className="py-3 lg:py-4 px-4 lg:px-6 bg-brand-income/5 border border-brand-income/20 text-brand-income text-[9px] lg:text-[10px] font-black rounded-xl lg:rounded-2xl hover:bg-brand-income hover:text-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-black/20"
                    >
                      {syncingProjectId === proyecto.id ? <RefreshCw size={14} className="animate-spin" /> : <CalendarIcon size={14} />}
                      <span className="truncate">{syncingProjectId === proyecto.id ? '...' : 'Sync'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
