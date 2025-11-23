export interface FontCombination {
  id: string;
  name: string;
  headingFont: string;
  bodyFont: string;
}

export const PORTFOLIO_FONT_COMBINATIONS: FontCombination[] = [
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    headingFont: 'font-serif',
    bodyFont: 'font-serif',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    headingFont: 'font-serif',
    bodyFont: 'font-serif',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
  },
  {
    id: 'bold',
    name: 'Bold',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
  },
];

