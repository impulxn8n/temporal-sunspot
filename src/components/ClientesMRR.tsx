import React from 'react';
import { useFinance } from '../hooks/useFinance';
import { Banknote, Calendar, Bell, RefreshCw, Plus, Wallet, Shield, TrendingUp } from 'lucide-react';
import type { ClienteMRR } from '../types';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { getOrCreateFinanceCalendar, createPaymentEvent } from '../lib/googleCalendar';
import { useState } from 'react';
import { AddClienteMRRModal } from './AddClienteMRRModal';
import { calcularDistribucionCliente, calcularDistribucionMensualMRR } from '../lib/clienteCalc';

export const ClientesMRR: React.FC = () => {
  const { clientesMRR } = useFinance();
  const [showAdd, setShowAdd] = useState(false);

  const totalMRR = clientesMRR.filter(c => c.estado === 'Activo').reduce((acc, c) => acc + c.valor_mensual, 0);
  const totalPausado = clientesMRR.filter(c => c.estado === 'Pausado').reduce((acc, c) => acc + c.valor_mensual, 0);
  const distMensual = calcularDistribucionMensualMRR(clientesMRR);

  const { isConnected, accessToken } = useGoogleAuth();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncToCalendar = async (cliente: ClienteMRR, silent = false) => {
    if (!isConnected || !accessToken) return;
    
    if (!silent) setSyncingId(cliente.id);
    try {
      const calendarId = await getOrCreateFinanceCalendar(accessToken);
      
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth();
      if (now.getDate() > cliente.dia_cobro) month++;

      const eventDate = new Date(year, month, cliente.dia_cobro);
      
      await createPaymentEvent(accessToken, calendarId, {
        summary: `Cobro MRR: ${cliente.cliente}`,
        description: `Suscripción mensual: ${cliente.servicio}`,
        date: eventDate.toISOString().split('T')[0],
        amount: cliente.valor_mensual,
        recurrence: [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${cliente.dia_cobro}`]
      });
      
      if (!silent) alert(`Sincronizado: ${cliente.cliente}`);
    } catch (error) {
      console.error('Error syncing:', error);
      if (!silent) alert(`Error al sincronizar ${cliente.cliente}`);
    }
    if (!silent) setSyncingId(null);
  };

  const handleSyncAll = async () => {
    if (!isConnected || !accessToken) return;
    const activeClients = clientesMRR.filter(c => c.estado === 'Activo');
    
    setSyncingId('all');
    for (const cliente of activeClients) {
      await handleSyncToCalendar(cliente, true);
    }
    setSyncingId(null);
    alert('Sincronización masiva completada con éxito.');
  };

  const getGoogleCalendarUrl = (cliente: ClienteMRR) => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    
    // Si ya pasó el día de cobro este mes, programar para el siguiente
    if (now.getDate() > cliente.dia_cobro) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    
    const eventDate = new Date(year, month, cliente.dia_cobro, 9, 0, 0);
    const dateStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(year, month, cliente.dia_cobro, 10, 0, 0);
    const endDateStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const title = encodeURIComponent(`Cobro MRR: ${cliente.cliente}`);
    const details = encodeURIComponent(`Recordatorio de cobro mensual por ${cliente.servicio}.\nValor: $${cliente.valor_mensual.toLocaleString('es-CO')}`);
    const recur = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${cliente.dia_cobro}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${endDateStr}&recur=${recur}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-200">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter">Clientes MRR</h2>
          <p className="text-brand-primary font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[10px] mt-1">Gestión de suscripciones SM DIGITALS</p>
        </div>
        <div className="flex gap-3 flex-wrap lg:justify-end items-center">
          {isConnected && (
            <button 
              onClick={handleSyncAll}
              disabled={syncingId !== null}
              className="bg-emerald-500/5 border border-emerald-500/20 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl text-emerald-400 font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 lg:gap-3 disabled:opacity-50 shadow-lg shadow-emerald-500/5"
            >
              {syncingId === 'all' ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
              <span className="hidden sm:inline">{syncingId === 'all' ? 'Sincronizando Todo...' : 'Sincronizar Todo'}</span>
              <span className="sm:hidden">{syncingId === 'all' ? 'Sinc...' : 'Sync All'}</span>
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand-primary text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-brand-primary/80 transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20"
          >
            <Plus size={14} />
            <span>Nuevo cliente</span>
          </button>
          <div className="glass-card px-6 lg:px-8 py-4 lg:py-5 rounded-[24px] lg:rounded-[32px] text-right shadow-2xl relative overflow-hidden group shadow-brand-primary/5">
            <div className="absolute inset-0 bg-brand-primary/5 group-hover:opacity-100 transition-opacity" />
            <p className="text-[8px] lg:text-[10px] text-brand-primary font-black uppercase tracking-[0.3em] mb-1 relative z-10">MRR Activo</p>
            <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter relative z-10">${totalMRR.toLocaleString('es-CO')}</h3>
          </div>
          {totalPausado > 0 && (
            <div className="glass-card px-6 lg:px-8 py-4 lg:py-5 rounded-[24px] lg:rounded-[32px] text-right shadow-2xl relative overflow-hidden group shadow-brand-gold/5">
              <div className="absolute inset-0 bg-brand-gold/5 group-hover:opacity-100 transition-opacity" />
              <p className="text-[8px] lg:text-[10px] text-brand-gold font-black uppercase tracking-[0.3em] mb-1 relative z-10">⏸ En Pausa</p>
              <h3 className="text-2xl lg:text-3xl font-black text-brand-gold/70 tracking-tighter relative z-10">${totalPausado.toLocaleString('es-CO')}</h3>
            </div>
          )}
        </div>
      </header>

      {/* Resumen de distribución mensual a bolsillos */}
      {clientesMRR.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-[24px] relative overflow-hidden border-brand-primary/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 blur-[60px] -mr-12 -mt-12" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <TrendingUp size={14} className="text-brand-primary" />
              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Ingresos /mes</p>
            </div>
            <p className="text-xl font-black text-white tracking-tighter relative z-10">${distMensual.totalIngresos.toLocaleString('es-CO')}</p>
          </div>
          <div className="glass-card p-5 rounded-[24px] relative overflow-hidden border-amber-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[60px] -mr-12 -mt-12" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Wallet size={14} className="text-amber-400" />
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Bolsillo Operativo</p>
            </div>
            <p className="text-xl font-black text-white tracking-tighter relative z-10">${distMensual.totalOperativo.toLocaleString('es-CO')}</p>
          </div>
          <div className="glass-card p-5 rounded-[24px] relative overflow-hidden border-rose-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-[60px] -mr-12 -mt-12" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Shield size={14} className="text-rose-400" />
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Bolsillo Emergencia</p>
            </div>
            <p className="text-xl font-black text-white tracking-tighter relative z-10">${distMensual.totalEmergencia.toLocaleString('es-CO')}</p>
          </div>
          <div className="glass-card p-5 rounded-[24px] relative overflow-hidden border-emerald-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[60px] -mr-12 -mt-12" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <TrendingUp size={14} className="text-emerald-400" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Dinero Libre</p>
            </div>
            <p className="text-xl font-black text-white tracking-tighter relative z-10">${distMensual.totalLibre.toLocaleString('es-CO')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {clientesMRR.map((cliente) => {
          const dist = calcularDistribucionCliente(cliente);
          return (
          <div key={cliente.id} className="glass-card p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] hover:border-white/10 transition-all group relative overflow-hidden shadow-brand-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-700 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 lg:mb-8 relative z-10">
              <div className="max-w-[70%]">
                <h4 className="text-xl lg:text-2xl font-black text-white tracking-tighter mb-1 truncate">{cliente.cliente}</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{cliente.servicio}</p>
              </div>
              <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
                cliente.estado === 'Activo' ? 'bg-brand-income/5 text-brand-income border-brand-income/20' : 'bg-brand-gold/5 text-brand-gold border-brand-gold/20'
              }`}>
                {cliente.estado}
              </span>
            </div>

            <div className="space-y-4 lg:space-y-5 relative z-10">
              <div className="flex justify-between items-center py-3 lg:py-3.5 border-b border-white/5">
                <div className="flex items-center gap-3 text-slate-500">
                  <Banknote size={16} className="text-brand-income/60" />
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Mensual</span>
                </div>
                <span className="text-white font-black text-base lg:text-lg tracking-tighter">${cliente.valor_mensual.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center py-3 lg:py-3.5 border-b border-white/5">
                <div className="flex items-center gap-3 text-slate-500">
                  <Calendar size={16} className="text-brand-gold/60" />
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Cobro</span>
                </div>
                <span className="text-brand-gold font-black italic text-sm">Día {cliente.dia_cobro}</span>
              </div>
            </div>

            {/* Distribución del cobro */}
            <div className="mt-5 bg-black/30 rounded-2xl border border-white/5 p-4 space-y-2 relative z-10">
              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">Distribución del cobro</p>
              {dist.costoOperativo > 0 && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-amber-400 flex items-center gap-1.5"><Wallet size={10} /> Operativo</span>
                  <span className="text-white font-black">${dist.costoOperativo.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-rose-400 flex items-center gap-1.5"><Shield size={10} /> Emergencia</span>
                <span className="text-white font-black">${dist.ahorro.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5">
                <span className="text-emerald-400 flex items-center gap-1.5"><TrendingUp size={10} /> Libre</span>
                <span className="text-emerald-400 font-black">${dist.dineroLibre.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button className="py-3 lg:py-4 bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white text-[8px] lg:text-[9px] font-black rounded-xl lg:rounded-2xl transition-all uppercase tracking-widest shadow-xl">
                Auditar
              </button>
              {cliente.estado === 'Activo' && (
                isConnected ? (
                  <button 
                    onClick={() => handleSyncToCalendar(cliente)}
                    disabled={syncingId === cliente.id}
                    className="py-3 lg:py-4 bg-brand-income/5 border border-brand-income/20 hover:bg-brand-income hover:text-black text-brand-income text-[8px] lg:text-[9px] font-black rounded-xl lg:rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 group/btn shadow-xl shadow-brand-income/5 disabled:opacity-50"
                  >
                    {syncingId === cliente.id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Bell size={12} className="group-hover/btn:animate-bounce" />
                    )}
                    <span className="truncate">{syncingId === cliente.id ? '...' : 'Sync'}</span>
                  </button>
                ) : (
                  <a 
                    href={getGoogleCalendarUrl(cliente)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 lg:py-4 bg-brand-gold/5 border border-brand-gold/20 hover:bg-brand-gold hover:text-black text-brand-gold text-[8px] lg:text-[9px] font-black rounded-xl lg:rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 group/btn shadow-xl shadow-brand-gold/5"
                  >
                    <Bell size={12} className="group-hover/btn:animate-bounce" />
                    <span>Calendar</span>
                  </a>
                )
              )}
            </div>
          </div>
          );
        })}
      </div>

      <AddClienteMRRModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};
