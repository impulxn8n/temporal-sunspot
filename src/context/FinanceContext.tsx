import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto, Space, SpaceView, CuentaPorCobrar } from '../types';
import { loadData, saveData } from '../lib/storage';
import { spaceIdToUnidad, unidadToSpaceId } from '../lib/spaces';
import { createFinanceSpreadsheet, updateSheetValues, getSpreadsheetIdByName, getSheetValues } from '../lib/googleSheets';

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
  addProyecto: (proyecto: Omit<Proyecto, 'id'>, syncCalendar?: boolean) => void;
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

  useEffect(() => {
    const data = loadData();
    setMovimientos(data.movimientos);
    setClientesMRR(data.clientesMRR);
    setProyectos(data.proyectos);
    setDeudas(data.deudas);
    setPresupuestos(data.presupuestos);
    setSpaces(data.spaces);
    setCuentasPorCobrar(data.cuentasPorCobrar);
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

    setMovimientos(prev => {
      const updated = [...prev, newMov];
      saveData({ movimientos: updated });
      return updated;
    });
    return newMov;
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

    setMovimientos(prev => {
      const updated = [...prev, outMov, inMov];
      saveData({ movimientos: updated });
      return updated;
    });
  }, []);

  const removeTransferencia = useCallback((pairId: string) => {
    setMovimientos(prev => {
      const updated = prev.filter(m => m.transfer_pair_id !== pairId);
      saveData({ movimientos: updated });
      return updated;
    });
  }, []);

  const addClienteMRR = useCallback((cliente: Omit<ClienteMRR, 'id'>) => {
    const newCliente: ClienteMRR = { ...cliente, id: crypto.randomUUID() };
    setClientesMRR(prev => {
      const updated = [...prev, newCliente];
      saveData({ clientesMRR: updated });
      return updated;
    });
    return newCliente;
  }, []);

  const updateClienteMRR = useCallback((id: string, updates: Partial<Omit<ClienteMRR, 'id'>>) => {
    setClientesMRR(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      saveData({ clientesMRR: updated });
      return updated;
    });
  }, []);

  const removeClienteMRR = useCallback((id: string) => {
    setClientesMRR(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveData({ clientesMRR: updated });
      return updated;
    });
  }, []);

  const addCuentaPorCobrar = useCallback((cuenta: Omit<CuentaPorCobrar, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const newCuenta = { ...cuenta, id, created_at: new Date().toISOString() };
    setCuentasPorCobrar(prev => {
      const updated = [...prev, newCuenta];
      saveData({ cuentasPorCobrar: updated });
      return updated;
    });
    return newCuenta;
  }, []);

  const marcarCuentaPorCobrar = useCallback((cuentaId: string, montoCobrado: number) => {
    setCuentasPorCobrar(prev => {
      const cuenta = prev.find(c => c.id === cuentaId);
      if (!cuenta) return prev;

      const newCobrado = Math.min(cuenta.monto, cuenta.monto_cobrado + montoCobrado);
      const newEstado: CuentaPorCobrar['estado'] =
        newCobrado >= cuenta.monto ? 'Cobrado'
        : newCobrado > 0 ? 'Parcial'
        : 'Pendiente';

      const updated = prev.map(c =>
        c.id === cuentaId ? { ...c, monto_cobrado: newCobrado, estado: newEstado } : c
      );
      saveData({ cuentasPorCobrar: updated });
      return updated;
    });
  }, []);

  const removeCuentaPorCobrar = useCallback((cuentaId: string) => {
    setCuentasPorCobrar(prev => {
      const updated = prev.filter(c => c.id !== cuentaId);
      saveData({ cuentasPorCobrar: updated });
      return updated;
    });
  }, []);

  const updateDebt = useCallback((debtId: string, paymentAmount: number) => {
    let debtToUpdate: any = null;

    setDeudas(prev => {
      const debt = prev.find(d => d.id === debtId);
      if (!debt) return prev;

      const newPagado = debt.pagado + paymentAmount;
      const updatedDebt = { 
        ...debt, 
        pagado: newPagado, 
        saldo_restante: debt.saldo_inicial - newPagado,
        estado: (debt.saldo_inicial - newPagado <= 0) ? 'Liquidado' as const : 'Al día' as const
      };
      debtToUpdate = updatedDebt;

      const updated = prev.map(d => d.id === debtId ? updatedDebt : d);
      saveData({ deudas: updated });
      return updated;
    });

    // Registrar movimiento de gasto fuera del setter de estado
    if (paymentAmount > 0) {
      setTimeout(() => {
        addMovimiento({
          fecha: new Date().toISOString().split('T')[0],
          unidad: 'Personal',
          tipo_movimiento: 'Gasto',
          categoria: 'Deuda',
          subcategoria: debtToUpdate?.tipo || 'Pago',
          cliente_proveedor: debtToUpdate?.acreedor || 'Acreedor',
          descripcion: `Pago cuota: ${debtToUpdate?.acreedor || ''}`,
          metodo_pago: 'Transferencia',
          monto: paymentAmount,
          recurrente: false,
          estado: 'Pagado',
          impacto: 'Privado',
          cuenta: 'Bancolombia'
        });
      }, 0);
    }
  }, [addMovimiento]);

  const undoDebtPayment = useCallback((debtId: string, paymentAmount: number) => {
    setDeudas(prev => {
      const updated = prev.map(d => {
        if (d.id === debtId) {
          const newPagado = Math.max(0, d.pagado - paymentAmount);
          return { ...d, pagado: newPagado, saldo_restante: d.saldo_inicial - newPagado };
        }
        return d;
      });
      saveData({ deudas: updated });
      return updated;
    });
  }, []);

  const addProyecto = useCallback((proyecto: Omit<Proyecto, 'id'>) => {
    const id = crypto.randomUUID();
    const newProyecto = { ...proyecto, id };
    setProyectos(prev => {
      const updated = [...prev, newProyecto];
      saveData({ proyectos: updated });
      return updated;
    });
    return newProyecto;
  }, []);

  const registrarPagoProyecto = useCallback((projectId: string, amount: number, method: string) => {
    setProyectos(prev => {
      const project = prev.find(p => p.id === projectId);
      if (!project) return prev;

      const newCobrado = project.cobrado + amount;
      const newPendiente = Math.max(0, project.valor_total - newCobrado);

      const updatedProyectos = prev.map(p =>
        p.id === projectId ? { ...p, cobrado: newCobrado, pendiente: newPendiente } : p
      );

      addMovimiento({
        fecha: new Date().toISOString().split('T')[0],
        unidad: 'SM DIGITALS',
        space_id: 'sp_smdigitals',
        tipo_movimiento: 'Ingreso',
        categoria: 'Proyecto',
        subcategoria: project.tipo,
        cliente_proveedor: project.cliente,
        descripcion: `Pago Proyecto: ${project.nombre_proyecto}`,
        metodo_pago: method,
        monto: amount,
        recurrente: false,
        estado: 'Pagado',
        impacto: 'Core',
        cuenta: method === 'Transferencia' ? 'Bancolombia' : 'Billetera',
        proyecto_id: projectId
      });

      saveData({ proyectos: updatedProyectos });
      return updatedProyectos;
    });
  }, [addMovimiento]);

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

    saveData({
      movimientos: mappedMovs,
      clientesMRR: mappedClients,
      proyectos: mappedProjs,
      deudas: mappedDebts,
      presupuestos: mappedBudgets
    });
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
    addTransferencia,
    removeTransferencia,
    addClienteMRR,
    updateClienteMRR,
    removeClienteMRR,
    addProyecto,
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
