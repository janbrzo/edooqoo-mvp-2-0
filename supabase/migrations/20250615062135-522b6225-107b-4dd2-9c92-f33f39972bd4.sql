
-- Reverting feedbacks table to be compatible with the older codebase

-- Step 1: Drop the foreign key constraint from feedbacks to worksheets.
-- This was causing "violates foreign key constraint" errors.
ALTER TABLE public.feedbacks DROP CONSTRAINT IF EXISTS feedbacks_worksheet_id_fkey;

-- Step 2: Drop the 'status' column from the feedbacks table.
-- This column was added in a newer version and is not present in the reverted code.
ALTER TABLE public.feedbacks DROP COLUMN IF EXISTS status;

-- Step 3: Disable Row Level Security on the feedbacks table.
-- This ensures the older code can access the data without policy restrictions.
ALTER TABLE public.feedbacks DISABLE ROW LEVEL SECURITY;
