import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Wallet, Tag } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface GastoFijoTemplate {
  id: string;
  nombre: string;
  monto: number;
  categoria: string;
  space_id: string;
}

const STORAGE_KEY = 'gastos_fijos_v1';

export const GastosFijos: React.FC = () => {
  const { addMovimiento, spaces } = useFinance();
  const [templates, setTemplates] = useState<GastoFijoTemplate[]>([]);
  
  const [openModal, setOpenModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState<number>(0);
  const [categoria, setCategoria] = useState('Gastos Fijos');
  const [spaceId, setSpaceId] = useState('sp_smdigitals');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load gastos fijos from local storage');
    }
  }, []);

  const saveTemplates = (newTemplates: GastoFijoTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || monto <= 0 || !spaceId) return;

    const newTemplate: GastoFijoTemplate = {
      id: crypto.randomUUID(),
      nombre,
      monto,
      categoria,
      space_id: spaceId,
    };

    saveTemplates([...templates, newTemplate]);
    setOpenModal(false);
    
    setNombre('');
    setMonto(0);
    setCategoria('Gastos Fijos');
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este gasto fijo?')) return;
    saveTemplates(templates.filter(t => t.id !== id));
    
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(templates.map(t => t.id)));
    }
  };

  const handleRegistrar = async () => {
    if (selectedIds.size === 0) {
      alert('Selecciona al menos un gasto para registrar.');
      return;
    }

    const confirmacion = confirm(`¿Seguro que deseas registrar ${selectedIds.size} gastos en el mes actual?`);
    if (!confirmacion) return;

    const hoy = new Date().toISOString().split('T')[0];

    let successCount = 0;
    for (const id of selectedIds) {
      const template = templates.find(t => t.id === id);
      if (!template) continue;

      try {
        await addMovimiento({
          fecha: hoy,
          tipo_movimiento: 'Gasto',
          monto: template.monto,
          categoria: template.categoria,
          subcategoria: 'Fijo',
          cliente_proveedor: 'N/A',
          descripcion: template.nombre,
          metodo_pago: 'Transferencia',
          estado: 'Pagado',
          impacto: 'Core',
          space_id: template.space_id,
          unidad: template.space_id === 'sp_smdigitals' ? 'SM DIGITALS' : 'Personal',
          recurrente: true,
          cuenta: template.space_id === 'sp_smdigitals' ? 'SM DIGITALS' : 'Personal'
        });
        successCount++;
      } catch (err) {
        console.error('Error al registrar gasto fijo:', err);
      }
    }

    alert(`✅ ¡${successCount} gastos fijos registrados con éxito!`);
    setSelectedIds(new Set());
  };

  const totalSeleccionado = Array.from(selectedIds).reduce((sum, id) => {
    const t = templates.find(temp => temp.id === id);
    return sum + (t?.monto || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter">Gastos Fijos</h2>
          <p className="text-slate-400 text-sm mt-1">Registra tus gastos mensuales recurrentes con un solo clic.</p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-5 py-2.5 rounded-xl font-black transition-all text-sm uppercase tracking-widest whitespace-nowrap"
        >
          <Plus size={18} />
          Nuevo Gasto Fijo
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-slate-800/20 border border-white/5 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">No tienes gastos fijos configurados</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Configura aquí tu arriendo, nómina, internet o cualquier gasto que repitas todos los meses para pagarlos más rápido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/40 rounded-xl border border-white/5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedIds.size === templates.length && templates.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-white/10 bg-black/20 text-emerald-500 focus:ring-emerald-500/50"
              />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                Seleccionar Todos
              </span>
            </label>

            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Seleccionado</p>
              <p className="text-lg font-black text-rose-400">${totalSeleccionado.toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => {
              const isSelected = selectedIds.has(template.id);
              const space = spaces.find(s => s.id === template.space_id);
              
              return (
                <div 
                  key={template.id}
                  onClick={() => toggleSelect(template.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="w-5 h-5 rounded border-white/10 bg-black/20 text-emerald-500 focus:ring-emerald-500/50 pointer-events-none"
                    />
                  </div>

                  <div className="space-y-3 mt-2">
                    <h3 className="text-lg font-black text-white">{template.nombre}</h3>
                    <p className="text-2xl font-black text-rose-400">${template.monto.toLocaleString('es-CO')}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md border border-white/10">
                        <Tag size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase">{template.categoria}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md border border-white/10">
                        <Wallet size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase">{space?.name || 'Desconocido'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRegistrar}
            disabled={selectedIds.size === 0}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
              selectedIds.size > 0
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.01]'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <DollarSign size={20} />
            {selectedIds.size > 0 ? `Registrar ${selectedIds.size} Gastos Ahora` : 'Selecciona gastos para registrar'}
          </button>
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[32px] p-6 lg:p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">Nuevo Gasto Fijo</h3>
            <form onSubmit={handleAddTemplate} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Gasto</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Arriendo Oficina"
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={monto || ''}
                    onChange={e => setMonto(parseInt(e.target.value) || 0)}
                    placeholder="1000000"
                    className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 pl-8 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bolsillo</label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.type === 'business' ? 'Empresa' : 'Personal'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                <input
                  type="text"
                  required
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full bg-[#050508] border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-black uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-black uppercase tracking-wider hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};