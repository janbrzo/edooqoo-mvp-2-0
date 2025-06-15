
-- Re-adding the foreign key constraint to ensure data integrity
-- This ensures that every feedback record is linked to an existing worksheet.
ALTER TABLE public.feedbacks
ADD CONSTRAINT feedbacks_worksheet_id_fkey
FOREIGN KEY (worksheet_id) REFERENCES public.worksheets(id)
ON DELETE CASCADE;
