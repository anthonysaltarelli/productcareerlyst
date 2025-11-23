/**
 * Utility functions for PM Template resource tracking and categorization
 */

export type ResourceCategory = 
  | 'Resume & Portfolio'
  | 'Interview Prep'
  | 'Product Management'
  | 'Networking & Outreach'
  | 'Compensation';

export type ResourceType = 
  | 'Google Doc'
  | 'Figma'
  | 'Google Sheet'
  | 'External Link';

export type ResourceFormat = 
  | 'Document'
  | 'Template'
  | 'Guide'
  | 'Calculator'
  | 'Script'
  | 'Glossary'
  | 'Spreadsheet';

/**
 * Resource category mapping for all 20 resources
 */
export const RESOURCE_CATEGORIES: Record<string, ResourceCategory> = {
  'Resume Guide': 'Resume & Portfolio',
  'Case Study Template': 'Resume & Portfolio',
  'Figma Graphic Templates': 'Resume & Portfolio',
  'Networking Scripts': 'Networking & Outreach',
  'Find Contacts Guide': 'Networking & Outreach',
  'Company Red Flags': 'Networking & Outreach',
  'Job Application Checklist': 'Interview Prep',
  'My 8 Stories': 'Interview Prep',
  'Interview Prep': 'Interview Prep',
  'PM Interview Frameworks': 'Interview Prep',
  'Questions & Answers': 'Interview Prep',
  'Offer Calculator': 'Compensation',
  'Negotiation Scripts': 'Compensation',
  'Product Requirements Doc (PRD)': 'Product Management',
  'Jira Ticket Templates': 'Product Management',
  'Roadmap Template': 'Product Management',
  'PM Terminology Glossary': 'Product Management',
  'Popular Metrics': 'Product Management',
  'Software Guide (Jira, Notion)': 'Product Management',
  'Project Tracker': 'Product Management',
  'User Research / Interview Guide': 'Product Management',
};

/**
 * Get resource category by title
 */
export const getResourceCategory = (title: string): ResourceCategory => {
  return RESOURCE_CATEGORIES[title] || 'Product Management';
};

/**
 * Get resource type from URL
 */
export const getResourceType = (url: string): ResourceType => {
  if (url.includes('docs.google.com/document')) return 'Google Doc';
  if (url.includes('figma.com')) return 'Figma';
  if (url.includes('docs.google.com/spreadsheets')) return 'Google Sheet';
  return 'External Link';
};

/**
 * Get resource format from title and URL
 */
export const getResourceFormat = (title: string, url: string): ResourceFormat => {
  if (title.includes('Template')) return 'Template';
  if (title.includes('Guide')) return 'Guide';
  if (title.includes('Calculator')) return 'Calculator';
  if (title.includes('Script')) return 'Script';
  if (title.includes('Glossary')) return 'Glossary';
  if (url.includes('spreadsheets')) return 'Spreadsheet';
  return 'Document';
};

/**
 * Convert resource title to kebab-case resource ID
 */
export const getResourceId = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Calculate grid position based on index and viewport width
 */
export const getGridPosition = (
  index: number,
  viewportWidth: number
): {
  position: number;
  row: number;
  column: number;
  gridLayout: '1-column' | '2-column' | '3-column';
} => {
  const position = index + 1; // 1-based position
  
  // Determine grid layout based on viewport width
  let columns: number;
  let gridLayout: '1-column' | '2-column' | '3-column';
  
  if (viewportWidth < 768) {
    columns = 1;
    gridLayout = '1-column';
  } else if (viewportWidth < 1024) {
    columns = 2;
    gridLayout = '2-column';
  } else {
    columns = 3;
    gridLayout = '3-column';
  }
  
  const row = Math.ceil(position / columns);
  const column = ((position - 1) % columns) + 1;
  
  return {
    position,
    row,
    column,
    gridLayout,
  };
};

/**
 * Check if resource is above the fold
 */
export const isAboveFold = (element: HTMLElement | null): boolean => {
  if (!element || typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Consider above fold if top of element is within first 100vh
  return rect.top < viewportHeight;
};

/**
 * Get device type from viewport width
 */
export const getDeviceType = (viewportWidth: number): 'mobile' | 'tablet' | 'desktop' => {
  if (viewportWidth < 768) return 'mobile';
  if (viewportWidth < 1024) return 'tablet';
  return 'desktop';
};


