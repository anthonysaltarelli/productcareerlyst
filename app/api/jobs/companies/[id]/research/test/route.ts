import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/jobs/companies/[id]/research/test
 * Simple test endpoint to verify routing works
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  console.log('=== TEST ENDPOINT HIT ===');
  const { id } = await params;
  return NextResponse.json({
    success: true,
    message: 'Test endpoint works!',
    companyId: id,
    timestamp: new Date().toISOString(),
  });
};

