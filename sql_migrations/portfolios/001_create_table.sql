-- Portfolios table - Main portfolio settings
-- Each user can have one portfolio

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Custom URL slug (e.g., "anthonysaltarelli" for productcareerlyst.com/p/anthonysaltarelli)
  slug TEXT NOT NULL UNIQUE,
  
  -- Profile information
  display_name TEXT NOT NULL,
  subtitle TEXT, -- e.g., "Senior Product Manager at Google"
  bio TEXT, -- About section / longer description
  profile_image_url TEXT,
  
  -- Social links stored as JSONB for flexibility
  -- { linkedin: "url", twitter: "url", github: "url", website: "url", email: "email" }
  social_links JSONB DEFAULT '{}',
  
  -- Settings
  is_published BOOLEAN DEFAULT false,
  
  -- Resume settings (optional)
  show_resume_download BOOLEAN DEFAULT false,
  resume_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only have one portfolio
  CONSTRAINT unique_user_portfolio UNIQUE (user_id)
);

-- Add comment for documentation
COMMENT ON TABLE portfolios IS 'User portfolios with profile information and settings';
COMMENT ON COLUMN portfolios.slug IS 'Unique URL slug for public portfolio access (e.g., /p/username)';
COMMENT ON COLUMN portfolios.social_links IS 'JSON object containing social media links';


