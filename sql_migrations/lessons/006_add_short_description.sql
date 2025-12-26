-- Migration: add_short_description_to_lessons
-- Adds a short_description column to store AI-generated lesson summaries

ALTER TABLE lessons ADD COLUMN short_description TEXT;
