import type { Movimiento, ClienteMRR, Deuda, Proyecto, Space, SpaceView } from '../types';
import { SPACE_IDS } from './spaces';

export interface ProjectionPoint {
  date: string;          // ISO date yyyy-mm-dd
  label: string;         // dd/mm
  balance: number;       // saldo proyectado al cierre del día
  inflows: number;       // entradas ese día
  outflows: number;      // salidas ese día
  events: ProjectionEvent[];
}

export interface ProjectionEvent {
  type: 'mrr' | 'debt' | 'project' | 'recurring_expense';
  description: string;
  amount: number;        // positivo si entra, negativo si sale
}

export interface ProjectionResult {
  startBalance: number;
  endBalance: number;
  minBalance: number;
  minBalanceDate: string;
  totalInflows: number;
  totalOutflows: number;
  points: ProjectionPoint[];
  daysToZero: number | null;   // días hasta caja en cero (null si no llega)
}

interface ProjectionInput {
  movimientos: Movimiento[];
  clientesMRR: ClienteMRR[];
  deudas: Deuda[];
  proyectos: Proyecto[];
  spaces: Space[];
  view: SpaceView;
  days: number;
  startDate?: Date;
}

const matchesView = (spaceId: string, view: SpaceView, spaces: Space[]): boolean => {
  if (view === 'global') return true;
  if (view === 'personal') return spaces.some(s => s.id === spaceId && s.type === 'personal');
  if (view === 'business') return spaces.some(s => s.id === spaceId && s.type === 'business');
  return spaceId === view;
};

// Las deudas/MRR/proyectos pertenecen a SM DIGITALS por modelo actual.
const businessVisibleInView = (view: SpaceView, spaces: Space[]): boolean => {
  if (view === 'global' || view === 'business') return true;
  if (view === 'personal') return false;
  const sp = spaces.find(s => s.id === view);
  return sp?.type === 'business';
};

const fmtDate = (d: Date) => d.toISOString().substring(0, 10);
const fmtLabel = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

export const projectCashFlow = ({
  movimientos,
  clientesMRR,
  deudas,
  proyectos,
  spaces,
  view,
  days,
  startDate = new Date(),
}: ProjectionInput): ProjectionResult => {
  // Saldo inicial = balance histórico hasta la fecha de inicio (movimientos pagados, sin transferencias en vista global)
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  let startBalance = 0;
  for (const m of movimientos) {
    if (m.estado !== 'Pagado') continue;
    if (!matchesView(m.space_id, view, spaces)) continue;
    const mDate = new Date(m.fecha);
    if (mDate > start) continue;

    if (m.tipo_movimiento === 'Ingreso') startBalance += m.monto;
    else if (m.tipo_movimiento === 'Gasto') startBalance -= m.monto;
    else if (m.tipo_movimiento === 'Transferencia') {
      // Solo afectan balance dentro de un espacio específico, no en global (se cancelan)
      if (view !== 'global') {
        if (m.transfer_direction === 'in') startBalance += m.monto;
        else if (m.transfer_direction === 'out') startBalance -= m.monto;
      }
    }
  }

  const businessVisible = businessVisibleInView(view, spaces);

  // Construir eventos futuros por día
  const eventsByDate: Record<string, ProjectionEvent[]> = {};

  // 1. MRR (recurring income) — solo si business visible
  if (businessVisible) {
    const activeMRR = clientesMRR.filter(c => c.estado === 'Activo');
    for (let offset = 1; offset <= days; offset++) {
      const target = new Date(start);
      target.setDate(start.getDate() + offset);
      const dayOfMonth = target.getDate();
      for (const c of activeMRR) {
        if (c.dia_cobro === dayOfMonth) {
          const key = fmtDate(target);
          (eventsByDate[key] ||= []).push({
            type: 'mrr',
            description: `MRR: ${c.cliente}`,
            amount: c.valor_mensual,
          });
        }
      }
    }
  }

  // 2. Deudas (cuotas) — pertenecen al espacio personal en este modelo (las deudas se pagan desde Personal)
  // Para vista personal/global se cuentan; para business pura no.
  const debtsCountInView = view !== 'business' && !(spaces.find(s => s.id === view)?.type === 'business');
  if (debtsCountInView) {
    for (const d of deudas) {
      if (d.estado === 'Liquidado' || d.saldo_restante <= 0) continue;
      // fecha_pago suele ser un número o yyyy-mm-dd; tomamos el día del mes
      const payDay = parseInt(String(d.fecha_pago).split('-').pop() || String(d.fecha_pago), 10);
      if (isNaN(payDay)) continue;
      for (let offset = 1; offset <= days; offset++) {
        const target = new Date(start);
        target.setDate(start.getDate() + offset);
        if (target.getDate() === payDay) {
          const key = fmtDate(target);
          (eventsByDate[key] ||= []).push({
            type: 'debt',
            description: `Cuota: ${d.acreedor}`,
            amount: -d.cuota_mensual,
          });
        }
      }
    }
  }

  // 3. Proyectos con saldo pendiente — solo business visible
  if (businessVisible) {
    for (const p of proyectos) {
      if (p.estado === 'Cancelado' || p.pendiente <= 0) continue;
      // Si tiene fecha_pago_2 y cae en el rango, asumimos que se cobra ahí
      const candidates = [p.fecha_pago_1, p.fecha_pago_2].filter(Boolean) as string[];
      for (const f of candidates) {
        const fDate = new Date(f);
        if (fDate < start) continue;
        const diffDays = Math.floor((fDate.getTime() - start.getTime()) / 86400000);
        if (diffDays > days) continue;
        const key = fmtDate(fDate);
        (eventsByDate[key] ||= []).push({
          type: 'project',
          description: `Proyecto: ${p.nombre_proyecto}`,
          amount: p.pendiente / candidates.length,
        });
      }
    }
  }

  // 4. Gastos recurrentes (movimientos con recurrente=true): proyectar copia mensual
  const recurringExpenses = movimientos.filter(m =>
    m.recurrente &&
    m.tipo_movimiento === 'Gasto' &&
    matchesView(m.space_id, view, spaces)
  );
  // Usamos el último mes pagado como template — agrupamos por (categoría+cliente) y tomamos el día del mes.
  const seen = new Set<string>();
  const templates: { day: number; amount: number; description: string; spaceId: string }[] = [];
  for (const m of recurringExpenses.sort((a, b) => b.fecha.localeCompare(a.fecha))) {
    const key = `${m.categoria}|${m.cliente_proveedor}|${m.subcategoria}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const day = new Date(m.fecha).getDate();
    templates.push({
      day,
      amount: m.monto,
      description: `${m.categoria}: ${m.cliente_proveedor}`,
      spaceId: m.space_id,
    });
  }
  for (let offset = 1; offset <= days; offset++) {
    const target = new Date(start);
    target.setDate(start.getDate() + offset);
    for (const t of templates) {
      if (target.getDate() === t.day) {
        const key = fmtDate(target);
        (eventsByDate[key] ||= []).push({
          type: 'recurring_expense',
          description: t.description,
          amount: -t.amount,
        });
      }
    }
  }

  // Recorrer día a día
  const points: ProjectionPoint[] = [];
  let balance = startBalance;
  let totalInflows = 0;
  let totalOutflows = 0;
  let minBalance = startBalance;
  let minBalanceDate = fmtDate(start);
  let daysToZero: number | null = null;

  for (let offset = 1; offset <= days; offset++) {
    const target = new Date(start);
    target.setDate(start.getDate() + offset);
    const key = fmtDate(target);
    const dayEvents = eventsByDate[key] || [];
    let inflows = 0;
    let outflows = 0;
    for (const e of dayEvents) {
      if (e.amount > 0) inflows += e.amount;
      else outflows += -e.amount;
    }
    balance += inflows - outflows;
    totalInflows += inflows;
    totalOutflows += outflows;

    if (balance < minBalance) {
      minBalance = balance;
      minBalanceDate = key;
    }
    if (daysToZero === null && balance <= 0) daysToZero = offset;

    points.push({
      date: key,
      label: fmtLabel(target),
      balance,
      inflows,
      outflows,
      events: dayEvents,
    });
  }

  return {
    startBalance,
    endBalance: balance,
    minBalance,
    minBalanceDate,
    totalInflows,
    totalOutflows,
    points,
    daysToZero,
  };
};

// Helper: cuánto se puede retirar del negocio sin que la caja proyectada baje de un umbral.
export const calcularRetiroSeguro = (
  result: ProjectionResult,
  minimoSeguridad: number = 0
): number => {
  return Math.max(0, result.minBalance - minimoSeguridad);
};

export { SPACE_IDS };
