import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/unsplash/download
 * Trigger a download event to Unsplash when a photo is selected
 * 
 * This is required by Unsplash API guidelines:
 * "When your application performs something similar to a download 
 * (like when a user chooses the image to include in a blog post, 
 * set as a header, etc.), you must send a request to the download endpoint"
 * 
 * Body:
 * - downloadLocation: The download_location URL from the photo object
 */
export const POST = async (request: NextRequest) => {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get download location from request body
    const { downloadLocation } = await request.json();

    if (!downloadLocation) {
      return NextResponse.json(
        { error: 'downloadLocation is required' },
        { status: 400 }
      );
    }

    // Check for Unsplash access key
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('UNSPLASH_ACCESS_KEY is not configured');
      return NextResponse.json({ error: 'Unsplash API not configured' }, { status: 500 });
    }

    // Trigger the download event to Unsplash
    // This endpoint is what Unsplash uses to track photo usage
    const response = await fetch(downloadLocation, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      // Log but don't fail - this is tracking, not critical path
      console.error('Unsplash download tracking failed:', response.status);
      // Return success anyway - we don't want to block the user
      return NextResponse.json({ 
        success: true, 
        tracked: false,
        message: 'Download tracking failed but photo can still be used'
      });
    }

    // Unsplash returns the download URL in the response
    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      tracked: true,
      downloadUrl: data.url 
    });
  } catch (error) {
    console.error('Error in POST /api/unsplash/download:', error);
    // Don't fail the request - tracking is non-critical
    return NextResponse.json({ 
      success: true, 
      tracked: false,
      message: 'Download tracking encountered an error but photo can still be used'
    });
  }
};

