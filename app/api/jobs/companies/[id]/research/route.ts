import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateResearch, ALL_RESEARCH_TYPES, ResearchType } from '@/lib/utils/perplexity';
import { isResearchValid } from '@/lib/utils/perplexity';
import { markBaselineActionsComplete } from '@/lib/utils/baseline-actions';

/**
 * GET /api/jobs/companies/[id]/research
 * Get all research vectors for a company
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;

    // Get all research for this company
    const { data: research, error } = await supabase
      .from('company_research')
      .select('*')
      .eq('company_id', companyId)
      .order('research_type', { ascending: true });

    if (error) {
      console.error('Error fetching research:', error);
      // Check if it's a schema error (migration not run)
      if (error.message?.includes('column') && error.message?.includes('research_type')) {
        return NextResponse.json(
          { 
            error: 'Database migration required',
            details: 'Please run the migration: sql_migrations/company_research/006_update_for_per_vector.sql'
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { 
          error: 'Failed to fetch research',
          details: error.message
        },
        { status: 500 }
      );
    }

    // Get company name for reference
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Organize research by type
    const researchByType: Record<string, any> = {};
    research?.forEach((r) => {
      researchByType[r.research_type] = {
        ...r,
        is_valid: isResearchValid(r.generated_at),
      };
    });

    // Mark baseline action complete when accessing existing research
    // This covers the case where a user views research that was already generated
    if (research && research.length > 0) {
      markBaselineActionsComplete(user.id, 'company_researched').catch((err) => {
        console.error('Error marking company_researched baseline action (GET):', err);
      });
    }

    return NextResponse.json({
      research: researchByType,
      company_name: company?.name || 'Unknown',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

/**
 * POST /api/jobs/companies/[id]/research
 * Trigger research generation for all vectors (or specific vector)
 */
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  console.log('=== POST /api/jobs/companies/[id]/research - START ===');
  console.log('Request URL:', request.url);
  
  try {
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    
    console.log('Checking authentication...');
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('User authenticated:', user.id);

    console.log('Awaiting params...');
    const { id: companyId } = await params;
    console.log('Company ID:', companyId);

    // Parse body if it exists (optional for generating all)
    let research_type: ResearchType | undefined;
    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        research_type = body.research_type;
      }
    } catch (parseError) {
      // Body is optional, continue without it
      console.log('No request body or parse error (this is OK):', parseError);
    }

    // Get company name
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company fetch error:', companyError);
      return NextResponse.json(
        { error: 'Company not found', details: companyError?.message },
        { status: 404 }
      );
    }

    // Test if research_type column exists by trying a simple query
    const { error: schemaTestError } = await supabase
      .from('company_research')
      .select('research_type')
      .limit(1);

    if (schemaTestError && schemaTestError.message?.includes('column') && schemaTestError.message?.includes('research_type')) {
      console.error('Schema error - migration not run:', schemaTestError);
      return NextResponse.json(
        { 
          error: 'Database migration required',
          details: 'The research_type column does not exist. Please run: sql_migrations/company_research/006_update_for_per_vector.sql',
          migration_file: 'sql_migrations/company_research/006_update_for_per_vector.sql'
        },
        { status: 500 }
      );
    }

    const companyName = company.name;
    const typesToGenerate = research_type 
      ? [research_type as ResearchType]
      : ALL_RESEARCH_TYPES;

    console.log(`Starting research generation for company: ${companyName}, types: ${typesToGenerate.length}`);

    // Check if PERPLEXITY_API_KEY is set
    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set');
      return NextResponse.json(
        { error: 'PERPLEXITY_API_KEY is not configured on server' },
        { status: 500 }
      );
    }

    // Start research generation (fire and forget for multiple types)
    // For single type, we can wait and return result
    if (typesToGenerate.length === 1) {
      const researchType = typesToGenerate[0];
      
      try {
        const perplexityResponse = await generateResearch(companyName, researchType);
        
        // Calculate expires_at (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Upsert research record (authenticated users can now insert/update via RLS)
        const { data: research, error: upsertError } = await supabase
          .from('company_research')
          .upsert({
            company_id: companyId,
            research_type: researchType,
            perplexity_response: perplexityResponse,
            generated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }, {
            onConflict: 'company_id,research_type',
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error saving research:', upsertError);
          console.error('Upsert error details:', {
            message: upsertError.message,
            details: upsertError.details,
            hint: upsertError.hint,
            code: upsertError.code,
          });
          return NextResponse.json(
            { 
              error: 'Failed to save research',
              details: upsertError.message,
              hint: upsertError.hint || 'Make sure the database migration has been run'
            },
            { status: 500 }
          );
        }

        // Mark baseline action complete for company research
        markBaselineActionsComplete(user.id, 'company_researched').catch((err) => {
          console.error('Error marking company_researched baseline action:', err);
        });

        return NextResponse.json({
          success: true,
          research: {
            ...research,
            is_valid: true,
          },
        });
      } catch (error) {
        console.error('Error generating research:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to generate research' },
          { status: 500 }
        );
      }
    } else {
      // Multiple types - process asynchronously
      // Start all research tasks (don't await, but track them)
      console.log('Starting async research generation for all vectors...');
      
      const researchPromises = typesToGenerate.map(async (researchType) => {
        try {
          console.log(`[${researchType}] Starting research generation...`);
          const perplexityResponse = await generateResearch(companyName, researchType);
          console.log(`[${researchType}] Research generated successfully`);
          
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          console.log(`[${researchType}] Attempting to save to database...`);
          // Use the authenticated supabase client (RLS allows authenticated users to insert/update)
          const { data: savedData, error: upsertError } = await supabase
            .from('company_research')
            .upsert({
              company_id: companyId,
              research_type: researchType,
              perplexity_response: perplexityResponse,
              generated_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            }, {
              onConflict: 'company_id,research_type',
            })
            .select();

          if (upsertError) {
            console.error(`[${researchType}] Error saving to DB:`, upsertError);
            console.error(`[${researchType}] Error details:`, {
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint,
              code: upsertError.code,
            });
            
            // Check if it's a schema error
            if (upsertError.message?.includes('column') || upsertError.message?.includes('research_type')) {
              console.error(`[${researchType}] SCHEMA ERROR - Migration not run!`);
            }
            
            throw new Error(`Failed to save ${researchType}: ${upsertError.message}`);
          }
          
          if (!savedData || savedData.length === 0) {
            console.warn(`[${researchType}] Upsert succeeded but no data returned`);
          } else {
            console.log(`[${researchType}] Saved successfully, ID: ${savedData[0]?.id}`);
          }
          
          console.log(`[${researchType}] Saved to database successfully`);
          return { type: researchType, success: true };
        } catch (error) {
          console.error(`[${researchType}] Error generating research:`, error);
          console.error(`[${researchType}] Error details:`, error instanceof Error ? error.message : String(error));
          return { type: researchType, success: false, error: error instanceof Error ? error.message : String(error) };
        }
      });

      // Track the promises but don't await (fire and forget)
      Promise.all(researchPromises)
        .then((results) => {
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;
          console.log(`Research generation complete: ${successful} successful, ${failed} failed`);
          if (failed > 0) {
            const failedTypes = results.filter(r => !r.success).map(r => r.type);
            console.error('Failed research types:', failedTypes);
          }
        })
        .catch((error) => {
          console.error('Fatal error in batch research generation:', error);
        });

      // Mark baseline action complete for company research (multiple types)
      markBaselineActionsComplete(user.id, 'company_researched').catch((err) => {
        console.error('Error marking company_researched baseline action (batch):', err);
      });

      // Return immediately
      console.log('Returning success response (research generation continues in background)');
      return NextResponse.json({
        success: true,
        message: `Started research generation for ${typesToGenerate.length} vectors`,
        types: typesToGenerate,
      });
    }
  } catch (error) {
    console.error('=== POST /api/jobs/companies/[id]/research - ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    console.log('=== POST /api/jobs/companies/[id]/research - END ===');
  }
};

