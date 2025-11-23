export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    textSecondary: string;
  };
}

export const PORTFOLIO_COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'blue-neutral',
    name: 'Blue/Neutral',
    colors: {
      primary: 'blue-600',
      secondary: 'slate-500',
      accent: 'cyan-400',
      bg: 'white',
      text: 'gray-900',
      textSecondary: 'gray-600',
    },
  },
  {
    id: 'purple-accent',
    name: 'Purple/Accent',
    colors: {
      primary: 'purple-600',
      secondary: 'pink-500',
      accent: 'fuchsia-400',
      bg: 'white',
      text: 'gray-900',
      textSecondary: 'gray-600',
    },
  },
  {
    id: 'green-nature',
    name: 'Green/Nature',
    colors: {
      primary: 'green-600',
      secondary: 'teal-500',
      accent: 'emerald-400',
      bg: 'white',
      text: 'gray-900',
      textSecondary: 'gray-600',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary: 'black',
      secondary: 'gray-600',
      accent: 'gray-400',
      bg: 'white',
      text: 'black',
      textSecondary: 'gray-600',
    },
  },
];

