import React from 'react';
import { WasteType, Role } from './types';
import { PaperIcon, PlasticIcon, BioIcon, EWasteIcon, GlassIcon, MetalIcon } from './components/icons/WasteIcons';

export const ROLES = Object.values(Role);

export const WASTE_TYPES = Object.values(WasteType);

export const WASTE_TYPE_DETAILS: { [key in WasteType]: { color: string, icon: React.FC<React.SVGProps<SVGSVGElement>> } } = {
  [WasteType.PAPER]: { color: 'bg-sky-500', icon: PaperIcon },
  [WasteType.PLASTIC]: { color: 'bg-orange-500', icon: PlasticIcon },
  [WasteType.BIO]: { color: 'bg-emerald-600', icon: BioIcon },
  [WasteType.EWASTE]: { color: 'bg-zinc-700', icon: EWasteIcon },
  [WasteType.GLASS]: { color: 'bg-cyan-400', icon: GlassIcon },
  [WasteType.METAL]: { color: 'bg-slate-500', icon: MetalIcon },
};