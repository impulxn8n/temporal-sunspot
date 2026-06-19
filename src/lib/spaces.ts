import type { Space, Unidad, Movimiento } from '../types';

export const SPACE_IDS = {
  // Botes principales de la estrategia (Pay Yourself First)
  BOLS_SEGURIDAD: 'sp_bols_emergencia', // Reutilizamos el ID anterior para no romper historial
  BOLS_INVERSION: 'sp_bols_inversion',
  BOLS_GASTOS_BASE: 'sp_bols_operativo', // Reutilizamos el ID anterior para no romper historial
  BOLS_CAPRICHOS: 'sp_bols_caprichos',
  
  // Legacy (solo para mantener historial y mapeo de unidades)
  PERSONAL: 'sp_personal',
  BUSINESS: 'sp_smdigitals',
  IMPULSY: 'sp_impulsy',
  DANSAI: 'sp_dansai',
} as const;

export const BOLSILLO_SPACE_IDS: string[] = [
  SPACE_IDS.BOLS_SEGURIDAD, 
  SPACE_IDS.BOLS_INVERSION, 
  SPACE_IDS.BOLS_GASTOS_BASE, 
  SPACE_IDS.BOLS_CAPRICHOS
];

export const defaultSpaces: Space[] = [
  // --- LOS 4 BOTES DEL SISTEMA ---
  {
    id: SPACE_IDS.BOLS_SEGURIDAD,
    name: 'Fondo de Seguridad',
    type: 'personal', // o business si queremos verlo agrupado, pero ahora todo es patrimonio
    color: '#3B82F6', // Azul
    icon: 'Shield',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: SPACE_IDS.BOLS_INVERSION,
    name: 'Inversión',
    type: 'personal',
    color: '#8B5CF6', // Morado
    icon: 'TrendingUp',
    created_at: '2026-06-19T00:00:00Z',
  },
  {
    id: SPACE_IDS.BOLS_GASTOS_BASE,
    name: 'Gastos Base',
    type: 'personal',
    color: '#F59E0B', // Naranja
    icon: 'Home',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: SPACE_IDS.BOLS_CAPRICHOS,
    name: 'Caprichos',
    type: 'personal',
    color: '#EC4899', // Rosa
    icon: 'Coffee',
    created_at: '2026-06-19T00:00:00Z',
  },
  // --- LEGACY (Archivados para que no salgan en el dashboard) ---
  {
    id: SPACE_IDS.BUSINESS,
    name: 'SM DIGITALS',
    type: 'business',
    color: '#10B981',
    icon: 'Briefcase',
    created_at: '2026-01-01T00:00:00Z',
    archived: true,
  },
  {
    id: SPACE_IDS.IMPULSY,
    name: 'IMPULSY',
    type: 'business',
    color: '#8B5CF6',
    icon: 'Zap',
    created_at: '2026-01-01T00:00:00Z',
    archived: true,
  },
  {
    id: SPACE_IDS.DANSAI,
    name: 'DANS.IA',
    type: 'business',
    color: '#06B6D4',
    icon: 'Brain',
    created_at: '2026-01-01T00:00:00Z',
    archived: true,
  },
];

export const unidadToSpaceId = (unidad: Unidad): string => {
  switch (unidad) {
    case 'SM DIGITALS': return SPACE_IDS.BUSINESS;
    case 'IMPULSY':     return SPACE_IDS.IMPULSY;
    case 'DANS.IA':     return SPACE_IDS.DANSAI;
    case 'Personal':    return SPACE_IDS.PERSONAL;
    default:            return SPACE_IDS.BOLS_GASTOS_BASE; // Default fallback
  }
};

export const spaceIdToUnidad = (spaceId: string): Unidad => {
  switch (spaceId) {
    case SPACE_IDS.BUSINESS:
      return 'SM DIGITALS';
    case SPACE_IDS.IMPULSY:       return 'IMPULSY';
    case SPACE_IDS.DANSAI:        return 'DANS.IA';
    case SPACE_IDS.BOLS_SEGURIDAD:
    case SPACE_IDS.BOLS_GASTOS_BASE:
    case SPACE_IDS.BOLS_INVERSION:
    case SPACE_IDS.BOLS_CAPRICHOS:
      return 'Personal';
    default:                      return 'Personal';
  }
};

// Asegura que cada movimiento tenga space_id derivado de su unidad si falta.
export const migrateMovimientoSpace = (m: Movimiento): Movimiento => {
  if (m.space_id) return m;
  return { ...m, space_id: unidadToSpaceId(m.unidad) };
};

