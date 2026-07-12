import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto, Space, SpaceView, CuentaPorCobrar } from '../types';
import { loadData, saveData } from '../lib/storage';
import { spaceIdToUnidad, unidadToSpaceId, SPACE_IDS, defaultSpaces, BOLSILLO_SPACE_IDS } from '../lib/spaces';
import { createFinanceSpreadsheet, updateSheetValues, getSpreadsheetIdByName, getSheetValues } from '../lib/googleSheets';
import { db } from '../lib/supabaseStorage';

export interface SpaceBalance {
  spaceId: string;
  income: number;          // ingresos reales (sin transferencias)
  expenses: number;        // gastos reales (sin transferencias)
  transfersIn: number;     // entradas por transferencia
  transfersOut: number;    // salidas por transferencia
  balance: number;         // income - expenses + transfersIn - transfersOut
  netCashFlow: number;     // income - expenses (sin transferencias)
}

interface FinanceContextType {
  movimientos: Movimiento[];
  filteredMovimientos: Movimiento[];
  clientesMRR: ClienteMRR[];
  proyectos: Proyecto[];
  deudas: Deuda[];
  presupuestos: Presupuesto[];
  spaces: Space[];
  cuentasPorCobrar: CuentaPorCobrar[];
  selectedView: SpaceView;
  setSelectedView: (view: SpaceView) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  periods: string[];
  syncAllToGoogleSheets: (accessToken: string) => Promise<string>;
  importAllFromGoogleSheets: (accessToken: string) => Promise<void>;
  addMovimiento: (mov: Omit<Movimiento, 'id' | 'created_at' | 'periodo' | 'año' | 'mes' | 'space_id'> & { space_id?: string }) => Movimiento;
  removeMovimiento: (id: string) => void;
  addTransferencia: (params: {
    fromSpaceId: string;
    toSpaceId: string;
    monto: number;
    fecha: string;
    descripcion?: string;
    metodoPago?: string;
    cuenta?: string;
  }) => void;
  removeTransferencia: (pairId: string) => void;
  addClienteMRR: (cliente: Omit<ClienteMRR, 'id'>) => ClienteMRR;
  updateClienteMRR: (id: string, updates: Partial<Omit<ClienteMRR, 'id'>>) => void;
  removeClienteMRR: (id: string) => void;
  registerMRRPayment: (clienteId: string, shouldDistribute?: boolean) => void;
  addProyecto: (proyecto: Omit<Proyecto, 'id'>, syncCalendar?: boolean) => void;
  removeProyecto: (id: string) => void;
  updateProyecto: (id: string, updates: Partial<Omit<Proyecto, 'id'>>) => void;
  registrarPagoProyecto: (projectId: string, amount: number, method: string) => void;
  updateDebt: (debtId: string, paymentAmount: number) => void;
  undoDebtPayment: (debtId: string, paymentAmount: number) => void;
  addCuentaPorCobrar: (cuenta: Omit<CuentaPorCobrar, 'id' | 'created_at'>) => CuentaPorCobrar;
  marcarCuentaPorCobrar: (cuentaId: string, montoCobrado: number) => void;
  removeCuentaPorCobrar: (cuentaId: string) => void;
  balancesBySpace: Record<string, SpaceBalance>;
  globalBalance: SpaceBalance;
  stats: {
    totalIncome: number;
    totalExpenses: number;
    mrr: number;
    totalDebt: number;
    chartData: any[];
    periodIncome: number;
    periodExpenses: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Determina si un movimiento aplica a la vista actual.
const matchesView = (m: Movimiento, view: SpaceView, spaces: Space[]): boolean => {
  if (view === 'global') return true;
  if (view === 'personal') {
    const personalIds = new Set(spaces.filter(s => s.type === 'personal').map(s => s.id));
    return personalIds.has(m.space_id);
  }
  if (view === 'business') {
    const businessIds = new Set(spaces.filter(s => s.type === 'business').map(s => s.id));
    return businessIds.has(m.space_id);
  }
  return m.space_id === view;
};

const isReal = (m: Movimiento) => m.tipo_movimiento !== 'Transferencia';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [clientesMRR, setClientesMRR] = useState<ClienteMRR[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<CuentaPorCobrar[]>([]);
  const [selectedView, setSelectedView] = useState<SpaceView>('global');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().substring(0, 7));

  // Respaldo automático a localStorage cada vez que cambia el estado
  useEffect(() => { if (movimientos.length > 0) saveData({ movimientos }); }, [movimientos]);
  useEffect(() => { if (proyectos.length > 0) saveData({ proyectos }); }, [proyectos]);
  useEffect(() => { if (clientesMRR.length > 0) saveData({ clientesMRR }); }, [clientesMRR]);
  useEffect(() => { if (deudas.length > 0) saveData({ deudas }); }, [deudas]);

  useEffect(() => {
    const bootstrap = async () => {
      const local = loadData();
      try {
        const [movs, clients, projs, debts, budgets, cuentas] = await Promise.all([
          db.movimientos.load(),
          db.clientesMRR.load(),
          db.proyectos.load(),
          db.deudas.load(),
          db.presupuestos.load(),
          db.cuentasPorCobrar.load(),
        ]);

        // FusiÃ³n (Merge) inteligente para no perder datos creados offline en el celular
        const mergeData = (dbArray: any[], localArray: any[]) => {
          if (!dbArray || dbArray.length === 0) return { merged: localArray, missingInDb: localArray };
          const dbMap = new Map(dbArray.map(item => [item.id, item]));
          const missingInDb = localArray.filter(item => !dbMap.has(item.id));
          return { merged: [...dbArray, ...missingInDb], missingInDb };
        };

        const movsMerge = mergeData(movs, local.movimientos || []);
        setMovimientos(movsMerge.merged);
        if (movsMerge.missingInDb.length > 0) db.movimientos.upsert(movsMerge.missingInDb).catch(console.error);

        const clientsMerge = mergeData(clients, local.clientesMRR || []);
        setClientesMRR(clientsMerge.merged);
        if (clientsMerge.missingInDb.length > 0) clientsMerge.missingInDb.forEach((c: any) => db.clientesMRR.upsert(c).catch(console.error));

        const debtsMerge = mergeData(debts, local.deudas || []);
        setDeudas(debtsMerge.merged);
        if (debtsMerge.missingInDb.length > 0) debtsMerge.missingInDb.forEach((d: any) => db.deudas.upsert(d).catch(console.error));

        const cuentasMerge = mergeData(cuentas, local.cuentasPorCobrar || []);
        setCuentasPorCobrar(cuentasMerge.merged);
        if (cuentasMerge.missingInDb.length > 0) cuentasMerge.missingInDb.forEach((c: any) => db.cuentasPorCobrar.upsert(c).catch(console.error));

        const projsMerge = mergeData(projs, local.proyectos || []);
        setProyectos(projsMerge.merged);
        if (projsMerge.missingInDb.length > 0) projsMerge.missingInDb.forEach((p: any) => db.proyectos.upsert(p).catch(console.error));

        setPresupuestos(budgets);
      } catch (err) {
        console.error('[Bootstrap] Supabase failed, falling back to localStorage:', err);
        setMovimientos(local.movimientos);
        setClientesMRR(local.clientesMRR);
        setProyectos(local.proyectos);
        setDeudas(local.deudas);
        setPresupuestos(local.presupuestos);
        setCuentasPorCobrar(local.cuentasPorCobrar);
      }
      setSpaces(defaultSpaces);
    };
    bootstrap();
  }, []);

  const addMovimiento = useCallback((mov: Omit<Movimiento, 'id' | 'created_at' | 'periodo' | 'año' | 'mes' | 'space_id'> & { space_id?: string }) => {
    const date = new Date(mov.fecha);
    const id = crypto.randomUUID();
    const newMov: Movimiento = {
      ...mov,
      space_id: mov.space_id ?? unidadToSpaceId(mov.unidad),
      id,
      created_at: new Date().toISOString(),
      periodo: mov.fecha.substring(0, 7),
      año: date.getFullYear(),
      mes: date.getMonth() + 1,
    };

    setMovimientos(prev => [...prev, newMov]);
    db.movimientos.upsert([newMov]).catch(console.error);
    return newMov;
  }, []);

  const removeMovimiento = useCallback((id: string) => {
    setMovimientos(prev => prev.filter(m => m.id !== id));
    db.movimientos.deleteById(id).catch(console.error);
  }, []);

  const addTransferencia = useCallback((params: {
    fromSpaceId: string;
    toSpaceId: string;
    monto: number;
    fecha: string;
    descripcion?: string;
    metodoPago?: string;
    cuenta?: string;
  }) => {
    const { fromSpaceId, toSpaceId, monto, fecha, descripcion = '', metodoPago = 'Transferencia', cuenta = 'Bancolombia' } = params;
    if (fromSpaceId === toSpaceId) throw new Error('Origen y destino no pueden ser el mismo espacio.');
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');

    const date = new Date(fecha);
    const periodo = fecha.substring(0, 7);
    const pairId = crypto.randomUUID();
    const baseDescripcion = descripcion || `Transferencia interna`;

    const outMov: Movimiento = {
      id: crypto.randomUUID(),
      fecha,
      periodo,
      año: date.getFullYear(),
      mes: date.getMonth() + 1,
      unidad: spaceIdToUnidad(fromSpaceId),
      space_id: fromSpaceId,
      tipo_movimiento: 'Transferencia',
      categoria: 'Transferencia',
      subcategoria: 'Salida',
      cliente_proveedor: 'Transferencia interna',
      descripcion: baseDescripcion,
      metodo_pago: metodoPago,
      monto,
      recurrente: false,
      estado: 'Pagado',
      impacto: 'Core',
      cuenta,
      created_at: new Date().toISOString(),
      transfer_pair_id: pairId,
      transfer_direction: 'out',
      transfer_counterpart_space_id: toSpaceId,
    };

    const inMov: Movimiento = {
      ...outMov,
      id: crypto.randomUUID(),
      unidad: spaceIdToUnidad(toSpaceId),
      space_id: toSpaceId,
      subcategoria: 'Entrada',
      transfer_direction: 'in',
      transfer_counterpart_space_id: fromSpaceId,
    };

    setMovimientos(prev => [...prev, outMov, inMov]);
    db.movimientos.upsert([outMov, inMov]).catch(console.error);
  }, []);

  const removeTransferencia = useCallback((pairId: string) => {
    setMovimientos(prev => prev.filter(m => m.transfer_pair_id !== pairId));
    db.movimientos.deleteByPairId(pairId).catch(console.error);
  }, []);

  const addClienteMRR = useCallback((cliente: Omit<ClienteMRR, 'id'>) => {
    const newCliente: ClienteMRR = { ...cliente, id: crypto.randomUUID() };
    setClientesMRR(prev => [...prev, newCliente]);
    db.clientesMRR.upsert(newCliente).catch(console.error);
    return newCliente;
  }, []);

  const updateClienteMRR = useCallback((id: string, updates: Partial<Omit<ClienteMRR, 'id'>>) => {
    setClientesMRR(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      const updatedCliente = updated.find(c => c.id === id);
      if (updatedCliente) db.clientesMRR.upsert(updatedCliente).catch(console.error);
      return updated;
    });
  }, []);

  const removeClienteMRR = useCallback((id: string) => {
    setClientesMRR(prev => prev.filter(c => c.id !== id));
    db.clientesMRR.delete(id).catch(console.error);
  }, []);

  const registerMRRPayment = useCallback((clienteId: string, shouldDistribute: boolean = true) => {
    const cliente = clientesMRR.find(c => c.id === clienteId);
    if (!cliente) return;

    const today = new Date().toISOString().split('T')[0];

    addMovimiento({
      fecha: today,
      unidad: 'SM DIGITALS',
      tipo_movimiento: 'Ingreso',
      categoria: 'MRR',
      subcategoria: cliente.servicio,
      cliente_proveedor: cliente.cliente,
      descripcion: `Cobro: ${cliente.cliente} - ${cliente.servicio}`,
      metodo_pago: cliente.metodo_pago,
      monto: cliente.valor_mensual,
      recurrente: false,
      estado: 'Pagado',
      impacto: 'Core',
      cuenta: cliente.metodo_pago === 'Transferencia' ? 'Bancolombia' : 'Billetera',
    });

    if (shouldDistribute) {
      const baseSpaceId = SPACE_IDS.BUSINESS;
      const ingresoReal = cliente.valor_mensual;

      const seguridad = Math.round(ingresoReal * 0.15);
      const inversion = Math.round(ingresoReal * 0.25);
      const gastosBase = Math.round(ingresoReal * 0.50);
      const caprichos = ingresoReal - (seguridad + inversion + gastosBase);

      if (seguridad > 0) {
        setTimeout(() => {
          addTransferencia({
            fromSpaceId: baseSpaceId,
            toSpaceId: SPACE_IDS.BOLS_SEGURIDAD,
            monto: seguridad,
            fecha: today,
            descripcion: `Seguridad (15%): ${cliente.cliente}`,
            metodoPago: 'Interna',
            cuenta: 'Interna',
          });
        }, 50);
      }
      if (inversion > 0) {
        setTimeout(() => {
          addTransferencia({
            fromSpaceId: baseSpaceId,
            toSpaceId: SPACE_IDS.BOLS_INVERSION,
            monto: inversion,
            fecha: today,
            descripcion: `Inversión (25%): ${cliente.cliente}`,
            metodoPago: 'Interna',
            cuenta: 'Interna',
          });
        }, 100);
      }

      if (gastosBase > 0) {
        setTimeout(() => {
          addTransferencia({
            fromSpaceId: baseSpaceId,
            toSpaceId: SPACE_IDS.BOLS_GASTOS_BASE,
            monto: gastosBase,
            fecha: today,
            descripcion: `Gastos Base (50%): ${cliente.cliente}`,
            metodoPago: 'Interna',
            cuenta: 'Interna',
          });
        }, 150);
      }

      if (caprichos > 0) {
        setTimeout(() => {
          addTransferencia({
            fromSpaceId: baseSpaceId,
            toSpaceId: SPACE_IDS.BOLS_CAPRICHOS,
            monto: caprichos,
            fecha: today,
            descripcion: `Caprichos (10%): ${cliente.cliente}`,
            metodoPago: 'Interna',
            cuenta: 'Interna',
          });
        }, 200);
      }
    }
  }, [clientesMRR, addMovimiento, addTransferencia]);

  const addCuentaPorCobrar = useCallback((cuenta: Omit<CuentaPorCobrar, 'id' | 'created_at'>) => {
    const newCuenta: CuentaPorCobrar = { ...cuenta, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setCuentasPorCobrar(prev => [...prev, newCuenta]);
    db.cuentasPorCobrar.upsert(newCuenta).catch(console.error);
    return newCuenta;
  }, []);

  const marcarCuentaPorCobrar = useCallback((cuentaId: string, montoCobrado: number) => {
    setCuentasPorCobrar(prev => {
      const cuenta = prev.find(c => c.id === cuentaId);
      if (!cuenta) return prev;
      const newCobrado = Math.min(cuenta.monto, cuenta.monto_cobrado + montoCobrado);
      const newEstado: CuentaPorCobrar['estado'] =
        newCobrado >= cuenta.monto ? 'Cobrado' : newCobrado > 0 ? 'Parcial' : 'Pendiente';
      db.cuentasPorCobrar.update(cuentaId, { monto_cobrado: newCobrado, estado: newEstado }).catch(console.error);
      return prev.map(c => c.id === cuentaId ? { ...c, monto_cobrado: newCobrado, estado: newEstado } : c);
    });
  }, []);

  const removeCuentaPorCobrar = useCallback((cuentaId: string) => {
    setCuentasPorCobrar(prev => prev.filter(c => c.id !== cuentaId));
    db.cuentasPorCobrar.delete(cuentaId).catch(console.error);
  }, []);

  const updateDebt = useCallback((debtId: string, paymentAmount: number) => {
    const debt = deudas.find(d => d.id === debtId);
    if (!debt) return;

    const newPagado = debt.pagado + paymentAmount;
    const updatedDebt = {
      ...debt,
      pagado: newPagado,
      saldo_restante: debt.saldo_inicial - newPagado,
      estado: (debt.saldo_inicial - newPagado <= 0) ? 'Liquidado' as const : 'Al día' as const,
    };

    setDeudas(prev => prev.map(d => d.id === debtId ? updatedDebt : d));
    db.deudas.update(debtId, { pagado: updatedDebt.pagado, saldo_restante: updatedDebt.saldo_restante, estado: updatedDebt.estado }).catch(console.error);

    if (paymentAmount > 0) {
      addMovimiento({
        fecha: new Date().toISOString().split('T')[0],
        unidad: 'SM DIGITALS',
        tipo_movimiento: 'Gasto',
        categoria: 'Deuda',
        subcategoria: debt.tipo,
        cliente_proveedor: debt.acreedor,
        descripcion: `Pago cuota: ${debt.acreedor}`,
        metodo_pago: 'Transferencia',
        monto: paymentAmount,
        recurrente: false,
        estado: 'Pagado',
        impacto: 'Privado',
        cuenta: 'Bancolombia',
      });
    }
  }, [deudas, addMovimiento]);

  const undoDebtPayment = useCallback((debtId: string, paymentAmount: number) => {
    setDeudas(prev => {
      return prev.map(d => {
        if (d.id === debtId) {
          const newPagado = Math.max(0, d.pagado - paymentAmount);
          const updated = { ...d, pagado: newPagado, saldo_restante: d.saldo_inicial - newPagado };
          db.deudas.update(debtId, { pagado: updated.pagado, saldo_restante: updated.saldo_restante }).catch(console.error);
          return updated;
        }
        return d;
      });
    });
  }, []);

  const addProyecto = useCallback((proyecto: Omit<Proyecto, 'id'>) => {
    const newProyecto: Proyecto = { ...proyecto, id: crypto.randomUUID() };
    setProyectos(prev => [...prev, newProyecto]);
    db.proyectos.upsert(newProyecto).catch(console.error);

    // Si hay cobrado inicial, crear movimiento de ingreso automáticamente
    if (newProyecto.cobrado > 0) {
      const empresa = newProyecto.empresa ?? 'SM DIGITALS';
      const comisionPct = newProyecto.comision_pct ?? 100;
      const ingresoReal = Math.round(newProyecto.cobrado * (comisionPct / 100));
      addMovimiento({
        fecha: newProyecto.fecha_inicio,
        unidad: empresa,
        space_id: unidadToSpaceId(empresa),
        tipo_movimiento: 'Ingreso',
        categoria: 'Proyecto',
        subcategoria: newProyecto.tipo,
        cliente_proveedor: newProyecto.cliente,
        descripcion: `Pago Proyecto: ${newProyecto.nombre_proyecto} (${comisionPct}%)`,
        metodo_pago: 'Transferencia',
        monto: ingresoReal,
        recurrente: false,
        estado: 'Pagado',
        impacto: 'Core',
        cuenta: 'Bancolombia',
        proyecto_id: newProyecto.id,
      });
    }

    return newProyecto;
  }, [addMovimiento]);

  const removeProyecto = useCallback((id: string) => {
    setProyectos(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveData({ proyectos: updated });
      return updated;
    });
    db.proyectos.delete(id).catch(console.error);
  }, []);

  const updateProyecto = useCallback((id: string, updates: Partial<Omit<Proyecto, 'id'>>) => {
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    db.proyectos.update(id, updates).catch(console.error);
  }, []);

  const registrarPagoProyecto = useCallback((projectId: string, amount: number, method: string) => {
    const project = proyectos.find(p => p.id === projectId);
    if (!project) return;

    const newCobrado = project.cobrado + amount;
    const newPendiente = Math.max(0, project.valor_total - newCobrado);

    setProyectos(prev => prev.map(p =>
      p.id === projectId ? { ...p, cobrado: newCobrado, pendiente: newPendiente } : p
    ));
    db.proyectos.update(projectId, { cobrado: newCobrado, pendiente: newPendiente }).catch(console.error);

    const empresa = project.empresa ?? 'SM DIGITALS';
    const comisionPct = project.comision_pct ?? 100;
    const ingresoReal = Math.round(amount * (comisionPct / 100));

    addMovimiento({
      fecha: new Date().toISOString().split('T')[0],
      unidad: empresa,
      space_id: unidadToSpaceId(empresa),
      tipo_movimiento: 'Ingreso',
      categoria: 'Proyecto',
      subcategoria: project.tipo,
      cliente_proveedor: project.cliente,
      descripcion: `Pago Proyecto: ${project.nombre_proyecto} (${comisionPct}%)`,
      metodo_pago: method,
      monto: ingresoReal,
      recurrente: false,
      estado: 'Pagado',
      impacto: 'Core',
      cuenta: method === 'Transferencia' ? 'Bancolombia' : 'Billetera',
      proyecto_id: projectId,
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const baseSpaceId = unidadToSpaceId(empresa);
    const ahorro = Math.round(ingresoReal * 0.40);
    const personal = Math.round(ingresoReal * 0.30);
    const operativo = Math.round(ingresoReal * 0.20);

    if (ahorro > 0) {
      setTimeout(() => {
        addTransferencia({
          fromSpaceId: baseSpaceId,
          toSpaceId: SPACE_IDS.BOLS_SEGURIDAD,
          monto: ahorro,
          fecha: dateStr,
          descripcion: `Ahorro/Inversión (40%): ${project.nombre_proyecto}`,
          metodoPago: 'Interna',
          cuenta: 'Interna',
        });
      }, 50);
    }
    if (personal > 0) {
      setTimeout(() => {
        addTransferencia({
          fromSpaceId: baseSpaceId,
          toSpaceId: SPACE_IDS.PERSONAL,
          monto: personal,
          fecha: dateStr,
          descripcion: `Sueldo/Personal (30%): ${project.nombre_proyecto}`,
          metodoPago: 'Interna',
          cuenta: 'Interna',
        });
      }, 100);
    }
    if (operativo > 0) {
      setTimeout(() => {
        addTransferencia({
          fromSpaceId: baseSpaceId,
          toSpaceId: SPACE_IDS.BOLS_GASTOS_BASE,
          monto: operativo,
          fecha: dateStr,
          descripcion: `Costos (20%): ${project.nombre_proyecto}`,
          metodoPago: 'Interna',
          cuenta: 'Interna',
        });
      }, 150);
    }
  }, [proyectos, addMovimiento, addTransferencia]);

  const periods = useMemo(() => {
    const p = Array.from(new Set(movimientos.map(m => m.periodo || m.fecha.substring(0, 7)))).sort().reverse();
    return p.length > 0 ? p : [new Date().toISOString().substring(0, 7)];
  }, [movimientos]);

  // Balance por espacio (acumulado histórico, no por período)
  const balancesBySpace = useMemo(() => {
    const result: Record<string, SpaceBalance> = {};
    for (const sp of spaces) {
      result[sp.id] = {
        spaceId: sp.id,
        income: 0,
        expenses: 0,
        transfersIn: 0,
        transfersOut: 0,
        balance: 0,
        netCashFlow: 0,
      };
    }
    for (const m of movimientos) {
      const bucket = result[m.space_id];
      if (!bucket) continue;
      if (m.estado !== 'Pagado') continue;

      if (m.tipo_movimiento === 'Transferencia') {
        if (m.transfer_direction === 'in') bucket.transfersIn += m.monto;
        else if (m.transfer_direction === 'out') bucket.transfersOut += m.monto;
      } else if (m.tipo_movimiento === 'Ingreso') {
        bucket.income += m.monto;
      } else if (m.tipo_movimiento === 'Gasto') {
        bucket.expenses += m.monto;
      }
    }
    for (const id in result) {
      const b = result[id];
      b.netCashFlow = b.income - b.expenses;
      b.balance = b.netCashFlow + b.transfersIn - b.transfersOut;
    }
    return result;
  }, [movimientos, spaces]);

  const globalBalance = useMemo<SpaceBalance>(() => {
    const agg: SpaceBalance = {
      spaceId: 'global',
      income: 0,
      expenses: 0,
      transfersIn: 0,
      transfersOut: 0,
      balance: 0,
      netCashFlow: 0,
    };
    for (const id in balancesBySpace) {
      if (!BOLSILLO_SPACE_IDS.includes(id)) continue;
      const b = balancesBySpace[id];
      agg.income += b.income;
      agg.expenses += b.expenses;
      // Las transferencias internas se cancelan en la vista global
    }
    agg.netCashFlow = agg.income - agg.expenses;
    agg.balance = agg.netCashFlow;
    return agg;
  }, [balancesBySpace]);

  const importAllFromGoogleSheets = useCallback(async (accessToken: string) => {
    const spreadsheetId = await getSpreadsheetIdByName(accessToken, 'Finanzas SM DIGITALS');
    if (!spreadsheetId) throw new Error('No se encontró el archivo "Finanzas SM DIGITALS" en tu Google Drive.');

    const [movs, clients, projs, debts, budgets] = await Promise.all([
      getSheetValues(accessToken, spreadsheetId, 'Movimientos!A2:M'),
      getSheetValues(accessToken, spreadsheetId, 'Clientes_MRR!A2:G'),
      getSheetValues(accessToken, spreadsheetId, 'Proyectos!A2:I'),
      getSheetValues(accessToken, spreadsheetId, 'Deudas!A2:I'),
      getSheetValues(accessToken, spreadsheetId, 'Presupuestos!A2:F'),
    ]);

    const mappedMovs: Movimiento[] = movs.map((row: any[]) => {
      const unidad = row[3] as Movimiento['unidad'];
      const space_id =
        unidad === 'SM DIGITALS' ? 'sp_smdigitals'
        : 'sp_personal';
      const date = new Date(row[1] || new Date());
      return {
        id: row[0],
        fecha: row[1],
        periodo: row[2],
        año: date.getFullYear(),
        mes: date.getMonth() + 1,
        unidad,
        space_id,
        tipo_movimiento: row[4],
        categoria: row[5],
        subcategoria: row[6],
        cliente_proveedor: row[7],
        descripcion: row[8],
        metodo_pago: row[9],
        monto: Number(row[10]),
        recurrente: false,
        estado: row[11],
        impacto: 'Core',
        cuenta: row[12],
        created_at: new Date().toISOString(),
      };
    });

    const mappedClients: ClienteMRR[] = clients.map((row: any[]) => ({
      id: row[0], cliente: row[1], servicio: row[2], valor_mensual: Number(row[3]),
      dia_cobro: Number(row[4]), estado: row[5], metodo_pago: row[6],
      fecha_inicio: row[7] || new Date().toISOString().split('T')[0],
    }));

    const mappedProjs: Proyecto[] = projs.map((row: any[]) => ({
      id: row[0], cliente: row[1], nombre_proyecto: row[2], tipo: row[3],
      valor_total: Number(row[4]), anticipo: 0, cobrado: Number(row[5]), pendiente: Number(row[6]),
      fecha_inicio: row[7] || new Date().toISOString().split('T')[0],
      estado: row[7], rentabilidad_estimada: 0, fase: row[8],
    }));

    const mappedDebts: Deuda[] = debts.map((row: any[]) => ({
      id: row[0], acreedor: row[1], tipo: row[2], saldo_inicial: Number(row[3]),
      cuota_mensual: Number(row[4]), pagado: Number(row[5]), saldo_restante: Number(row[6]),
      fecha_pago: row[7], estado: row[8]
    }));

    const mappedBudgets: Presupuesto[] = budgets.map((row: any[]) => ({
      id: row[0], periodo: row[1], unidad: 'SM DIGITALS', categoria: row[2], presupuesto: Number(row[3]),
      real: Number(row[4]), diferencia: Number(row[5])
    }));

    if (mappedMovs.length > 0) setMovimientos(mappedMovs);
    if (mappedClients.length > 0) setClientesMRR(mappedClients);
    if (mappedProjs.length > 0) setProyectos(mappedProjs);
    if (mappedDebts.length > 0) setDeudas(mappedDebts);
    if (mappedBudgets.length > 0) setPresupuestos(mappedBudgets);

    // Persist imported data to Supabase
    if (mappedMovs.length > 0) db.movimientos.upsert(mappedMovs).catch(console.error);
    if (mappedClients.length > 0) mappedClients.forEach(c => db.clientesMRR.upsert(c).catch(console.error));
    if (mappedProjs.length > 0) mappedProjs.forEach(p => db.proyectos.upsert(p).catch(console.error));
    if (mappedDebts.length > 0) mappedDebts.forEach(d => db.deudas.upsert(d).catch(console.error));
    if (mappedBudgets.length > 0) mappedBudgets.forEach(b => db.presupuestos.upsert(b).catch(console.error));
  }, []);

  const syncAllToGoogleSheets = useCallback(async (accessToken: string) => {
    let spreadsheetId = await getSpreadsheetIdByName(accessToken, 'Finanzas SM DIGITALS');

    if (!spreadsheetId) {
      spreadsheetId = await createFinanceSpreadsheet(accessToken, 'Finanzas SM DIGITALS');
    }

    const dataMap: Record<string, any[][]> = {
      'Movimientos': [
        ['ID', 'Fecha', 'Periodo', 'Unidad', 'Tipo', 'Categoría', 'Subcat', 'Cliente', 'Descripción', 'Método', 'Monto', 'Estado', 'Cuenta'],
        ...movimientos.map(m => [m.id, m.fecha, m.periodo, m.unidad, m.tipo_movimiento, m.categoria, m.subcategoria, m.cliente_proveedor, m.descripcion, m.metodo_pago, m.monto, m.estado, m.cuenta])
      ],
      'Clientes_MRR': [
        ['ID', 'Cliente', 'Servicio', 'Monto Mensual', 'Día Cobro', 'Estado', 'Método'],
        ...clientesMRR.map(c => [c.id, c.cliente, c.servicio, c.valor_mensual, c.dia_cobro, c.estado, c.metodo_pago])
      ],
      'Proyectos': [
        ['ID', 'Cliente', 'Proyecto', 'Tipo', 'Total', 'Cobrado', 'Pendiente', 'Estado', 'Fase'],
        ...proyectos.map(p => [p.id, p.cliente, p.nombre_proyecto, p.tipo, p.valor_total, p.cobrado, p.pendiente, p.estado, p.fase])
      ],
      'Deudas': [
        ['ID', 'Acreedor', 'Tipo', 'S. Inicial', 'Cuota', 'Pagado', 'S. Actual', 'Vencimiento', 'Estado'],
        ...deudas.map(d => [d.id, d.acreedor, d.tipo, d.saldo_inicial, d.cuota_mensual, d.pagado, d.saldo_restante, d.fecha_pago, d.estado])
      ],
      'Presupuestos': [
        ['ID', 'Periodo', 'Categoría', 'Presupuesto', 'Real', 'Diferencia'],
        ...presupuestos.map(p => [p.id, p.periodo, p.categoria, p.presupuesto, p.real, p.diferencia])
      ]
    };

    for (const [sheetName, values] of Object.entries(dataMap)) {
      await updateSheetValues(accessToken, spreadsheetId, `${sheetName}!A1`, values);
    }

    return spreadsheetId;
  }, [movimientos, clientesMRR, proyectos, deudas, presupuestos]);

  // Stats filtrados por vista (espacio) + período. Las transferencias se excluyen.
  const stats = useMemo(() => {
    const inView = movimientos.filter(m => matchesView(m, selectedView, spaces));
    const realInView = inView.filter(isReal);

    const filteredByPeriod = realInView.filter(
      m => (m.periodo || m.fecha.substring(0, 7)) === selectedPeriod && m.estado === 'Pagado'
    );

    const allPeriods = Array.from(new Set(realInView.map(m => m.periodo || m.fecha.substring(0, 7)))).sort();
    const chart = allPeriods.map(p => {
      const perMovs = realInView.filter(m => (m.periodo || m.fecha.substring(0, 7)) === p && m.estado === 'Pagado');
      const inc = perMovs.filter(m => m.tipo_movimiento === 'Ingreso').reduce((acc, m) => acc + m.monto, 0);
      const exp = perMovs.filter(m => m.tipo_movimiento === 'Gasto').reduce((acc, m) => acc + m.monto, 0);
      return { name: p, ingresos: inc, gastos: exp, utilidad: inc - exp };
    });

    // MRR solo aplica a vista business o global
    const mrrApplies = selectedView === 'global' || selectedView === 'business' || spaces.find(s => s.id === selectedView)?.type === 'business';
    const mrr = mrrApplies
      ? clientesMRR.filter(c => c.estado === 'Activo').reduce((acc, current) => acc + current.valor_mensual, 0)
      : 0;

    return {
      totalIncome: realInView.filter(m => m.tipo_movimiento === 'Ingreso' && m.estado === 'Pagado').reduce((acc, m) => acc + m.monto, 0),
      totalExpenses: realInView.filter(m => m.tipo_movimiento === 'Gasto' && m.estado === 'Pagado').reduce((acc, m) => acc + m.monto, 0),
      mrr,
      totalDebt: deudas.reduce((acc, current) => acc + current.saldo_restante, 0),
      chartData: chart,
      periodIncome: filteredByPeriod.filter(m => m.tipo_movimiento === 'Ingreso').reduce((acc, m) => acc + m.monto, 0),
      periodExpenses: filteredByPeriod.filter(m => m.tipo_movimiento === 'Gasto').reduce((acc, m) => acc + m.monto, 0),
    };
  }, [movimientos, clientesMRR, deudas, selectedPeriod, selectedView, spaces]);

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(
      m => matchesView(m, selectedView, spaces) && (m.periodo || m.fecha.substring(0, 7)) === selectedPeriod
    );
  }, [movimientos, selectedView, selectedPeriod, spaces]);

  const value: FinanceContextType = {
    movimientos,
    filteredMovimientos,
    clientesMRR,
    proyectos,
    deudas,
    presupuestos,
    spaces,
    cuentasPorCobrar,
    selectedView,
    setSelectedView,
    selectedPeriod,
    setSelectedPeriod,
    periods,
    syncAllToGoogleSheets,
    importAllFromGoogleSheets,
    addMovimiento,
    removeMovimiento,
    addTransferencia,
    removeTransferencia,
    addClienteMRR,
    updateClienteMRR,
    removeClienteMRR,
    registerMRRPayment,
    addProyecto,
    removeProyecto,
    updateProyecto,
    registrarPagoProyecto,
    updateDebt,
    undoDebtPayment,
    addCuentaPorCobrar,
    marcarCuentaPorCobrar,
    removeCuentaPorCobrar,
    balancesBySpace,
    globalBalance,
    stats,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};