import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SlugAvailabilityResponse } from '@/lib/types/portfolio';

/**
 * GET /api/portfolio/manage/check-slug?slug=username
 * Check if a portfolio slug is available
 */
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug parameter is required' }, { status: 400 });
    }

    const normalizedSlug = slug.toLowerCase().trim();

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z0-9]$/;
    if (!slugRegex.test(normalizedSlug)) {
      return NextResponse.json<SlugAvailabilityResponse>({
        available: false,
        suggestion: generateSlugSuggestion(normalizedSlug),
      });
    }

    // Check if it's a reserved slug
    const reservedSlugs = [
      'admin', 'api', 'app', 'auth', 'dashboard', 'login', 'logout',
      'register', 'signup', 'signin', 'settings', 'profile', 'account',
      'help', 'support', 'about', 'contact', 'terms', 'privacy',
      'portfolio', 'portfolios', 'p', 'user', 'users', 'new', 'edit',
      'create', 'delete', 'update', 'manage', 'www', 'mail', 'email',
    ];

    if (reservedSlugs.includes(normalizedSlug)) {
      return NextResponse.json<SlugAvailabilityResponse>({
        available: false,
        suggestion: `${normalizedSlug}-pm`,
      });
    }

    // Check if slug is already taken using the RLS-bypassing function
    // This ensures we check ALL portfolios, not just published ones or user's own
    const { data: slugCheck, error: slugCheckError } = await supabase
      .rpc('check_portfolio_slug_available', {
        p_slug: normalizedSlug,
        p_user_id: user.id,
      })
      .single();

    if (slugCheckError) {
      console.error('Error checking slug availability:', slugCheckError);
      // Fallback to direct query (will have RLS limitations)
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('id, user_id')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (existingPortfolio && existingPortfolio.user_id !== user.id) {
        return NextResponse.json<SlugAvailabilityResponse>({
          available: false,
          suggestion: await generateUniqueSuggestion(supabase, normalizedSlug),
        });
      }
      return NextResponse.json<SlugAvailabilityResponse>({ available: true });
    }

    // If slug is not available, generate a suggestion
    if (!slugCheck.available) {
      return NextResponse.json<SlugAvailabilityResponse>({
        available: false,
        suggestion: await generateUniqueSuggestion(supabase, normalizedSlug),
      });
    }

    return NextResponse.json<SlugAvailabilityResponse>({ available: true });
  } catch (error) {
    console.error('Error in GET /api/portfolio/manage/check-slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

/**
 * Generate a valid slug suggestion from an invalid input
 */
const generateSlugSuggestion = (input: string): string => {
  // Remove invalid characters and convert to lowercase
  let suggestion = input
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Ensure it starts and ends with alphanumeric
  if (!/^[a-z0-9]/.test(suggestion)) {
    suggestion = 'my-' + suggestion;
  }
  if (!/[a-z0-9]$/.test(suggestion)) {
    suggestion = suggestion + '-portfolio';
  }

  return suggestion || 'my-portfolio';
};

/**
 * Generate a unique slug suggestion by appending numbers
 */
const generateUniqueSuggestion = async (
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  baseSlug: string
): Promise<string> => {
  let counter = 1;
  let suggestion = `${baseSlug}-${counter}`;

  // Try up to 10 variations
  while (counter <= 10) {
    const { data } = await supabase
      .from('portfolios')
      .select('id')
      .eq('slug', suggestion)
      .maybeSingle();

    if (!data) {
      return suggestion;
    }

    counter++;
    suggestion = `${baseSlug}-${counter}`;
  }

  // If all numbered versions are taken, add timestamp
  return `${baseSlug}-${Date.now().toString(36)}`;
};

