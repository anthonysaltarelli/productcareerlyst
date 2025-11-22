-- Migration: Allow multiple batches of ideas per request
-- Description: Remove constraints that limit ideas to 3 per request, allowing users to generate more ideas for the same request
-- Created: 2025-01-XX

-- Drop constraints dynamically since PostgreSQL auto-generates names
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Find and drop the CHECK constraint that limits idea_number to 1-3
    FOR constraint_rec IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'portfolio_ideas'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%idea_number%>= 1%<= 3%'
    LOOP
        EXECUTE 'ALTER TABLE portfolio_ideas DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
    END LOOP;
    
    -- Find and drop the UNIQUE constraint on (request_id, idea_number)
    FOR constraint_rec IN
        SELECT conname
        FROM pg_constraint c
        WHERE c.conrelid = 'portfolio_ideas'::regclass
          AND c.contype = 'u'
          AND array_length(c.conkey, 1) = 2
          AND EXISTS (
            SELECT 1
            FROM pg_attribute a1, pg_attribute a2
            WHERE a1.attrelid = c.conrelid
              AND a2.attrelid = c.conrelid
              AND a1.attnum = c.conkey[1]
              AND a2.attnum = c.conkey[2]
              AND a1.attname = 'request_id'
              AND a2.attname = 'idea_number'
          )
    LOOP
        EXECUTE 'ALTER TABLE portfolio_ideas DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
    END LOOP;
END $$;

-- Update the comment to reflect that idea_number is now sequential
COMMENT ON COLUMN portfolio_ideas.idea_number IS 'Sequential number for this idea within the request (1, 2, 3, 4, 5, etc.)';

