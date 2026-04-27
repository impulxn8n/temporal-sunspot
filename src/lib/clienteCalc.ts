import type { ClienteMRR } from '../types';

export interface ClienteDistribucion {
  costoOperativo: number;
  margen: number;
  ahorro: number;
  totalASeparar: number;   // costoOperativo + ahorro
  dineroLibre: number;     // valor_mensual - totalASeparar
}

export const COSTO_OPERATIVO_DEFAULT = 150_000;
export const AHORRO_PCT_DEFAULT = 30;

export const calcularDistribucionCliente = (
  cliente: Pick<ClienteMRR, 'valor_mensual' | 'costo_operativo' | 'regla_ahorro' | 'ahorro_pct'>
): ClienteDistribucion => {
  const regla = cliente.regla_ahorro ?? 'margen_30';
  const pct = (cliente.ahorro_pct ?? AHORRO_PCT_DEFAULT) / 100;

  if (regla === 'pago_30') {
    const ahorro = Math.round(cliente.valor_mensual * pct);
    return {
      costoOperativo: 0,
      margen: 0,
      ahorro,
      totalASeparar: ahorro,
      dineroLibre: cliente.valor_mensual - ahorro,
    };
  }

  const costoOperativo = cliente.costo_operativo ?? COSTO_OPERATIVO_DEFAULT;
  const margen = cliente.valor_mensual - costoOperativo;
  const ahorro = Math.round(margen * pct);
  const totalASeparar = costoOperativo + ahorro;
  return {
    costoOperativo,
    margen,
    ahorro,
    totalASeparar,
    dineroLibre: cliente.valor_mensual - totalASeparar,
  };
};

// Suma agregada de todos los clientes activos: cuánto va a cada bolsillo cada mes.
export interface DistribucionMensualMRR {
  totalIngresos: number;
  totalOperativo: number;     // suma de costos operativos → BOLS_OPERATIVO
  totalEmergencia: number;    // suma de ahorros → BOLS_EMERGENCIA
  totalLibre: number;         // dinero libre del negocio
}

export const calcularDistribucionMensualMRR = (clientes: ClienteMRR[]): DistribucionMensualMRR => {
  const activos = clientes.filter(c => c.estado === 'Activo');
  let totalIngresos = 0, totalOperativo = 0, totalEmergencia = 0, totalLibre = 0;
  for (const c of activos) {
    const d = calcularDistribucionCliente(c);
    totalIngresos += c.valor_mensual;
    totalOperativo += d.costoOperativo;
    totalEmergencia += d.ahorro;
    totalLibre += d.dineroLibre;
  }
  return { totalIngresos, totalOperativo, totalEmergencia, totalLibre };
};
