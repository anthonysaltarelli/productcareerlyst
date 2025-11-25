import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { FeatureRequestNotification } from '@/app/components/emails/FeatureRequestNotification';

const resend = new Resend(process.env.RESEND_API_KEY);

// Admin emails for feature request notifications
const ADMIN_EMAILS = ['team@productcareerlyst.com'];

// GET /api/feature-requests - List all non-archived feature requests with vote counts
export const GET = async () => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all non-archived feature requests with vote counts and user info
    const { data: featureRequests, error: fetchError } = await supabase
      .from('feature_requests')
      .select(`
        id,
        user_id,
        title,
        description,
        status,
        is_archived,
        created_at,
        updated_at
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching feature requests:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    // Get vote counts for each feature request
    const featureRequestIds = featureRequests?.map(fr => fr.id) || [];
    
    const { data: votes, error: votesError } = await supabase
      .from('feature_request_votes')
      .select('feature_request_id, user_id')
      .in('feature_request_id', featureRequestIds);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    // Get profiles for feature request authors
    const userIds = [...new Set(featureRequests?.map(fr => fr.user_id) || [])];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Build profile map
    const profileMap = new Map(
      profiles?.map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]) || []
    );

    // Count votes and check if current user voted
    const voteCountMap = new Map<string, number>();
    const userVoteMap = new Map<string, boolean>();

    votes?.forEach(vote => {
      const currentCount = voteCountMap.get(vote.feature_request_id) || 0;
      voteCountMap.set(vote.feature_request_id, currentCount + 1);
      
      if (vote.user_id === user.id) {
        userVoteMap.set(vote.feature_request_id, true);
      }
    });

    // Combine data
    const enrichedRequests = featureRequests?.map(fr => ({
      ...fr,
      vote_count: voteCountMap.get(fr.id) || 0,
      user_has_voted: userVoteMap.get(fr.id) || false,
      author: profileMap.get(fr.user_id) || { first_name: null, last_name: null },
      is_own_request: fr.user_id === user.id,
    })) || [];

    return NextResponse.json({
      success: true,
      feature_requests: enrichedRequests,
    });
  } catch (error) {
    console.error('Unexpected error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/feature-requests - Create a new feature request
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile to check if they have first name and last name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify profile' },
        { status: 500 }
      );
    }

    // Check if profile is complete (has first and last name)
    if (!profile?.first_name || !profile?.last_name) {
      return NextResponse.json(
        { 
          error: 'Profile incomplete',
          message: 'Please complete your profile with first name and last name before submitting a feature request.',
          requiresProfile: true,
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Create the feature request
    const { data: newRequest, error: insertError } = await supabase
      .from('feature_requests')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feature request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create feature request' },
        { status: 500 }
      );
    }

    // Send email notification to team (fire-and-forget)
    if (user.email && newRequest) {
      sendEmailNotification({
        firstName: profile.first_name,
        lastName: profile.last_name,
        userEmail: user.email,
        title: newRequest.title,
        description: newRequest.description,
        requestDate: newRequest.created_at,
      }).catch(error => {
        console.error('Failed to send email notification:', error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        feature_request: {
          ...newRequest,
          vote_count: 0,
          user_has_voted: false,
          author: { first_name: profile.first_name, last_name: profile.last_name },
          is_own_request: true,
        },
        message: 'Feature request submitted successfully!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error creating feature request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// Helper function to send email notification (non-blocking)
const sendEmailNotification = async (params: {
  firstName: string;
  lastName: string;
  userEmail: string;
  title: string;
  description: string;
  requestDate: string;
}) => {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Product Careerlyst <onboarding@resend.dev>';
    
    // Render the React email component to HTML
    const emailHtml = await render(
      FeatureRequestNotification({
        firstName: params.firstName,
        lastName: params.lastName,
        userEmail: params.userEmail,
        title: params.title,
        description: params.description,
        requestDate: params.requestDate,
      })
    );
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: ADMIN_EMAILS,
      subject: `New Feature Request: ${params.title}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email notification:', emailError);
    } else {
      console.log('Email notification sent successfully:', emailData);
    }
  } catch (emailErr) {
    console.error('Unexpected error sending email:', emailErr);
  }
};

