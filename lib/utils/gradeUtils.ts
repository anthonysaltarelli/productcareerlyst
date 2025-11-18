// Utility functions for converting scores to letter grades

export type LetterGrade = 'F' | 'D' | 'C-' | 'C' | 'C+' | 'B-' | 'B' | 'B+' | 'A-' | 'A' | 'A+';

/**
 * Converts a numeric score (0-100) to a letter grade
 * Based on standard grading scale:
 * A+: 97-100
 * A: 93-96
 * A-: 90-92
 * B+: 87-89
 * B: 83-86
 * B-: 80-82
 * C+: 77-79
 * C: 73-76
 * C-: 70-72
 * D: 60-69
 * F: 0-59
 */
export const scoreToGrade = (score: number): LetterGrade => {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
};

/**
 * Gets the color classes for a letter grade (red to green gradient)
 */
export const getGradeColor = (grade: LetterGrade | string) => {
  // A grades - green
  if (grade === 'A+') return 'text-emerald-700 bg-emerald-100 border-emerald-300';
  if (grade === 'A') return 'text-green-700 bg-green-100 border-green-300';
  if (grade === 'A-') return 'text-green-600 bg-green-100 border-green-300';
  // B grades - yellow-green to green
  if (grade === 'B+') return 'text-green-600 bg-green-100 border-green-300';
  if (grade === 'B') return 'text-lime-700 bg-lime-100 border-lime-300';
  if (grade === 'B-') return 'text-lime-600 bg-lime-100 border-lime-300';
  // C grades - yellow to yellow-orange
  if (grade === 'C+') return 'text-yellow-600 bg-yellow-100 border-yellow-300';
  if (grade === 'C') return 'text-yellow-600 bg-yellow-100 border-yellow-300';
  if (grade === 'C-') return 'text-amber-600 bg-amber-100 border-amber-300';
  // D grade - orange
  if (grade === 'D') return 'text-orange-600 bg-orange-100 border-orange-300';
  // F grade - red
  return 'text-red-600 bg-red-100 border-red-300';
};

/**
 * Gets the text color for a letter grade (without background) - red to green gradient
 */
export const getGradeTextColor = (grade: LetterGrade | string) => {
  // A grades - green
  if (grade === 'A+') return 'text-emerald-600';
  if (grade === 'A') return 'text-green-600';
  if (grade === 'A-') return 'text-green-600';
  // B grades - yellow-green to green
  if (grade === 'B+') return 'text-green-600';
  if (grade === 'B') return 'text-lime-600';
  if (grade === 'B-') return 'text-lime-500';
  // C grades - yellow to yellow-orange
  if (grade === 'C+') return 'text-yellow-500';
  if (grade === 'C') return 'text-yellow-500';
  if (grade === 'C-') return 'text-amber-500';
  // D grade - orange
  if (grade === 'D') return 'text-orange-500';
  // F grade - red
  return 'text-red-600';
};

/**
 * Gets the background color for a letter grade (without text) - red to green gradient
 */
export const getGradeBgColor = (grade: LetterGrade | string) => {
  // A grades - green
  if (grade === 'A+') return 'bg-emerald-100';
  if (grade === 'A') return 'bg-green-100';
  if (grade === 'A-') return 'bg-green-100';
  // B grades - yellow-green to green
  if (grade === 'B+') return 'bg-green-100';
  if (grade === 'B') return 'bg-lime-100';
  if (grade === 'B-') return 'bg-lime-100';
  // C grades - yellow to yellow-orange
  if (grade === 'C+') return 'bg-yellow-100';
  if (grade === 'C') return 'bg-yellow-100';
  if (grade === 'C-') return 'bg-amber-100';
  // D grade - orange
  if (grade === 'D') return 'bg-orange-100';
  // F grade - red
  return 'bg-red-100';
};

/**
 * Gets the hex color for SVG fill based on grade (red to green gradient)
 */
export const getGradeFillColor = (grade: LetterGrade | string) => {
  // A grades - green (best)
  if (grade === 'A+') return '#10b981'; // emerald-500
  if (grade === 'A') return '#16a34a'; // green-600
  if (grade === 'A-') return '#22c55e'; // green-500
  // B grades - yellow-green to green
  if (grade === 'B+') return '#22c55e'; // green-500
  if (grade === 'B') return '#84cc16'; // lime-500
  if (grade === 'B-') return '#a3e635'; // lime-400
  // C grades - yellow to yellow-orange
  if (grade === 'C+') return '#eab308'; // yellow-500
  if (grade === 'C') return '#fbbf24'; // amber-400
  if (grade === 'C-') return '#fb923c'; // orange-400
  // D grade - orange
  if (grade === 'D') return '#f97316'; // orange-500
  // F grade - red (worst)
  return '#dc2626'; // red-600
};

/**
 * Gets the hex color for SVG fill with opacity based on grade
 */
export const getGradeFillColorWithOpacity = (grade: LetterGrade | string, opacity: number = 0.2) => {
  const baseColor = getGradeFillColor(grade);
  // Convert hex to rgba
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Gets the score range for a grade
 */
export const getGradeScoreRange = (grade: LetterGrade): { min: number; max: number } => {
  switch (grade) {
    case 'A+': return { min: 97, max: 100 };
    case 'A': return { min: 93, max: 96 };
    case 'A-': return { min: 90, max: 92 };
    case 'B+': return { min: 87, max: 89 };
    case 'B': return { min: 83, max: 86 };
    case 'B-': return { min: 80, max: 82 };
    case 'C+': return { min: 77, max: 79 };
    case 'C': return { min: 73, max: 76 };
    case 'C-': return { min: 70, max: 72 };
    case 'D': return { min: 60, max: 69 };
    case 'F': return { min: 0, max: 59 };
  }
};

/**
 * Gets all grades in order from highest to lowest
 */
export const getAllGrades = (): LetterGrade[] => {
  return ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
};

