import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portfolio/cover-templates
 * 
 * Returns a list of template cover photos from Supabase storage.
 * These are pre-uploaded images users can select for their portfolio pages.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // List files in the template covers folder
    const { data: files, error } = await supabase.storage
      .from('portfolio-images')
      .list('portfolio_template_cover_hotos', {
        limit: 50,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('Error listing template covers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch template covers' },
        { status: 500 }
      );
    }

    // Filter out any folders and get only image files
    const imageFiles = (files || []).filter(
      (file) => file.name && !file.name.endsWith('/') && file.id
    );

    // Generate public URLs for each image
    const templates = imageFiles.map((file) => {
      const { data: urlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(`portfolio_template_cover_hotos/${file.name}`);

      return {
        id: file.id,
        name: formatTemplateName(file.name),
        url: urlData.publicUrl,
        filename: file.name,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in cover-templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Formats a filename into a readable template name
 * e.g., "adrian-infernus-GLf7bAwCdYg-unsplash.jpg" -> "Adrian Infernus"
 */
const formatTemplateName = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Remove unsplash ID suffix (everything after the last hyphen that looks like an ID)
  const parts = nameWithoutExt.split('-');
  
  // Remove 'unsplash' and the ID part
  const cleanParts = parts.filter(
    (part) => part !== 'unsplash' && !/^[A-Za-z0-9_]{8,}$/.test(part)
  );
  
  // Capitalize each word
  return cleanParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

