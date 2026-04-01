import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Send, User, TrendingUp, AlertCircle, Loader2, Settings } from 'lucide-react';

// --- CONFIG ---
// Paste your n8n webhook URL here
const N8N_WEBHOOK_URL = localStorage.getItem('finanzita_webhook_url') || '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  '¿Cuál es mi situación financiera actual?',
  '¿Cómo va mi MRR este mes?',
  '¿Cuánto me queda disponible después de deudas?',
  '¿Qué ingreso me genera más?',
  '¿Está creciendo o cayendo mi negocio?',
  '¿Cuándo podría pagar toda mi deuda?',
];

export const Finanzita: React.FC = () => {
  const { movimientos, clientesMRR, deudas, proyectos, stats, selectedPeriod } = useFinance();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Hola! Soy **Finanzita IR**, tu asesora de inteligencia financiera en la plataforma **SM DIGITALS**. 🚀\n\nAnalizo tus movimientos, clientes, deudas y proyectos en tiempo real. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(N8N_WEBHOOK_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [tempWebhook, setTempWebhook] = useState(webhookUrl);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build a compact financial context to send to n8n
  const buildContext = () => {
    const currentMovimientos = movimientos.filter(m => m.periodo === selectedPeriod);
    const mrrActivo = clientesMRR.filter(c => c.estado === 'Activo');
    const totalMRR = mrrActivo.reduce((s, c) => s + c.valor_mensual, 0);
    const totalDeuda = deudas.reduce((s, d) => s + d.saldo_restante, 0);
    const ingresosMes = currentMovimientos.filter(m => m.tipo_movimiento === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const gastosMes = currentMovimientos.filter(m => m.tipo_movimiento === 'Gasto').reduce((s, m) => s + m.monto, 0);

    return {
      periodo_actual: selectedPeriod,
      resumen_financiero: {
        mrr_total: totalMRR,
        deuda_total: totalDeuda,
        ingresos_periodo: ingresosMes,
        gastos_periodo: gastosMes,
        utilidad_periodo: ingresosMes - gastosMes,
        total_ingresos_historico: stats.totalIncome,
        total_gastos_historico: stats.totalExpenses,
      },
      ingresos_mrr: mrrActivo.map(c => ({
        nombre: c.cliente,
        valor: c.valor_mensual,
        dia_cobro: c.dia_cobro,
        estado: c.estado,
      })),
      deudas: deudas.map(d => ({
        acreedor: d.acreedor,
        saldo_restante: d.saldo_restante,
        cuota_mensual: d.cuota_mensual,
        saldo_inicial: d.saldo_inicial,
        estado: d.estado,
      })),
      proyectos_activos: proyectos.filter(p => p.estado === 'En Proceso').map(p => ({
        nombre: p.nombre_proyecto,
        cliente: p.cliente,
        pendiente: p.pendiente,
        cobrado: p.cobrado,
        valor_total: p.valor_total,
        fase: p.fase,
      })),
      ultimos_movimientos: currentMovimientos.slice(-20).map(m => ({
        fecha: m.fecha,
        tipo: m.tipo_movimiento,
        categoria: m.categoria,
        monto: m.monto,
        descripcion: m.cliente_proveedor,
      })),
    };
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      const url = webhookUrl || tempWebhook;

      if (!url) {
        throw new Error('NO_WEBHOOK');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: text,
          contexto_financiero: context,
          historial: messages.slice(-6).map(m => ({
            rol: m.role,
            mensaje: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      // Support both { respuesta: "..." } and { output: "..." } and plain string
      const respuesta =
        data?.respuesta ||
        data?.output ||
        data?.message ||
        data?.text ||
        (typeof data === 'string' ? data : null) ||
        '⚠️ No pude obtener una respuesta. Revisa el formato de respuesta de tu workflow en n8n.';

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: respuesta,
        timestamp: new Date(),
      }]);

    } catch (err: any) {
      let errorMsg = '';
      if (err.message === 'NO_WEBHOOK') {
        errorMsg = '⚙️ **Configura el webhook de n8n** primero. Haz clic en el ícono de ajustes (⚙️) arriba a la derecha y pega la URL de tu webhook de n8n para activarme.';
      } else {
        errorMsg = `❌ Error conectando con n8n: ${err.message}\n\nVerifica que tu workflow esté activo y la URL sea correcta.`;
      }
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWebhook = () => {
    localStorage.setItem('finanzita_webhook_url', tempWebhook);
    setWebhookUrl(tempWebhook);
    setShowSettings(false);
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '✅ ¡Webhook configurado! Ya estoy conectada a tu workflow de n8n. Puedes hacerme cualquier pregunta sobre tus finanzas.',
      timestamp: new Date(),
    }]);
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6 flex-shrink-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="relative">
            <div className="w-12 h-12 lg:w-14 lg:h-14 glass-card rounded-xl lg:rounded-[20px] flex items-center justify-center shadow-xl shadow-brand-primary/10 overflow-hidden border-brand-primary/20">
              <img src="/logo.png" alt="SM" className="w-full h-full object-contain scale-125" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-brand-income rounded-full border-2 border-[#050508] animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tighter">Finanzita IR</h2>
            <p className="text-[8px] lg:text-[10px] text-brand-primary font-black uppercase tracking-[0.2em]">SM DIGITALS Intelligence · En línea</p>
          </div>
        </div>
        <button
          onClick={() => { setShowSettings(!showSettings); setTempWebhook(webhookUrl); }}
          className="glass-card p-2.5 lg:p-3 rounded-xl text-slate-500 hover:text-white hover:border-brand-income/30 transition-all shadow-xl"
          title="Configurar webhook n8n"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="glass-card rounded-[24px] lg:rounded-3xl p-5 lg:p-6 mb-4 flex-shrink-0 space-y-4 shadow-2xl border-brand-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-brand-primary" />
            <p className="text-[9px] lg:text-[11px] font-black text-brand-primary uppercase tracking-widest">Configuración Webhook n8n</p>
          </div>
          <p className="text-[11px] lg:text-xs text-slate-500 max-w-lg">Pega la URL del nodo "Webhook" de tu workflow en n8n. El agente enviará el contexto financiero completo.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={tempWebhook}
              onChange={e => setTempWebhook(e.target.value)}
              placeholder="https://tu-n8n.app.n8n.cloud/webhook/finanzita"
              className="flex-1 bg-[#050508] border border-white/5 rounded-xl px-4 py-3 text-xs lg:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary/50"
            />
            <button
              onClick={saveWebhook}
              className="bg-brand-primary hover:bg-brand-primary/80 text-white font-black px-6 py-3 rounded-xl transition-all text-xs lg:text-sm active:scale-95 shadow-xl shadow-brand-primary/20"
            >
              Guardar Webhook
            </button>
          </div>
        </div>
      )}

      {/* KPI Bar */}
      <div className="flex gap-3 mb-4 flex-shrink-0 overflow-x-auto no-scrollbar pb-2">
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0 border-white/5 opacity-80">
          <TrendingUp size={14} className="text-brand-income" />
          <div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">MRR</p>
            <p className="text-xs font-black text-white">${stats.mrr.toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0 border-white/5 opacity-80">
          <div className={`w-2 h-2 rounded-full ${stats.periodIncome - stats.periodExpenses >= 0 ? 'bg-brand-income' : 'bg-brand-expense'}`} />
          <div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Utilidad {selectedPeriod}</p>
            <p className={`text-xs font-black ${stats.periodIncome - stats.periodExpenses >= 0 ? 'text-brand-income' : 'text-brand-expense'}`}>
              ${(stats.periodIncome - stats.periodExpenses).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 flex-shrink-0 border-white/5 opacity-80">
          <div className="w-2 h-2 rounded-full bg-brand-gold" />
          <div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Deuda</p>
            <p className="text-xs font-black text-brand-gold">${stats.totalDebt.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] border border-[#222222] rounded-3xl p-6 space-y-4 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
              msg.role === 'assistant'
                ? 'bg-liquid border border-brand-primary/30 shadow-lg shadow-brand-primary/20'
                : 'bg-[#1f1f1f] border border-[#333333]'
            }`}>
              {msg.role === 'assistant' ? <img src="/logo.png" alt="SM" className="w-full h-full object-contain scale-110" /> : <User size={16} className="text-slate-400" />}
            </div>
            <div className={`max-w-[75%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 lg:px-5 py-3 lg:py-4 rounded-[20px] lg:rounded-3xl text-[13px] lg:text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'glass-card border-white/10 text-slate-200 rounded-tl-sm shadow-xl'
                  : 'bg-brand-primary text-white rounded-tr-sm shadow-lg shadow-brand-primary/20'
              }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
              <p className="text-[9px] text-slate-600 px-2 font-bold">
                {msg.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl bg-liquid border border-brand-primary/20 flex items-center justify-center shadow-lg shadow-brand-primary/20 overflow-hidden">
              <img src="/logo.png" alt="SM" className="w-full h-full object-contain animate-pulse" />
            </div>
            <div className="bg-[#111111] border border-[#222222] px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={14} className="text-emerald-500 animate-spin" />
              <span className="text-sm text-slate-400 italic">Finanzita está analizando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
        {QUICK_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={isLoading}
            className="flex-shrink-0 bg-[#111111] border border-[#222222] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-500 text-[10px] font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 lg:gap-3 mt-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Pregúntale a SM Inteligencia..."
          disabled={isLoading}
          className="flex-1 bg-[#050508] border border-white/5 focus:border-brand-primary/50 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3.5 lg:py-4 text-[13px] lg:text-sm text-white placeholder-slate-600 focus:outline-none transition-all disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="bg-brand-primary hover:bg-brand-primary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white w-12 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl shadow-brand-primary/20"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};
