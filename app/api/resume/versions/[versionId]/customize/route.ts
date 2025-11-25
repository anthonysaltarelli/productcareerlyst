import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// JSON Schema for resume customization structured output
const RESUME_CUSTOMIZATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    customizationSummary: {
      type: 'object',
      additionalProperties: false,
      properties: {
        overallDescription: {
          type: 'string',
          description: 'Human-readable summary of all changes made',
        },
        keyChanges: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of major changes made to the resume',
        },
        keywordsInjected: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords from the job description that were added to the resume',
        },
        bulletsReordered: {
          type: 'integer',
          minimum: 0,
          description: 'Count of bullets that had their order changed',
        },
        bulletsOptimized: {
          type: 'integer',
          minimum: 0,
          description: 'Count of bullets that had their content modified',
        },
        skillsAdded: {
          type: 'integer',
          minimum: 0,
          description: 'Count of new skills added',
        },
      },
      required: ['overallDescription', 'keyChanges', 'keywordsInjected', 'bulletsReordered', 'bulletsOptimized', 'skillsAdded'],
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          originalId: {
            type: 'string',
            description: 'The original experience ID from the source resume',
          },
          bullets: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                originalId: {
                  type: 'string',
                  description: 'The original bullet ID from the source resume',
                },
                newDisplayOrder: {
                  type: 'integer',
                  minimum: 0,
                  description: 'New display order for this bullet (0-indexed)',
                },
                wasReordered: {
                  type: 'boolean',
                  description: 'True if the bullet position changed from original',
                },
                wasOptimized: {
                  type: 'boolean',
                  description: 'True if the bullet content was modified',
                },
                optimizedContent: {
                  type: ['string', 'null'],
                  description: 'Modified content if wasOptimized is true, null otherwise',
                },
                changeReason: {
                  type: ['string', 'null'],
                  description: 'Explanation of why the bullet was changed, null if unchanged',
                },
              },
              required: ['originalId', 'newDisplayOrder', 'wasReordered', 'wasOptimized', 'optimizedContent', 'changeReason'],
            },
          },
        },
        required: ['originalId', 'bullets'],
      },
    },
    suggestedSkills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: {
            type: 'string',
            enum: ['technical', 'product', 'soft'],
            description: 'The skill category',
          },
          skillName: {
            type: 'string',
            description: 'The skill name to add',
          },
          reason: {
            type: 'string',
            description: 'Why this skill should be added based on the job description',
          },
        },
        required: ['category', 'skillName', 'reason'],
      },
    },
    optimizedSummary: {
      type: ['string', 'null'],
      description: 'Optimized professional summary if changes were made, null otherwise',
    },
    summaryChangeReason: {
      type: ['string', 'null'],
      description: 'Explanation of summary changes, null if unchanged',
    },
  },
  required: ['customizationSummary', 'experiences', 'suggestedSkills', 'optimizedSummary', 'summaryChangeReason'],
};

// Create the customization prompt
const createCustomizationPrompt = (
  resumeData: {
    summary: string;
    experiences: Array<{
      id: string;
      title: string;
      company: string;
      bullets: Array<{
        id: string;
        content: string;
        displayOrder: number;
      }>;
    }>;
    skills: {
      technical: string[];
      product: string[];
      soft: string[];
    };
  },
  jobDescription: string,
  jobTitle: string,
  companyName: string
): string => {
  const experiencesText = resumeData.experiences.map(exp => {
    const bulletsText = exp.bullets
      .map((b, idx) => `    [Bullet ID: ${b.id}] (Order: ${b.displayOrder}) ${b.content}`)
      .join('\n');
    return `  [Experience ID: ${exp.id}] ${exp.title} at ${exp.company}\n${bulletsText}`;
  }).join('\n\n');

  const skillsText = `
  Technical: ${resumeData.skills.technical.join(', ') || 'None'}
  Product: ${resumeData.skills.product.join(', ') || 'None'}
  Soft: ${resumeData.skills.soft.join(', ') || 'None'}`;

  return `You are an expert resume optimization specialist helping a Product Manager tailor their resume for a specific job opportunity.

**TARGET JOB:**
- Position: ${jobTitle}
- Company: ${companyName}

**JOB DESCRIPTION:**
${jobDescription}

**CURRENT RESUME:**

Professional Summary:
${resumeData.summary || '(No summary provided)'}

Work Experience:
${experiencesText}

Skills:
${skillsText}

---

**YOUR TASK:**

Customize this resume to better match the job description while following these STRICT RULES:

1. **BULLET REORDERING:**
   - Analyze what the job description prioritizes (requirements listed first are most important)
   - Reorder bullets within each experience so the most relevant achievements appear first
   - Keep all bullets - just change their display_order values
   - Set newDisplayOrder starting from 0 for each experience

2. **BULLET OPTIMIZATION (BE CONSERVATIVE):**
   - You may ONLY make minor language adjustments to naturally incorporate keywords from the job description
   - NEVER fabricate achievements, metrics, or experiences
   - NEVER change the fundamental meaning of a bullet
   - NEVER add quantitative claims that weren't in the original
   - If you modify a bullet, the change should be subtle (synonym substitution, adding a keyword naturally)
   - If a bullet doesn't need changes, set wasOptimized to false and optimizedContent to null

3. **KEYWORD INJECTION:**
   - Identify key terms from the job description that could naturally fit into existing bullets
   - Only inject keywords where they genuinely fit without forcing them
   - Track which keywords you successfully injected

4. **SKILLS SUGGESTIONS:**
   - Identify relevant skills mentioned in the job description that are NOT in the current resume
   - Only suggest skills that the candidate likely has based on their experience bullets
   - Categorize each as 'technical', 'product', or 'soft'

5. **SUMMARY OPTIMIZATION:**
   - If the summary could be improved to better align with the job, provide an optimized version
   - Keep the same length and tone, just adjust language for relevance
   - If no changes needed, set optimizedSummary to null

6. **CHANGE TRACKING:**
   - For every bullet, accurately track whether it was reordered and/or optimized
   - Provide clear, concise reasons for any changes made
   - The customizationSummary should give an honest overview of all changes

**IMPORTANT:** Be honest in your summary. If you only made minor changes, say so. Quality over quantity.`;
};

// POST /api/resume/versions/[versionId]/customize - Customize resume for a job
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { versionId } = await params;
    const body = await request.json();

    const { applicationId, newName, jobDescription: providedJobDescription } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    if (!newName) {
      return NextResponse.json(
        { error: 'newName is required' },
        { status: 400 }
      );
    }

    // Verify source version ownership
    const { data: sourceVersion, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !sourceVersion) {
      return NextResponse.json(
        { error: 'Source resume version not found' },
        { status: 404 }
      );
    }

    // Fetch job application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        company:companies(name)
      `)
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }

    // Determine job description - use stored or provided
    let jobDescription = application.description;

    if (!jobDescription && providedJobDescription) {
      // Save the provided job description to the application
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ description: providedJobDescription })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating job description:', updateError);
      }
      
      jobDescription = providedJobDescription;
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required. Please provide it in the request or ensure the job application has a description.' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    const openAIApiKey = process.env.OPEN_AI_SECRET_KEY;
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch complete resume data from source version
    const [
      { data: contactInfo },
      { data: summary },
      { data: experiences },
      { data: education },
      { data: skills },
      { data: styles },
    ] = await Promise.all([
      supabase
        .from('resume_contact_info')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_summaries')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_experiences')
        .select(`
          *,
          bullets:resume_experience_bullets(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_education')
        .select(`
          *,
          achievements:resume_education_achievements(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_skills')
        .select('*')
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_styles')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
    ]);

    // Prepare resume data for AI
    const resumeDataForAI = {
      summary: summary?.content || '',
      experiences: (experiences || []).map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        bullets: (exp.bullets || [])
          .filter((b: any) => b.is_selected)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((b: any) => ({
            id: b.id,
            content: b.content,
            displayOrder: b.display_order || 0,
          })),
      })),
      skills: {
        technical: (skills || []).filter((s: any) => s.category === 'technical').map((s: any) => s.skill_name),
        product: (skills || []).filter((s: any) => s.category === 'product').map((s: any) => s.skill_name),
        soft: (skills || []).filter((s: any) => s.category === 'soft').map((s: any) => s.skill_name),
      },
    };

    // Create the prompt
    const prompt = createCustomizationPrompt(
      resumeDataForAI,
      jobDescription,
      application.title,
      application.company?.name || 'Unknown Company'
    );

    // Call OpenAI Responses API with structured output
    const requestPayload = {
      model: 'gpt-5.1',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'resume_customization',
          schema: RESUME_CUSTOMIZATION_SCHEMA,
          strict: true,
        },
      },
    };

    const responseResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!responseResponse.ok) {
      const errorData = await responseResponse.json().catch(() => ({}));
      console.error('OpenAI response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to process resume with OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const responseData = await responseResponse.json();
    const responseId = responseData.id;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Failed to get response ID from OpenAI' },
        { status: 500 }
      );
    }

    // Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes max for customization

    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;

      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Timeout waiting for OpenAI response' },
          { status: 500 }
        );
      }

      const statusResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.error('OpenAI status check error:', errorData);
        return NextResponse.json(
          { error: 'Failed to check OpenAI response status', details: errorData },
          { status: 500 }
        );
      }

      const statusData = await statusResponse.json();
      status = statusData.status;

      if (status === 'failed') {
        const errorDetails = statusData.error || {};
        return NextResponse.json(
          { error: 'OpenAI processing failed', details: errorDetails },
          { status: 500 }
        );
      }
    }

    // Get final response
    const finalResponse = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
    });

    if (!finalResponse.ok) {
      const errorData = await finalResponse.json().catch(() => ({}));
      console.error('OpenAI final response error:', errorData);
      return NextResponse.json(
        { error: 'Failed to retrieve final response from OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const finalData = await finalResponse.json();

    // Extract structured output
    let customizationResult: any = null;

    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            customizationResult = JSON.parse(contentItem.text);
            break;
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    if (!customizationResult) {
      if (outputItem?.content) {
        for (const contentItem of outputItem.content) {
          if (contentItem.type === 'refusal' && contentItem.refusal) {
            return NextResponse.json(
              { error: 'OpenAI refused to process the resume', refusal: contentItem.refusal },
              { status: 400 }
            );
          }
        }
      }

      return NextResponse.json(
        { error: 'Failed to extract customization data from OpenAI response' },
        { status: 500 }
      );
    }

    // Build detailed bullet changes with original content for comparison
    const bulletChangesWithOriginal: Array<{
      experienceId: string;
      experienceTitle: string;
      experienceCompany: string;
      bullets: Array<{
        bulletId: string;
        originalContent: string;
        newContent: string;
        wasOptimized: boolean;
        wasReordered: boolean;
        originalOrder: number;
        newOrder: number;
        changeReason: string | null;
      }>;
    }> = [];

    // Map original bullet content by ID
    const originalBulletContent = new Map<string, { content: string; displayOrder: number }>();
    for (const exp of experiences || []) {
      for (const bullet of exp.bullets || []) {
        originalBulletContent.set(bullet.id, {
          content: bullet.content,
          displayOrder: bullet.display_order || 0,
        });
      }
    }

    // Build detailed changes for each experience
    for (const exp of experiences || []) {
      const expCustomization = customizationResult.experiences.find(
        (e: any) => e.originalId === exp.id
      );
      
      if (expCustomization?.bullets) {
        const bulletChanges = expCustomization.bullets
          .filter((b: any) => b.wasOptimized || b.wasReordered)
          .map((bulletCustom: any) => {
            const original = originalBulletContent.get(bulletCustom.originalId);
            return {
              bulletId: bulletCustom.originalId,
              originalContent: original?.content || '',
              newContent: bulletCustom.optimizedContent || original?.content || '',
              wasOptimized: bulletCustom.wasOptimized,
              wasReordered: bulletCustom.wasReordered,
              originalOrder: original?.displayOrder || 0,
              newOrder: bulletCustom.newDisplayOrder,
              changeReason: bulletCustom.changeReason,
            };
          });

        if (bulletChanges.length > 0) {
          bulletChangesWithOriginal.push({
            experienceId: exp.id,
            experienceTitle: exp.title,
            experienceCompany: exp.company,
            bullets: bulletChanges,
          });
        }
      }
    }

    // Build full customization data with original content for comparison
    const fullCustomizationData = {
      ...customizationResult.customizationSummary,
      originalSummary: summary?.content || null,
      optimizedSummary: customizationResult.optimizedSummary,
      summaryChangeReason: customizationResult.summaryChangeReason,
      bulletChanges: bulletChangesWithOriginal,
      suggestedSkills: customizationResult.suggestedSkills,
    };

    // Count existing resumes for this application to determine version number
    const { count: existingCount } = await supabase
      .from('resume_versions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('application_id', applicationId);

    // Append version number if there are existing resumes for this application
    const versionNumber = (existingCount || 0) + 1;
    const versionedName = versionNumber > 1 ? `${newName} v${versionNumber}` : newName;
    const baseSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const versionedSlug = versionNumber > 1 ? `${baseSlug}-v${versionNumber}` : baseSlug;

    // Also check for slug uniqueness across all user's resumes (not just this application)
    const { data: existingSlugs } = await supabase
      .from('resume_versions')
      .select('slug')
      .eq('user_id', user.id)
      .like('slug', `${baseSlug}%`);

    // Find a unique slug
    let finalSlug = versionedSlug;
    let finalName = versionedName;
    if (existingSlugs && existingSlugs.some(r => r.slug === finalSlug)) {
      // Find the next available version number
      let counter = versionNumber;
      while (existingSlugs.some(r => r.slug === `${baseSlug}-v${counter}`)) {
        counter++;
      }
      finalSlug = `${baseSlug}-v${counter}`;
      finalName = `${newName} v${counter}`;
    }

    const { data: newVersion, error: createError } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        name: finalName,
        slug: finalSlug,
        is_master: false,
        application_id: applicationId,
        customization_summary: fullCustomizationData,
      })
      .select()
      .single();

    if (createError || !newVersion) {
      console.error('Error creating new version:', createError);
      return NextResponse.json(
        { error: 'Failed to create new version' },
        { status: 500 }
      );
    }

    // Clone contact info
    if (contactInfo) {
      const { error: contactError } = await supabase
        .from('resume_contact_info')
        .insert({
          version_id: newVersion.id,
          full_name: contactInfo.full_name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          location: contactInfo.location,
          linkedin: contactInfo.linkedin,
          portfolio: contactInfo.portfolio,
        });

      if (contactError) {
        console.error('Error cloning contact info:', contactError);
      }
    }

    // Clone summary (with potential optimization)
    if (summary || customizationResult.optimizedSummary) {
      const { error: summaryError } = await supabase
        .from('resume_summaries')
        .insert({
          version_id: newVersion.id,
          content: customizationResult.optimizedSummary || summary?.content || '',
        });

      if (summaryError) {
        console.error('Error cloning summary:', summaryError);
      }
    }

    // Create a map of experience customizations for quick lookup
    const experienceCustomizations = new Map<string, any>();
    for (const expCustom of customizationResult.experiences) {
      experienceCustomizations.set(expCustom.originalId, expCustom);
    }

    // Clone experiences with customized bullets
    if (experiences && experiences.length > 0) {
      for (const exp of experiences) {
        const { data: newExp, error: expError } = await supabase
          .from('resume_experiences')
          .insert({
            version_id: newVersion.id,
            title: exp.title,
            company: exp.company,
            location: exp.location,
            start_date: exp.start_date,
            end_date: exp.end_date,
            display_order: exp.display_order,
            role_group_id: exp.role_group_id,
            bullet_mode: exp.bullet_mode,
          })
          .select()
          .single();

        if (expError || !newExp) {
          console.error('Error cloning experience:', expError);
          continue;
        }

        // Get customization for this experience
        const expCustomization = experienceCustomizations.get(exp.id);
        const bulletCustomizations = new Map<string, any>();
        
        if (expCustomization?.bullets) {
          for (const bulletCustom of expCustomization.bullets) {
            bulletCustomizations.set(bulletCustom.originalId, bulletCustom);
          }
        }

        // Clone bullets with customizations
        if (exp.bullets && exp.bullets.length > 0) {
          const bulletsToInsert = exp.bullets.map((bullet: any) => {
            const customization = bulletCustomizations.get(bullet.id);
            
            return {
              experience_id: newExp.id,
              content: customization?.optimizedContent || bullet.content,
              is_selected: bullet.is_selected,
              display_order: customization?.newDisplayOrder ?? bullet.display_order,
              score: bullet.score,
              tags: bullet.tags,
            };
          });

          const { error: bulletsError } = await supabase
            .from('resume_experience_bullets')
            .insert(bulletsToInsert);

          if (bulletsError) {
            console.error('Error cloning bullets:', bulletsError);
          }
        }
      }
    }

    // Clone education with achievements
    if (education && education.length > 0) {
      for (const edu of education) {
        const { data: newEdu, error: eduError } = await supabase
          .from('resume_education')
          .insert({
            version_id: newVersion.id,
            school: edu.school,
            degree: edu.degree,
            field: edu.field,
            location: edu.location,
            start_date: edu.start_date,
            end_date: edu.end_date,
            gpa: edu.gpa,
            display_order: edu.display_order,
          })
          .select()
          .single();

        if (eduError || !newEdu) {
          console.error('Error cloning education:', eduError);
          continue;
        }

        if (edu.achievements && edu.achievements.length > 0) {
          const achievementsToInsert = edu.achievements.map((achievement: any) => ({
            education_id: newEdu.id,
            achievement: achievement.achievement,
            display_order: achievement.display_order,
          }));

          const { error: achievementsError } = await supabase
            .from('resume_education_achievements')
            .insert(achievementsToInsert);

          if (achievementsError) {
            console.error('Error cloning achievements:', achievementsError);
          }
        }
      }
    }

    // Clone existing skills
    const existingSkillNames = new Set(
      (skills || []).map((s: any) => s.skill_name.toLowerCase())
    );

    if (skills && skills.length > 0) {
      const skillsToInsert = skills.map((skill: any) => ({
        version_id: newVersion.id,
        category: skill.category,
        skill_name: skill.skill_name,
        display_order: skill.display_order,
      }));

      const { error: skillsError } = await supabase
        .from('resume_skills')
        .insert(skillsToInsert);

      if (skillsError) {
        console.error('Error cloning skills:', skillsError);
      }
    }

    // Add suggested skills (only if they don't already exist)
    if (customizationResult.suggestedSkills && customizationResult.suggestedSkills.length > 0) {
      const newSkills = customizationResult.suggestedSkills
        .filter((skill: any) => !existingSkillNames.has(skill.skillName.toLowerCase()))
        .map((skill: any, index: number) => ({
          version_id: newVersion.id,
          category: skill.category,
          skill_name: skill.skillName,
          display_order: (skills?.length || 0) + index,
        }));

      if (newSkills.length > 0) {
        const { error: newSkillsError } = await supabase
          .from('resume_skills')
          .insert(newSkills);

        if (newSkillsError) {
          console.error('Error adding suggested skills:', newSkillsError);
        }
      }
    }

    // Clone styles
    if (styles) {
      const { error: stylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: newVersion.id,
          font_family: styles.font_family,
          font_size: styles.font_size,
          line_height: styles.line_height,
          margin_top: styles.margin_top,
          margin_bottom: styles.margin_bottom,
          margin_left: styles.margin_left,
          margin_right: styles.margin_right,
          accent_color: styles.accent_color,
          heading_color: styles.heading_color,
          text_color: styles.text_color,
          experience_display_mode: styles.experience_display_mode,
        });

      if (stylesError) {
        console.error('Error cloning styles:', stylesError);
      }
    } else {
      // Create default styles
      const { error: defaultStylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: newVersion.id,
        });

      if (defaultStylesError) {
        console.error('Error creating default styles:', defaultStylesError);
      }
    }

    return NextResponse.json({
      version: newVersion,
      customizationSummary: customizationResult.customizationSummary,
      experiences: customizationResult.experiences,
      suggestedSkills: customizationResult.suggestedSkills,
      optimizedSummary: customizationResult.optimizedSummary,
      summaryChangeReason: customizationResult.summaryChangeReason,
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

