/**
 * Slugify a string for use in URLs and database slugs
 * Converts to lowercase, replaces spaces/special chars with hyphens, removes duplicates
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate a unique slug by appending a timestamp if the slug already exists
 */
export const generateUniqueSlug = async (
  supabase: any,
  userId: string,
  baseSlug: string
): Promise<string> => {
  // Check if slug exists
  const { data: existing } = await supabase
    .from('resume_versions')
    .select('slug')
    .eq('user_id', userId)
    .eq('slug', baseSlug)
    .single();

  if (!existing) {
    return baseSlug;
  }

  // Append timestamp to make it unique
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
};

