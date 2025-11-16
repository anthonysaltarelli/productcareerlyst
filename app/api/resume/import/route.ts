import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { slugify, generateUniqueSlug } from '@/lib/utils/slugify';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// JSON Schema for structured output
// Note: additionalProperties must be false for all objects per OpenAI requirements
const RESUME_EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    contactInfo: {
      type: 'object',
      additionalProperties: false,
      properties: {
        full_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        linkedin: { type: ['string', 'null'] },
        portfolio: { type: ['string', 'null'] },
      },
      required: ['full_name', 'email', 'phone', 'location', 'linkedin', 'portfolio'],
    },
    summary: {
      type: ['string', 'null'],
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: ['string', 'null'] },
          start_date: { type: ['string', 'null'] },
          end_date: { type: ['string', 'null'] },
          bullets: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['title', 'company', 'location', 'start_date', 'end_date', 'bullets'],
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          school: { type: 'string' },
          degree: { type: 'string' },
          field: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          start_date: { type: ['string', 'null'] },
          end_date: { type: ['string', 'null'] },
          gpa: { type: ['string', 'null'] },
          achievements: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['school', 'degree', 'field', 'location', 'start_date', 'end_date', 'gpa', 'achievements'],
      },
    },
    skills: {
      type: 'object',
      additionalProperties: false,
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        product: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
      },
      required: ['technical', 'product', 'soft'],
    },
  },
  required: ['contactInfo', 'summary', 'experiences', 'education', 'skills'],
};

// Prompt for extracting resume data
const EXTRACTION_PROMPT = `Extract all information from this resume and return it in the specified JSON format. Include:
- Contact information (name, email, phone, location, LinkedIn, portfolio)
- Professional summary
- All work experiences with their bullet points
- All education entries with achievements
- Skills categorized as technical, product, or soft skills

IMPORTANT: When a person has multiple roles at the same company (e.g., "Product Manager" then "Senior Product Manager" at Squarespace), create separate experience entries for each role. Each role should have:
- Its own title
- Its own start_date and end_date (the end_date of one role should match the start_date of the next role, or be the same if overlapping)
- Its own bullets that were specific to that role
- The same company name and location

For dates, use either:
- Year only format: "2022" (when only the year is available)
- Month Year format: "July 2022" or "Jul 2022" (when month and year are available)
- Preserve "Present" for current roles
- Use the format that best matches what's shown on the resume`;

// POST /api/resume/import - Import resume from PDF/DOCX file
export const POST = async (request: NextRequest) => {
  let openAIFileId: string | null = null;
  let createdVersionId: string | null = null;

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const versionName = formData.get('versionName') as string | null;
    const isMaster = formData.get('isMaster') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!versionName || versionName.trim() === '') {
      return NextResponse.json(
        { error: 'Version name is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 5MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Only PDF and DOCX files are supported.` },
        { status: 400 }
      );
    }

    // Step 1: Upload file to OpenAI
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    const uploadFormData = new FormData();
    uploadFormData.append('file', fileBlob, file.name);
    uploadFormData.append('purpose', 'assistants');

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('OpenAI file upload error:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload file to OpenAI', details: errorData },
        { status: 500 }
      );
    }

    const uploadData = await uploadResponse.json();
    openAIFileId = uploadData.id;

    if (!openAIFileId) {
      return NextResponse.json(
        { error: 'Failed to get file ID from OpenAI' },
        { status: 500 }
      );
    }

    // Step 2: Call OpenAI Responses API with structured output
    const requestPayload = {
      model: 'gpt-5.1',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: EXTRACTION_PROMPT,
            },
            {
              type: 'input_file',
              file_id: openAIFileId,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'resume_data',
          schema: RESUME_EXTRACTION_SCHEMA,
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

    // Step 3: Poll for completion
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (status === 'in_progress' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
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

    // Step 4: Get final response
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
    let extractedData: any = null;

    // Try to get output_text from content
    const outputItem = finalData.output?.[0];
    if (outputItem?.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === 'output_text' && contentItem.text) {
          try {
            extractedData = JSON.parse(contentItem.text);
            break;
          } catch (e) {
            // Try next content item
          }
        }
      }
    }

    // Fallback: try to parse refusal or other content
    if (!extractedData) {
      // Check for refusal
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
        { error: 'Failed to extract structured data from OpenAI response' },
        { status: 500 }
      );
    }

    // Step 5: Create version in database
    const baseSlug = slugify(versionName);
    const uniqueSlug = await generateUniqueSlug(supabase, user.id, baseSlug);

    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        name: versionName.trim(),
        slug: uniqueSlug,
        is_master: isMaster,
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error('Error creating resume version:', versionError);
      return NextResponse.json(
        { error: 'Failed to create resume version' },
        { status: 500 }
      );
    }

    createdVersionId = version.id;

    // Step 6: Insert all resume data
    try {
      // Insert contact info
      if (extractedData.contactInfo) {
        const { error: contactError } = await supabase
          .from('resume_contact_info')
          .insert({
            version_id: version.id,
            full_name: extractedData.contactInfo.full_name?.trim() || '',
            email: extractedData.contactInfo.email?.trim() || '',
            phone: extractedData.contactInfo.phone?.trim() || null,
            location: extractedData.contactInfo.location?.trim() || null,
            linkedin: extractedData.contactInfo.linkedin?.trim() || null,
            portfolio: extractedData.contactInfo.portfolio?.trim() || null,
          });

        if (contactError) {
          throw new Error(`Failed to insert contact info: ${contactError.message}`);
        }
      }

      // Insert summary
      if (extractedData.summary) {
        const { error: summaryError } = await supabase
          .from('resume_summaries')
          .insert({
            version_id: version.id,
            content: extractedData.summary.trim(),
          });

        if (summaryError) {
          throw new Error(`Failed to insert summary: ${summaryError.message}`);
        }
      }

      // Insert experiences with bullets
      // Group experiences by company only if they are sequential roles (same company, sequential dates)
      if (extractedData.experiences && Array.isArray(extractedData.experiences)) {
        // Track company groups: company name -> { role_group_id, last_end_date }
        const companyGroups = new Map<string, { roleGroupId: string; lastEndDate: string | null }>();
        let globalDisplayOrder = 0;

        // Helper to parse date for comparison (handles "July 2022", "2022", "2022-07", and "Present")
        const parseDate = (dateStr: string | null): number => {
          if (!dateStr || dateStr.toLowerCase() === 'present') return Infinity;
          
          // Try Month Year format: "July 2022" or "Jul 2022"
          const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/i);
          if (monthYearMatch) {
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                               'july', 'august', 'september', 'october', 'november', 'december'];
            const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const monthStr = monthYearMatch[1].toLowerCase();
            const year = parseInt(monthYearMatch[2]);
            let month = monthNames.indexOf(monthStr);
            if (month === -1) {
              month = monthAbbr.indexOf(monthStr);
            }
            if (month !== -1) {
              return year * 12 + month;
            }
          }
          
          // Try YYYY-MM format: "2022-07"
          const dashMatch = dateStr.match(/(\d{4})-(\d{1,2})/);
          if (dashMatch) {
            return parseInt(dashMatch[1]) * 12 + parseInt(dashMatch[2]) - 1;
          }
          
          // Try year only: "2022"
          const yearMatch = dateStr.match(/(\d{4})/);
          if (yearMatch) {
            return parseInt(yearMatch[1]) * 12;
          }
          
          // Fallback: return 0 if we can't parse
          return 0;
        };

        for (let expIndex = 0; expIndex < extractedData.experiences.length; expIndex++) {
          const exp = extractedData.experiences[expIndex];
          const companyName = exp.company?.trim() || '';
          const normalizedCompany = companyName.toLowerCase();
          
          // Check if previous experience was at the same company and sequential
          let roleGroupId: string | null = null;
          const prevExp = expIndex > 0 ? extractedData.experiences[expIndex - 1] : null;
          const isSequentialAtSameCompany = prevExp && 
            normalizedCompany === (prevExp.company?.trim() || '').toLowerCase() &&
            exp.start_date && prevExp.end_date &&
            parseDate(exp.start_date) <= parseDate(prevExp.end_date) + 1; // Allow 1 month gap
          
          if (isSequentialAtSameCompany) {
            // Use the same role_group_id as the previous experience
            const groupInfo = companyGroups.get(normalizedCompany);
            if (groupInfo) {
              roleGroupId = groupInfo.roleGroupId;
            }
          }
          
          // If not sequential, create a new group (or standalone if first at company)
          if (!roleGroupId) {
            roleGroupId = crypto.randomUUID();
            companyGroups.set(normalizedCompany, {
              roleGroupId,
              lastEndDate: exp.end_date?.trim() || null,
            });
          } else {
            // Update the last end date for this company group
            const groupInfo = companyGroups.get(normalizedCompany);
            if (groupInfo) {
              groupInfo.lastEndDate = exp.end_date?.trim() || null;
            }
          }

          const { data: experience, error: expError } = await supabase
            .from('resume_experiences')
            .insert({
              version_id: version.id,
              title: exp.title?.trim() || '',
              company: companyName,
              location: exp.location?.trim() || null,
              start_date: exp.start_date?.trim() || null,
              end_date: exp.end_date?.trim() || null,
              display_order: globalDisplayOrder++,
              role_group_id: roleGroupId,
            })
            .select()
            .single();

          if (expError || !experience) {
            throw new Error(`Failed to insert experience: ${expError?.message || 'Unknown error'}`);
          }

          // Insert bullets for this experience
          // For sequential roles at the same company, only keep bullets that are unique to this role
          // If all bullets are duplicates, skip inserting bullets for this role (they belong to the first role)
          if (exp.bullets && Array.isArray(exp.bullets) && exp.bullets.length > 0) {
            let bulletsToInsert = exp.bullets.map((bullet: string, bulletIndex: number) => ({
              experience_id: experience.id,
              content: bullet.trim(),
              is_selected: true,
              display_order: bulletIndex,
            }));

            // If this is a sequential role at the same company, check for duplicate bullets
            if (isSequentialAtSameCompany && prevExp?.bullets) {
              const prevBullets = prevExp.bullets.map((b: string) => b.trim().toLowerCase());
              const currentBullets = exp.bullets.map((b: string) => b.trim().toLowerCase());
              
              // Check if ALL bullets are duplicates (meaning this role has no unique bullets)
              const allDuplicates = currentBullets.every(bullet => prevBullets.includes(bullet));
              
              if (allDuplicates) {
                // All bullets are duplicates - don't insert any bullets for this role
                // They belong to the first role in the group
                bulletsToInsert = [];
              } else {
                // Some bullets are unique - only keep the unique ones
                bulletsToInsert = bulletsToInsert.filter(
                  bullet => !prevBullets.includes(bullet.content.trim().toLowerCase())
                );
              }
            }

            if (bulletsToInsert.length > 0) {
              const { error: bulletsError } = await supabase
                .from('resume_experience_bullets')
                .insert(bulletsToInsert);

              if (bulletsError) {
                throw new Error(`Failed to insert bullets: ${bulletsError.message}`);
              }
            }
          }
        }
      }

      // Insert education with achievements
      if (extractedData.education && Array.isArray(extractedData.education)) {
        for (let eduIndex = 0; eduIndex < extractedData.education.length; eduIndex++) {
          const edu = extractedData.education[eduIndex];

          const { data: education, error: eduError } = await supabase
            .from('resume_education')
            .insert({
              version_id: version.id,
              school: edu.school?.trim() || '',
              degree: edu.degree?.trim() || '',
              field: edu.field?.trim() || null,
              location: edu.location?.trim() || null,
              start_date: edu.start_date?.trim() || null,
              end_date: edu.end_date?.trim() || null,
              gpa: edu.gpa?.trim() || null,
              display_order: eduIndex,
            })
            .select()
            .single();

          if (eduError || !education) {
            throw new Error(`Failed to insert education: ${eduError?.message || 'Unknown error'}`);
          }

          // Insert achievements for this education
          if (edu.achievements && Array.isArray(edu.achievements) && edu.achievements.length > 0) {
            const achievementsToInsert = edu.achievements.map((achievement: string, achievementIndex: number) => ({
              education_id: education.id,
              achievement: achievement.trim(),
              display_order: achievementIndex,
            }));

            const { error: achievementsError } = await supabase
              .from('resume_education_achievements')
              .insert(achievementsToInsert);

            if (achievementsError) {
              throw new Error(`Failed to insert achievements: ${achievementsError.message}`);
            }
          }
        }
      }

      // Insert skills
      if (extractedData.skills) {
        const skillsToInsert: any[] = [];

        // Technical skills
        if (extractedData.skills.technical && Array.isArray(extractedData.skills.technical)) {
          extractedData.skills.technical.forEach((skill: string, index: number) => {
            if (skill?.trim()) {
              skillsToInsert.push({
                version_id: version.id,
                category: 'technical',
                skill_name: skill.trim(),
                display_order: index,
              });
            }
          });
        }

        // Product skills
        if (extractedData.skills.product && Array.isArray(extractedData.skills.product)) {
          extractedData.skills.product.forEach((skill: string, index: number) => {
            if (skill?.trim()) {
              skillsToInsert.push({
                version_id: version.id,
                category: 'product',
                skill_name: skill.trim(),
                display_order: index,
              });
            }
          });
        }

        // Soft skills
        if (extractedData.skills.soft && Array.isArray(extractedData.skills.soft)) {
          extractedData.skills.soft.forEach((skill: string, index: number) => {
            if (skill?.trim()) {
              skillsToInsert.push({
                version_id: version.id,
                category: 'soft',
                skill_name: skill.trim(),
                display_order: index,
              });
            }
          });
        }

        if (skillsToInsert.length > 0) {
          const { error: skillsError } = await supabase
            .from('resume_skills')
            .insert(skillsToInsert);

          if (skillsError) {
            throw new Error(`Failed to insert skills: ${skillsError.message}`);
          }
        }
      }

      // Initialize default styles
      const { error: stylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: version.id,
        });

      if (stylesError) {
        console.error('Error creating default styles:', stylesError);
        // Non-fatal, continue
      }
    } catch (insertError) {
      // Cleanup: delete the version if data insertion failed
      if (createdVersionId) {
        await supabase
          .from('resume_versions')
          .delete()
          .eq('id', createdVersionId);
      }

      const errorMessage = insertError instanceof Error ? insertError.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to insert resume data: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Step 7: Cleanup OpenAI file
    if (openAIFileId) {
      try {
        await fetch(`https://api.openai.com/v1/files/${openAIFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
          },
        });
      } catch (cleanupError) {
        console.error('Error cleaning up OpenAI file:', cleanupError);
        // Non-fatal, continue
      }
    }

    // Step 8: Fetch complete resume data to return
    const { data: completeResume } = await supabase
      .from('resume_versions')
      .select(`
        *,
        contactInfo:resume_contact_info(*),
        summary:resume_summaries(content),
        experiences:resume_experiences(
          *,
          bullets:resume_experience_bullets(*)
        ),
        education:resume_education(
          *,
          achievements:resume_education_achievements(*)
        ),
        skills:resume_skills(*),
        styles:resume_styles(*)
      `)
      .eq('id', version.id)
      .single();

    return NextResponse.json({
      version: completeResume,
      message: 'Resume imported successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in resume import:', error);

    // Cleanup on error
    if (createdVersionId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('resume_versions')
          .delete()
          .eq('id', createdVersionId);
      } catch (cleanupError) {
        console.error('Error cleaning up version:', cleanupError);
      }
    }

    if (openAIFileId && process.env.OPEN_AI_SECRET_KEY) {
      try {
        await fetch(`https://api.openai.com/v1/files/${openAIFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.OPEN_AI_SECRET_KEY}`,
          },
        });
      } catch (cleanupError) {
        console.error('Error cleaning up OpenAI file:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
};

