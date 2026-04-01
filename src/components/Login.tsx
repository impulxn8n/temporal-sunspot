import React, { useState } from 'react';
import { usePrivateAccess } from '../hooks/usePrivateAccess';
import { ShieldCheck, Lock, Sparkles, ArrowRight, XCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const { unlock, error } = usePrivateAccess();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    unlock(password);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020205] flex items-center justify-center overflow-hidden font-sans">
      {/* Liquid Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-secondary/15 blur-[150px] rounded-full animate-pulse delay-700" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full px-6">
        <div className="bg-[#0a0a0f]/80 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 shadow-[0_0_100px_rgba(43,97,255,0.1)] relative overflow-hidden group">
          
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Logo Container */}
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-liquid p-0.5 rounded-[28px] shadow-2xl shadow-brand-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-700 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="SM DIGITALS" 
                  className="w-full h-full object-contain scale-110"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-brand-primary p-2 rounded-xl shadow-lg border-2 border-[#0a0a0f]">
                <ShieldCheck size={14} className="text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tighter mb-1">SM DIGITALS</h1>
            <p className="text-[9px] text-brand-primary font-black uppercase tracking-[0.4em] mb-10">Plataforma Financiera Inteligente</p>
            
            <form onSubmit={handleLogin} className="w-full space-y-6">
              <div className="relative group/input">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-primary transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce la Clave Maestra"
                  autoFocus
                  className="w-full bg-[#05050a] border border-white/5 focus:border-brand-primary/50 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-primary/10 hover:bg-brand-primary p-2 rounded-xl group/btn transition-all text-brand-primary hover:text-white"
                >
                  <ArrowRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-500 justify-center animate-in fade-in slide-in-from-top-2">
                  <XCircle size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
                </div>
              )}

              <p className="text-slate-500 text-[10px] font-medium leading-relaxed px-4">
                Esta es una plataforma de acceso restringido. Por favor, introduce tus credenciales para continuar.
              </p>
            </form>

            <div className="flex items-center justify-center gap-4 text-slate-700 mt-10">
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <span className="text-[8px] font-black uppercase tracking-tighter">AES-256 SECURED</span>
              </div>
              <div className="w-1 h-1 bg-slate-800 rounded-full" />
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <Sparkles size={10} />
                <span className="text-[8px] font-black uppercase tracking-tighter">SM-AI V3</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-[8px] text-slate-700 font-bold uppercase tracking-[0.2em] opacity-40">
          Powered by SM DIGITALS © 2026 · Private Access
        </p>
      </div>
    </div>
  );
};
