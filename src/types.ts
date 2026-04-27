export type Unidad = 'SM DIGITALS' | 'Marca Personal' | 'Personal';
export type TipoMovimiento = 'Ingreso' | 'Gasto' | 'Inversión' | 'Transferencia';
export type EstadoMovimiento = 'Pagado' | 'Pendiente' | 'Parcial';
export type Impacto = 'Core' | 'Privado' | 'Extraordinario';

export type SpaceType = 'personal' | 'business';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  color: string;
  icon: string;
  archived?: boolean;
  created_at: string;
}

export type SpaceView = 'global' | 'personal' | 'business' | string;

export interface Movimiento {
  id: string;
  fecha: string;
  periodo: string; // yyyy-mm
  año: number;
  mes: number;
  unidad: Unidad;
  space_id: string;
  tipo_movimiento: TipoMovimiento;
  categoria: string;
  subcategoria: string;
  cliente_proveedor: string;
  descripcion: string;
  metodo_pago: string;
  monto: number;
  recurrente: boolean;
  estado: EstadoMovimiento;
  impacto: Impacto;
  proyecto_id?: string;
  cuenta: string;
  created_at: string;
  // Solo cuando tipo_movimiento === 'Transferencia':
  // Cada transferencia genera 2 movimientos pareados (in + out) con el mismo transfer_pair_id.
  // No se cuentan como ingreso/gasto en stats; sí afectan balance por espacio.
  transfer_pair_id?: string;
  transfer_direction?: 'in' | 'out';
  transfer_counterpart_space_id?: string;
}

export interface ClienteMRR {
  id: string;
  cliente: string;
  servicio: string;
  valor_mensual: number;
  dia_cobro: number;
  estado: 'Activo' | 'Pausado' | 'Finalizado';
  fecha_inicio: string;
  fecha_fin?: string;
  metodo_pago: string;
}

export interface Proyecto {
  id: string;
  cliente: string;
  nombre_proyecto: string;
  tipo: string;
  valor_total: number;
  anticipo: number;
  cobrado: number;
  pendiente: number;
  fecha_inicio: string;
  fecha_pago_1?: string;
  fecha_pago_2?: string;
  estado: 'En Proceso' | 'Completado' | 'Cancelado' | 'Detenido';
  rentabilidad_estimada: number;
  fase: 'Propuesta' | 'Inicio' | 'Desarrollo' | 'Entrega' | 'Finalizado';
}

export interface Deuda {
  id: string;
  acreedor: string;
  tipo: string;
  saldo_inicial: number;
  cuota_mensual: number;
  pagado: number;
  saldo_restante: number;
  fecha_pago: string;
  estado: 'Al día' | 'Atrasado' | 'Liquidado';
}

export interface Presupuesto {
  id: string;
  periodo: string;
  unidad: Unidad;
  categoria: string;
  presupuesto: number;
  real: number;
  diferencia: number;
}
