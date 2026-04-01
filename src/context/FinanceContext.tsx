import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto } from '../types';
import { loadData, saveData } from '../lib/storage';
import { createFinanceSpreadsheet, updateSheetValues, getSpreadsheetIdByName, getSheetValues } from '../lib/googleSheets';

interface FinanceContextType {
  movimientos: Movimiento[];
  filteredMovimientos: Movimiento[];
  clientesMRR: ClienteMRR[];
  proyectos: Proyecto[];
  deudas: Deuda[];
  presupuestos: Presupuesto[];
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  periods: string[];
  syncAllToGoogleSheets: (accessToken: string) => Promise<string>;
  importAllFromGoogleSheets: (accessToken: string) => Promise<void>;
  addMovimiento: (mov: Omit<Movimiento, 'id' | 'created_at' | 'periodo' | 'año' | 'mes'>) => Movimiento;
  addProyecto: (proyecto: Omit<Proyecto, 'id'>, syncCalendar?: boolean) => void;
  registrarPagoProyecto: (projectId: string, amount: number, method: string) => void;
  updateDebt: (debtId: string, paymentAmount: number) => void;
  undoDebtPayment: (debtId: string, paymentAmount: number) => void;
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

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [clientesMRR, setClientesMRR] = useState<ClienteMRR[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    const data = loadData();
    setMovimientos(data.movimientos);
    setClientesMRR(data.clientesMRR);
    setProyectos(data.proyectos);
    setDeudas(data.deudas);
    setPresupuestos(data.presupuestos);
  }, []);

  const addMovimiento = useCallback((mov: Omit<Movimiento, 'id' | 'created_at' | 'periodo' | 'año' | 'mes'>) => {
    const date = new Date(mov.fecha);
    const id = crypto.randomUUID();
    const newMov: Movimiento = {
      ...mov,
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

  const updateDebt = useCallback((debtId: string, paymentAmount: number) => {
    setDeudas(prev => {
      const updated = prev.map(d => {
        if (d.id === debtId) {
          const newPagado = d.pagado + paymentAmount;
          return { ...d, pagado: newPagado, saldo_restante: d.saldo_inicial - newPagado };
        }
        return d;
      });
      saveData({ deudas: updated });
      return updated;
    });
  }, []);

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
      
      // Registrar el movimiento de ingreso
      addMovimiento({
        fecha: new Date().toISOString().split('T')[0],
        unidad: 'SM DIGITALS',
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

  const importAllFromGoogleSheets = useCallback(async (accessToken: string) => {
    const spreadsheetId = await getSpreadsheetIdByName(accessToken, 'Finanzas SM DIGITALS');
    if (!spreadsheetId) throw new Error('No se encontró el archivo "Finanzas SM DIGITALS" en tu Google Drive.');

    // Fetch values for all sheets
    const [movs, clients, projs, debts, budgets] = await Promise.all([
      getSheetValues(accessToken, spreadsheetId, 'Movimientos!A2:M'),
      getSheetValues(accessToken, spreadsheetId, 'Clientes_MRR!A2:G'),
      getSheetValues(accessToken, spreadsheetId, 'Proyectos!A2:I'),
      getSheetValues(accessToken, spreadsheetId, 'Deudas!A2:I'),
      getSheetValues(accessToken, spreadsheetId, 'Presupuestos!A2:F'),
    ]);

    // Map rows to objects
    const mappedMovs: Movimiento[] = movs.map((row: any[]) => ({
      id: row[0], fecha: row[1], periodo: row[2], unidad: row[3], tipo_movimiento: row[4],
      categoria: row[5], subcategoria: row[6], cliente_proveedor: row[7], descripcion: row[8],
      metodo_pago: row[9], monto: Number(row[10]), estado: row[11], cuenta: row[12],
      created_at: new Date().toISOString()
    }));

    const mappedClients: ClienteMRR[] = clients.map((row: any[]) => ({
      id: row[0], cliente: row[1], servicio: row[2], valor_mensual: Number(row[3]),
      dia_cobro: Number(row[4]), estado: row[5], metodo_pago: row[6]
    }));

    const mappedProjs: Proyecto[] = projs.map((row: any[]) => ({
      id: row[0], cliente: row[1], nombre_proyecto: row[2], tipo: row[3],
      valor_total: Number(row[4]), cobrado: Number(row[5]), pendiente: Number(row[6]),
      estado: row[7], fase: row[8]
    }));

    const mappedDebts: Deuda[] = debts.map((row: any[]) => ({
      id: row[0], acreedor: row[1], tipo: row[2], saldo_inicial: Number(row[3]),
      cuota_mensual: Number(row[4]), pagado: Number(row[5]), saldo_restante: Number(row[6]),
      fecha_pago: row[7], estado: row[8]
    }));

    const mappedBudgets: Presupuesto[] = budgets.map((row: any[]) => ({
      id: row[0], periodo: row[1], categoria: row[2], presupuesto: Number(row[3]),
      real: Number(row[4]), diferencia: Number(row[5])
    }));

    // Update state and storage
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

    // Prepare data for each sheet
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

    // Update all sheets
    for (const [sheetName, values] of Object.entries(dataMap)) {
      await updateSheetValues(accessToken, spreadsheetId, `${sheetName}!A1`, values);
    }

    return spreadsheetId;
  }, [movimientos, clientesMRR, proyectos, deudas, presupuestos]);

  const stats = useMemo(() => {
    const filteredByPeriod = movimientos.filter(m => (m.periodo || m.fecha.substring(0, 7)) === selectedPeriod && m.estado === 'Pagado');
    
    // Chart data calculation
    const allPeriods = Array.from(new Set(movimientos.map(m => m.periodo || m.fecha.substring(0, 7)))).sort();
    const chart = allPeriods.map(p => {
      const perMovs = movimientos.filter(m => (m.periodo || m.fecha.substring(0, 7)) === p && m.estado === 'Pagado');
      const inc = perMovs.filter(m => m.tipo_movimiento === 'Ingreso').reduce((acc, m) => acc + m.monto, 0);
      const exp = perMovs.filter(m => m.tipo_movimiento === 'Gasto').reduce((acc, m) => acc + m.monto, 0);
      return { name: p, ingresos: inc, gastos: exp, utilidad: inc - exp };
    });

    return {
      totalIncome: movimientos.filter(m => m.tipo_movimiento === 'Ingreso' && m.estado === 'Pagado').reduce((acc, current) => acc + current.monto, 0),
      totalExpenses: movimientos.filter(m => m.tipo_movimiento === 'Gasto' && m.estado === 'Pagado').reduce((acc, current) => acc + current.monto, 0),
      mrr: clientesMRR.filter(c => c.estado === 'Activo').reduce((acc, current) => acc + current.valor_mensual, 0),
      totalDebt: deudas.reduce((acc, current) => acc + current.saldo_restante, 0),
      chartData: chart,
      periodIncome: filteredByPeriod.filter(m => m.tipo_movimiento === 'Ingreso').reduce((acc, m) => acc + m.monto, 0),
      periodExpenses: filteredByPeriod.filter(m => m.tipo_movimiento === 'Gasto').reduce((acc, m) => acc + m.monto, 0),
    };
  }, [movimientos, clientesMRR, deudas, selectedPeriod]);

  const value = {
    movimientos,
    filteredMovimientos: movimientos.filter(m => (m.periodo || m.fecha.substring(0, 7)) === selectedPeriod),
    clientesMRR,
    proyectos,
    deudas,
    presupuestos,
    selectedPeriod,
    setSelectedPeriod,
    periods,
    syncAllToGoogleSheets,
    importAllFromGoogleSheets,
    addMovimiento,
    addProyecto,
    registrarPagoProyecto,
    updateDebt,
    undoDebtPayment,
    stats
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
