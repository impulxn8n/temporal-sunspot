import { supabase } from './supabase';
import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto, CuentaPorCobrar } from '../types';

const handle = (error: any, context: string) => {
  if (error) console.error(`[Supabase] ${context}:`, error.message);
};

export const db = {
  movimientos: {
    load: async (): Promise<Movimiento[]> => {
      const { data, error } = await supabase.from('movimientos').select('*');
      handle(error, 'load movimientos');
      return (data as Movimiento[]) ?? [];
    },
    replace: async (rows: Movimiento[]) => {
      const { error: delErr } = await supabase.from('movimientos').delete().neq('id', '__none__');
      handle(delErr, 'delete movimientos');
      if (rows.length === 0) return;
      const { error } = await supabase.from('movimientos').insert(rows);
      handle(error, 'insert movimientos');
    },
    upsert: async (rows: Movimiento[]) => {
      if (rows.length === 0) return;
      const { error } = await supabase.from('movimientos').upsert(rows, { onConflict: 'id' });
      handle(error, 'upsert movimientos');
    },
    deleteById: async (id: string) => {
      const { error } = await supabase.from('movimientos').delete().eq('id', id);
      handle(error, 'delete movimiento');
    },
    deleteByPairId: async (pairId: string) => {
      const { error } = await supabase.from('movimientos').delete().eq('transfer_pair_id', pairId);
      handle(error, 'delete transferencia');
    },
  },

  clientesMRR: {
    load: async (): Promise<ClienteMRR[]> => {
      const { data, error } = await supabase.from('clientes_mrr').select('*');
      handle(error, 'load clientes_mrr');
      return (data as ClienteMRR[]) ?? [];
    },
    upsert: async (row: ClienteMRR) => {
      const { error } = await supabase.from('clientes_mrr').upsert(row, { onConflict: 'id' });
      handle(error, 'upsert cliente_mrr');
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('clientes_mrr').delete().eq('id', id);
      handle(error, 'delete cliente_mrr');
    },
  },

  proyectos: {
    load: async (): Promise<Proyecto[]> => {
      const { data, error } = await supabase.from('proyectos').select('*');
      handle(error, 'load proyectos');
      return (data as Proyecto[]) ?? [];
    },
    upsert: async (row: Proyecto) => {
      const { error } = await supabase.from('proyectos').upsert(row, { onConflict: 'id' });
      handle(error, 'upsert proyecto');
    },
    update: async (id: string, updates: Partial<Proyecto>) => {
      const { error } = await supabase.from('proyectos').update(updates).eq('id', id);
      handle(error, 'update proyecto');
    },
  },

  deudas: {
    load: async (): Promise<Deuda[]> => {
      const { data, error } = await supabase.from('deudas').select('*');
      handle(error, 'load deudas');
      return (data as Deuda[]) ?? [];
    },
    update: async (id: string, updates: Partial<Deuda>) => {
      const { error } = await supabase.from('deudas').update(updates).eq('id', id);
      handle(error, 'update deuda');
    },
    upsert: async (row: Deuda) => {
      const { error } = await supabase.from('deudas').upsert(row, { onConflict: 'id' });
      handle(error, 'upsert deuda');
    },
  },

  cuentasPorCobrar: {
    load: async (): Promise<CuentaPorCobrar[]> => {
      const { data, error } = await supabase.from('cuentas_por_cobrar').select('*');
      handle(error, 'load cuentas_por_cobrar');
      return (data as CuentaPorCobrar[]) ?? [];
    },
    upsert: async (row: CuentaPorCobrar) => {
      const { error } = await supabase.from('cuentas_por_cobrar').upsert(row, { onConflict: 'id' });
      handle(error, 'upsert cuenta_por_cobrar');
    },
    update: async (id: string, updates: Partial<CuentaPorCobrar>) => {
      const { error } = await supabase.from('cuentas_por_cobrar').update(updates).eq('id', id);
      handle(error, 'update cuenta_por_cobrar');
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('cuentas_por_cobrar').delete().eq('id', id);
      handle(error, 'delete cuenta_por_cobrar');
    },
  },

  presupuestos: {
    load: async (): Promise<Presupuesto[]> => {
      const { data, error } = await supabase.from('presupuestos').select('*');
      handle(error, 'load presupuestos');
      return (data as Presupuesto[]) ?? [];
    },
    upsert: async (row: Presupuesto) => {
      const { error } = await supabase.from('presupuestos').upsert(row, { onConflict: 'id' });
      handle(error, 'upsert presupuesto');
    },
  },
};
