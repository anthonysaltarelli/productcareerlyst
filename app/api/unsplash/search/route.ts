import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    download_location: string;
  };
  user: {
    name: string;
    username: string;
    profile_image: {
      small: string;
      medium: string;
    };
  };
  width: number;
  height: number;
  color: string;
  blur_hash: string | null;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// ============================================================================
// Constants
// ============================================================================

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const UTM_SOURCE = 'productcareerlyst';
const UTM_MEDIUM = 'referral';

// ============================================================================
// Route Handler
// ============================================================================

/**
 * GET /api/unsplash/search
 * Proxy for Unsplash search API - keeps API keys server-side
 * 
 * Query params:
 * - query: Search term (required)
 * - page: Page number (default: 1)
 * - per_page: Results per page (default: 20, max: 30)
 * - orientation: Filter by orientation (landscape, portrait, squarish)
 */
export const GET = async (request: NextRequest) => {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const orientation = searchParams.get('orientation') || 'landscape'; // Default to landscape for cover images

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Check for Unsplash access key
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('UNSPLASH_ACCESS_KEY is not configured');
      return NextResponse.json({ error: 'Unsplash API not configured' }, { status: 500 });
    }

    // Make request to Unsplash API
    const unsplashUrl = new URL(`${UNSPLASH_API_URL}/search/photos`);
    unsplashUrl.searchParams.set('query', query);
    unsplashUrl.searchParams.set('page', page);
    unsplashUrl.searchParams.set('per_page', perPage);
    unsplashUrl.searchParams.set('orientation', orientation);

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unsplash API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to search Unsplash' },
        { status: response.status }
      );
    }

    const data: UnsplashSearchResponse = await response.json();

    // Transform the response to include our UTM parameters and only necessary fields
    const transformedResults = data.results.map((photo: UnsplashPhoto) => ({
      id: photo.id,
      description: photo.description || photo.alt_description || 'Unsplash photo',
      urls: {
        // Use 'regular' for display (1080px width) and 'full' for high quality
        thumb: photo.urls.thumb,
        small: photo.urls.small,
        regular: photo.urls.regular,
        full: photo.urls.full,
        // Construct the properly sized URL for cover images (3:1 aspect)
        // Using width=1200 gives good quality for most displays
        cover: `${photo.urls.raw}&w=1200&h=400&fit=crop&crop=entropy`,
      },
      downloadLocation: photo.links.download_location,
      photographer: {
        name: photo.user.name,
        username: photo.user.username,
        profileUrl: `https://unsplash.com/@${photo.user.username}?utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}`,
        profileImage: photo.user.profile_image.small,
      },
      dimensions: {
        width: photo.width,
        height: photo.height,
      },
      color: photo.color,
      blurHash: photo.blur_hash,
    }));

    return NextResponse.json({
      total: data.total,
      totalPages: data.total_pages,
      photos: transformedResults,
      // Include attribution links with UTM parameters
      attribution: {
        unsplashUrl: `https://unsplash.com/?utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}`,
        utmSource: UTM_SOURCE,
        utmMedium: UTM_MEDIUM,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/unsplash/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

