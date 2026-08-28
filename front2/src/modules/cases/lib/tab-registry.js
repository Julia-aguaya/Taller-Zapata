import { CarFront, ClipboardList, FileText, Receipt, ShieldCheck, UserCog, Wrench } from 'lucide-react';

/**
 * Registry of all possible operational tabs across tramite types.
 * The backend (readiness.tabs) decides WHICH tabs appear for a given case.
 * The frontend uses this registry purely for icons, labels, and ordering.
 */
export const TAB_REGISTRY = {
  FICHA_TECNICA:         { icon: UserCog,       label: 'Ficha Técnica',         order: 1 },
  GESTION_TRAMITE:       { icon: ClipboardList, label: 'Gestión del Trámite',   order: 2 },
  PRESUPUESTO:           { icon: FileText,      label: 'Presupuesto',           order: 3 },
  GESTION_REPARACION:    { icon: Wrench,        label: 'Gestión Reparación',    order: 4 },
  PAGOS:                 { icon: Receipt,       label: 'Pagos',                 order: 5 },
};

export const CLEAS_TAB_CODES = ['FICHA_TECNICA', 'GESTION_TRAMITE', 'PRESUPUESTO', 'GESTION_REPARACION', 'PAGOS'];

const createDefaultCleasTab = (tabCode) => ({
  tabCode,
  allowed: tabCode === 'FICHA_TECNICA' || tabCode === 'GESTION_TRAMITE',
  completed: false,
  blockingReasons: tabCode === 'FICHA_TECNICA' || tabCode === 'GESTION_TRAMITE' ? [] : ['No se pudo verificar si esta etapa está habilitada.'],
  warningReasons: [],
});

export const getCleasTabs = (tabs = []) => {
  const tabsByCode = new Map(tabs.map((tab) => [tab.tabCode, tab]));

  return CLEAS_TAB_CODES.map((tabCode) => tabsByCode.get(tabCode) ?? createDefaultCleasTab(tabCode));
};

export const getOperationalTabs = (tabs = []) =>
  tabs
    .filter((tab) => TAB_REGISTRY[tab.tabCode])
    .sort((a, b) => (TAB_REGISTRY[a.tabCode]?.order ?? 99) - (TAB_REGISTRY[b.tabCode]?.order ?? 99));

export const getTabIcon = (tabCode) => TAB_REGISTRY[tabCode]?.icon ?? ShieldCheck;
export const getTabLabel = (tabCode) => TAB_REGISTRY[tabCode]?.label ?? tabCode;
