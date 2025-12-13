import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import * as React from 'react';
import { TrialWelcomeEmail } from '@/app/components/emails/TrialWelcomeEmail';
import { TrialWelcomeEmailV2 } from '@/app/components/emails/TrialWelcomeEmailV2';
import { TrialWelcomeEmailV3 } from '@/app/components/emails/TrialWelcomeEmailV3';
import { TrialDay1LessonsEmail } from '@/app/components/emails/TrialDay1LessonsEmail';
import { TrialDay2ContactsEmail } from '@/app/components/emails/TrialDay2ContactsEmail';
import { TrialDay3ResumeEmail } from '@/app/components/emails/TrialDay3ResumeEmail';
import { TrialDay4PortfolioEmail } from '@/app/components/emails/TrialDay4PortfolioEmail';
import { TrialDay5JobsEmail } from '@/app/components/emails/TrialDay5JobsEmail';
import { TrialDay6EndsSoonEmail } from '@/app/components/emails/TrialDay6EndsSoonEmail';
import { TrialDay7EndedEmail } from '@/app/components/emails/TrialDay7EndedEmail';
import { TrialDay10StillInterestedEmail } from '@/app/components/emails/TrialDay10StillInterestedEmail';
import { TrialDay14NeedHelpEmail } from '@/app/components/emails/TrialDay14NeedHelpEmail';
import { TrialDay21DiscountEmail } from '@/app/components/emails/TrialDay21DiscountEmail';
import { TrialDay28DiscountReminderEmail } from '@/app/components/emails/TrialDay28DiscountReminderEmail';
import { OTPEmail } from '@/app/components/emails/OTPEmail';
import { TestSequenceEmail } from '@/app/components/emails/TestSequenceEmail';
import { OnboardingAbandoned15MinEmail } from '@/app/components/emails/OnboardingAbandoned15MinEmail';
import { OnboardingAbandoned1DayEmail } from '@/app/components/emails/OnboardingAbandoned1DayEmail';
import { OnboardingAbandoned7DayEmail } from '@/app/components/emails/OnboardingAbandoned7DayEmail';

/**
 * Template Service for Email System
 * 
 * Handles template retrieval, rendering, and versioning.
 * Supports React Email components stored in metadata.
 */

/**
 * Component registry - maps component paths to actual React components
 * This avoids dynamic import issues with @/ aliases in server-side code
 */
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  '@/app/components/emails/TrialWelcomeEmail': TrialWelcomeEmail,
  '@/app/components/emails/TrialWelcomeEmailV2': TrialWelcomeEmailV2,
  '@/app/components/emails/TrialWelcomeEmailV3': TrialWelcomeEmailV3,
  '@/app/components/emails/TrialDay1LessonsEmail': TrialDay1LessonsEmail,
  '@/app/components/emails/TrialDay2ContactsEmail': TrialDay2ContactsEmail,
  '@/app/components/emails/TrialDay3ResumeEmail': TrialDay3ResumeEmail,
  '@/app/components/emails/TrialDay4PortfolioEmail': TrialDay4PortfolioEmail,
  '@/app/components/emails/TrialDay5JobsEmail': TrialDay5JobsEmail,
  '@/app/components/emails/TrialDay6EndsSoonEmail': TrialDay6EndsSoonEmail,
  '@/app/components/emails/TrialDay7EndedEmail': TrialDay7EndedEmail,
  '@/app/components/emails/TrialDay10StillInterestedEmail': TrialDay10StillInterestedEmail,
  '@/app/components/emails/TrialDay14NeedHelpEmail': TrialDay14NeedHelpEmail,
  '@/app/components/emails/TrialDay21DiscountEmail': TrialDay21DiscountEmail,
  '@/app/components/emails/TrialDay28DiscountReminderEmail': TrialDay28DiscountReminderEmail,
  '@/app/components/emails/OTPEmail': OTPEmail,
  '@/app/components/emails/TestSequenceEmail': TestSequenceEmail,
  '@/app/components/emails/OnboardingAbandoned15MinEmail': OnboardingAbandoned15MinEmail,
  '@/app/components/emails/OnboardingAbandoned1DayEmail': OnboardingAbandoned1DayEmail,
  '@/app/components/emails/OnboardingAbandoned7DayEmail': OnboardingAbandoned7DayEmail,
};

// Get service role Supabase client for admin operations
const getSupabaseAdmin = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Template record from database
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string | null;
  text_content: string | null;
  version: number;
  is_active: boolean;
  metadata: {
    component_path?: string; // e.g., "@/app/components/emails/TrialWelcomeEmail"
    component_props?: Record<string, any>; // Props to pass to component
    email_type?: 'transactional' | 'marketing';
    unsubscribe_url_placeholder?: string; // e.g., "{{unsubscribe_url}}"
  };
  created_at: string;
  updated_at: string;
}

/**
 * Template metadata for React Email components
 */
export interface TemplateMetadata {
  component_path: string;
  component_props?: Record<string, any>;
  email_type?: 'transactional' | 'marketing';
  unsubscribe_url_placeholder?: string;
}

/**
 * Get template by ID
 * 
 * @param templateId Template UUID
 * @returns Template record or null if not found
 */
export const getTemplate = async (templateId: string): Promise<EmailTemplate | null> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }

    return data as EmailTemplate | null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }
    throw new Error(`Failed to get template: ${String(error)}`);
  }
};

/**
 * Get active template by name
 * 
 * @param templateName Template name
 * @returns Active template record or null if not found
 */
export const getActiveTemplateByName = async (templateName: string): Promise<EmailTemplate | null> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }

    return data as EmailTemplate | null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }
    throw new Error(`Failed to get template: ${String(error)}`);
  }
};

/**
 * Render template to HTML
 * 
 * Supports two rendering modes:
 * 1. React Email component (stored in metadata.component_path)
 * 2. HTML content (stored in html_content field)
 * 
 * @param template Template record
 * @param variables Dynamic variables to replace (e.g., { firstName: "John", userId: "123" })
 * @param unsubscribeUrl Optional unsubscribe URL to replace placeholder
 * @returns Rendered HTML string
 */
export const renderTemplate = async (
  template: EmailTemplate,
  variables: Record<string, any> = {},
  unsubscribeUrl?: string
): Promise<string> => {
  try {
    // If template uses React Email component
    if (template.metadata?.component_path) {
      // Get component from registry (avoids dynamic import issues)
      const componentPath = template.metadata.component_path;
      const Component = COMPONENT_REGISTRY[componentPath];
      
      if (!Component) {
        throw new Error(
          `Component not found in registry for path: ${componentPath}. ` +
          `Available components: ${Object.keys(COMPONENT_REGISTRY).join(', ')}`
        );
      }

      // Merge template props with variables
      const props = {
        ...(template.metadata.component_props || {}),
        ...variables,
        // Replace unsubscribe URL placeholder if provided
        unsubscribeUrl: unsubscribeUrl || variables.unsubscribeUrl,
      };

      // Render React Email component to HTML
      const html = await render(React.createElement(Component, props));
      
      // Replace any remaining placeholders in the rendered HTML
      return replacePlaceholders(
        html,
        variables,
        unsubscribeUrl,
        template.metadata?.unsubscribe_url_placeholder
      );
    }

    // Fallback to html_content field
    if (template.html_content) {
      let html = template.html_content;
      
      // Replace placeholders
      html = replacePlaceholders(
        html,
        variables,
        unsubscribeUrl,
        template.metadata?.unsubscribe_url_placeholder
      );
      
      return html;
    }

    throw new Error('Template has no component_path or html_content');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to render template: ${error.message}`);
    }
    throw new Error(`Failed to render template: ${String(error)}`);
  }
};

/**
 * Replace placeholders in HTML string
 * 
 * Supports {{variable}} syntax
 * 
 * @param html HTML string with placeholders
 * @param variables Variables to replace
 * @param unsubscribeUrl Optional unsubscribe URL
 * @param unsubscribePlaceholder Optional unsubscribe placeholder pattern
 * @returns HTML with placeholders replaced
 */
const replacePlaceholders = (
  html: string,
  variables: Record<string, any> = {},
  unsubscribeUrl?: string,
  unsubscribePlaceholder?: string
): string => {
  let result = html;

  // Replace unsubscribe URL placeholder
  if (unsubscribeUrl && unsubscribePlaceholder) {
    result = result.replace(
      new RegExp(unsubscribePlaceholder.replace(/[{}]/g, '\\$&'), 'g'),
      unsubscribeUrl
    );
  }

  // Replace standard {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value || ''));
  }

  return result;
};

/**
 * Create new template version
 * 
 * @param templateId Template ID to create version for
 * @param versionData New version data
 * @returns Created template record
 */
export const createTemplateVersion = async (
  templateId: string,
  versionData: {
    subject: string;
    html_content?: string;
    text_content?: string;
    metadata?: TemplateMetadata;
    is_active?: boolean;
  }
): Promise<EmailTemplate> => {
  try {
    const supabase = getSupabaseAdmin();

    // Get current template to determine next version
    const currentTemplate = await getTemplate(templateId);
    if (!currentTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    // If new version should be active, deactivate old versions
    if (versionData.is_active !== false) {
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('name', currentTemplate.name);
    }

    // Create new version
    const newVersion = currentTemplate.version + 1;
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name: currentTemplate.name,
        subject: versionData.subject,
        html_content: versionData.html_content || null,
        text_content: versionData.text_content || null,
        version: newVersion,
        is_active: versionData.is_active !== false,
        metadata: versionData.metadata || currentTemplate.metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template version: ${error.message}`);
    }

    return data as EmailTemplate;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create template version: ${error.message}`);
    }
    throw new Error(`Failed to create template version: ${String(error)}`);
  }
};

/**
 * Activate a specific template version
 * 
 * @param templateId Template ID to activate
 * @returns Updated template record
 */
export const activateTemplateVersion = async (templateId: string): Promise<EmailTemplate> => {
  try {
    const supabase = getSupabaseAdmin();

    // Get template to find its name
    const template = await getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Deactivate all versions of this template
    await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('name', template.name);

    // Activate this version
    const { data, error } = await supabase
      .from('email_templates')
      .update({ is_active: true })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate template version: ${error.message}`);
    }

    return data as EmailTemplate;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to activate template version: ${error.message}`);
    }
    throw new Error(`Failed to activate template version: ${String(error)}`);
  }
};

/**
 * Get all templates
 * 
 * @returns Array of all templates
 */
export const getAllTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }

    return (data || []) as EmailTemplate[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
    throw new Error(`Failed to get templates: ${String(error)}`);
  }
};

