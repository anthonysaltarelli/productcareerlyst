-- Migration: Create enum types for job applications
-- Description: Defines all enum types used across job application tables
-- Created: 2025-11-15
-- Note: Run this after 001_create_updated_at_function.sql

-- Application status enum
CREATE TYPE application_status AS ENUM (
  'wishlist',
  'applied',
  'screening',
  'interviewing',
  'offer',
  'rejected',
  'accepted',
  'withdrawn'
);

-- Priority level enum
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high'
);

-- Work mode enum
CREATE TYPE work_mode AS ENUM (
  'remote',
  'hybrid',
  'onsite'
);

-- Interview type enum
CREATE TYPE interview_type AS ENUM (
  'recruiter_screen',
  'phone_screen',
  'technical',
  'behavioral',
  'system_design',
  'onsite',
  'final',
  'other'
);

-- Interview status enum
CREATE TYPE interview_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled'
);

-- Interview outcome enum
CREATE TYPE interview_outcome AS ENUM (
  'passed',
  'failed',
  'pending'
);

-- Contact relationship enum
CREATE TYPE contact_relationship AS ENUM (
  'recruiter',
  'hiring_manager',
  'team_member',
  'referral',
  'peer',
  'executive',
  'other'
);

-- Interaction type enum
CREATE TYPE interaction_type AS ENUM (
  'email',
  'linkedin',
  'phone',
  'coffee',
  'video_call',
  'other'
);

-- Interviewer role enum
CREATE TYPE interviewer_role AS ENUM (
  'interviewer',
  'panel_member',
  'observer'
);

-- Company industry enum
CREATE TYPE company_industry AS ENUM (
  'technology',
  'finance',
  'healthcare',
  'retail',
  'consulting',
  'education',
  'manufacturing',
  'media',
  'other'
);

-- Company size enum
CREATE TYPE company_size AS ENUM (
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+'
);

-- Currency code enum
CREATE TYPE currency_code AS ENUM (
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'INR'
);

-- Add comments
COMMENT ON TYPE application_status IS 'Status of a job application';
COMMENT ON TYPE priority_level IS 'Priority level for tasks and applications';
COMMENT ON TYPE work_mode IS 'Work location mode';
COMMENT ON TYPE interview_type IS 'Type of interview round';
COMMENT ON TYPE interview_status IS 'Status of an interview';
COMMENT ON TYPE interview_outcome IS 'Outcome of an interview';
COMMENT ON TYPE contact_relationship IS 'Relationship with a contact';
COMMENT ON TYPE interaction_type IS 'Type of interaction with a contact';
COMMENT ON TYPE interviewer_role IS 'Role of interviewer in an interview';
COMMENT ON TYPE company_industry IS 'Industry sector of a company';
COMMENT ON TYPE company_size IS 'Size range of a company';
COMMENT ON TYPE currency_code IS 'Currency code for salary information';

