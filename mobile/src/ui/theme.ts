import { EnergyLevel } from '../types';

export const colors = {
  canvas: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  outline: '#64748B',
  text: '#F8FAFC',
  muted: '#94A3B8',
  accent: '#38BDF8',
  accentInk: '#0F172A',
  warning: '#FBBF24',
  success: '#6EE7B7',
  freeze: '#818CF8',
};

export const energyLabels: Record<EnergyLevel, string> = { LOW: 'Thấp', MEDIUM: 'Vừa', HIGH: 'Cao' };
export const energyLevels: EnergyLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
