import type { Space, Unidad, Movimiento } from '../types';

export const SPACE_IDS = {
  PERSONAL: 'sp_personal',
  BUSINESS: 'sp_smdigitals',
} as const;

export const defaultSpaces: Space[] = [
  {
    id: SPACE_IDS.PERSONAL,
    name: 'Personal',
    type: 'personal',
    color: '#3B82F6',
    icon: 'User',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: SPACE_IDS.BUSINESS,
    name: 'SM DIGITALS',
    type: 'business',
    color: '#10B981',
    icon: 'Briefcase',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const unidadToSpaceId = (unidad: Unidad): string => {
  switch (unidad) {
    case 'SM DIGITALS':
      return SPACE_IDS.BUSINESS;
    case 'Personal':
      return SPACE_IDS.PERSONAL;
  }
};

export const spaceIdToUnidad = (spaceId: string): Unidad => {
  switch (spaceId) {
    case SPACE_IDS.BUSINESS:
      return 'SM DIGITALS';
    default:
      return 'Personal';
  }
};

// Asegura que cada movimiento tenga space_id derivado de su unidad si falta.
export const migrateMovimientoSpace = (m: Movimiento): Movimiento => {
  if (m.space_id) return m;
  return { ...m, space_id: unidadToSpaceId(m.unidad) };
};
