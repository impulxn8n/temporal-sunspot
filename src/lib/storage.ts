import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto, Space } from '../types';
import { mockMovimientos, mockClientesMRR, mockProyectos, mockDeudas, mockPresupuestos } from './mockData';
import { defaultSpaces, migrateMovimientoSpace } from './spaces';

const KEYS = {
  MOVIMIENTOS: 'finance_v16_movimientos',
  CLIENTES_MRR: 'finance_v16_clientes_mrr',
  PROYECTOS: 'finance_v16_proyectos',
  DEUDAS: 'finance_v16_deudas',
  PRESUPUESTOS: 'finance_v16_presupuestos',
  SPACES: 'finance_v17_spaces',
};

export const loadData = () => {
  const rawMovs: Movimiento[] = JSON.parse(localStorage.getItem(KEYS.MOVIMIENTOS) || JSON.stringify(mockMovimientos));
  const movimientos = rawMovs.map(migrateMovimientoSpace);

  const clientesMRR = JSON.parse(localStorage.getItem(KEYS.CLIENTES_MRR) || JSON.stringify(mockClientesMRR));
  const proyectos = JSON.parse(localStorage.getItem(KEYS.PROYECTOS) || JSON.stringify(mockProyectos));
  const deudas = JSON.parse(localStorage.getItem(KEYS.DEUDAS) || JSON.stringify(mockDeudas));
  const presupuestos = JSON.parse(localStorage.getItem(KEYS.PRESUPUESTOS) || JSON.stringify(mockPresupuestos));
  const spaces: Space[] = JSON.parse(localStorage.getItem(KEYS.SPACES) || JSON.stringify(defaultSpaces));

  return { movimientos, clientesMRR, proyectos, deudas, presupuestos, spaces };
};

export const saveData = (data: {
  movimientos?: Movimiento[];
  clientesMRR?: ClienteMRR[];
  proyectos?: Proyecto[];
  deudas?: Deuda[];
  presupuestos?: Presupuesto[];
  spaces?: Space[];
}) => {
  if (data.movimientos) localStorage.setItem(KEYS.MOVIMIENTOS, JSON.stringify(data.movimientos));
  if (data.clientesMRR) localStorage.setItem(KEYS.CLIENTES_MRR, JSON.stringify(data.clientesMRR));
  if (data.proyectos) localStorage.setItem(KEYS.PROYECTOS, JSON.stringify(data.proyectos));
  if (data.deudas) localStorage.setItem(KEYS.DEUDAS, JSON.stringify(data.deudas));
  if (data.presupuestos) localStorage.setItem(KEYS.PRESUPUESTOS, JSON.stringify(data.presupuestos));
  if (data.spaces) localStorage.setItem(KEYS.SPACES, JSON.stringify(data.spaces));
};
