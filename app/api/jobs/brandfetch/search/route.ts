import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/brandfetch/search - Search for brands using Brandfetch API
export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const clientId = process.env.BRAND_FETCH_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Brandfetch client ID not configured' },
        { status: 500 }
      );
    }

    // Call Brandfetch API
    const response = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(name)}?c=${clientId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Brandfetch API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to search brands' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({ brands: data || [] });
  } catch (error) {
    console.error('Unexpected error searching Brandfetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

