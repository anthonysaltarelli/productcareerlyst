// Color mapping for Tailwind color names to actual hex values
export const TAILWIND_COLORS: Record<string, string> = {
  // Blue
  'blue-600': '#2563eb',
  'blue-50': '#eff6ff',
  'blue-500': '#3b82f6',
  'blue-700': '#1d4ed8',
  // Slate
  'slate-500': '#64748b',
  // Cyan
  'cyan-400': '#22d3ee',
  // Purple
  'purple-600': '#9333ea',
  // Pink
  'pink-500': '#ec4899',
  // Fuchsia
  'fuchsia-400': '#e879f9',
  // Green
  'green-600': '#16a34a',
  // Teal
  'teal-500': '#14b8a6',
  // Emerald
  'emerald-400': '#34d399',
  // Black
  'black': '#000000',
  // Gray
  'gray-600': '#4b5563',
  'gray-400': '#9ca3af',
  'gray-300': '#d1d5db',
  'gray-900': '#111827',
  'gray-200': '#e5e7eb',
  'gray-50': '#f9fafb',
  // White
  'white': '#ffffff',
};

export const getColorValue = (colorName: string): string => {
  return TAILWIND_COLORS[colorName] || colorName;
};

