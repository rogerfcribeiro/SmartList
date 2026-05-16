export const CATEGORIES = {
  HORTIFRUTI: { label: 'Hortifruti', icon: '🥦' },
  ACOUGUE:    { label: 'Açougue',    icon: '🥩' },
  PADARIA:    { label: 'Padaria',    icon: '🍞' },
  LIMPEZA:    { label: 'Limpeza',    icon: '🧹' },
  HIGIENE:    { label: 'Higiene',    icon: '🧴' },
  BEBIDAS:    { label: 'Bebidas',    icon: '🧃' },
  OUTROS:     { label: 'Outros',     icon: '📦' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
