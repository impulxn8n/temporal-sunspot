import type { Movimiento, ClienteMRR, Proyecto, Deuda, Presupuesto } from '../types';

// App arranca limpia desde abril 2026.
// Los movimientos, deudas, proyectos y presupuestos se cargan manualmente.
export const mockMovimientos: Movimiento[] = [];
export const mockProyectos: Proyecto[] = [];
export const mockDeudas: Deuda[] = [];
export const mockPresupuestos: Presupuesto[] = [];

// 6 clientes recurrentes activos con sus reglas de distribución.
// margen_30 (default): costo operativo 150k + 30% del margen.
// pago_30 (Impulsy): solo 30% del pago total como ahorro.
export const mockClientesMRR: ClienteMRR[] = [
  {
    id: 'mrr_santorini_wa',
    cliente: 'Santorini WhatsApp',
    servicio: 'Bot de WhatsApp',
    valor_mensual: 400_000,
    dia_cobro: 15,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 150_000,
    regla_ahorro: 'margen_30',
    ahorro_pct: 30,
  },
  {
    id: 'mrr_santorini_soporte',
    cliente: 'Santorini Soporte',
    servicio: 'Soporte mensual',
    valor_mensual: 685_000,
    dia_cobro: 15,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 150_000,
    regla_ahorro: 'margen_30',
    ahorro_pct: 30,
  },
  {
    id: 'mrr_kp_skincare',
    cliente: 'KP Skincare',
    servicio: 'IA + Soporte',
    valor_mensual: 870_000,
    dia_cobro: 20,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 150_000,
    regla_ahorro: 'margen_30',
    ahorro_pct: 30,
  },
  {
    id: 'mrr_kp_masivos',
    cliente: 'KP Skincare Masivos',
    servicio: 'Mensajes masivos',
    valor_mensual: 725_000,
    dia_cobro: 20,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 150_000,
    regla_ahorro: 'margen_30',
    ahorro_pct: 30,
  },
  {
    id: 'mrr_impulsy_tasks',
    cliente: 'Impulsy Tasks',
    servicio: 'Tasks',
    valor_mensual: 95_000,
    dia_cobro: 1,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 0,
    regla_ahorro: 'pago_30',
    ahorro_pct: 30,
  },
  {
    id: 'mrr_la_vera_massa',
    cliente: 'La Vera Massa',
    servicio: 'Servicio mensual',
    valor_mensual: 350_000,
    dia_cobro: 5,
    estado: 'Activo',
    fecha_inicio: '2026-04-01',
    metodo_pago: 'Transferencia',
    costo_operativo: 150_000,
    regla_ahorro: 'margen_30',
    ahorro_pct: 30,
  },
];
