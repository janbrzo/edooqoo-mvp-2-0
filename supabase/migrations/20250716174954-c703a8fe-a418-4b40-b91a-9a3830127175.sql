
-- Add missing columns to worksheets table for proper teacher and student tracking
ALTER TABLE public.worksheets 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id);

-- Add RLS policies for worksheets table
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;

-- Allow teachers to view their own worksheets
CREATE POLICY "Teachers can view their own worksheets" 
  ON public.worksheets 
  FOR SELECT 
  USING (auth.uid() = teacher_id);

-- Allow anyone to insert worksheets (for edge functions)
CREATE POLICY "Allow insert worksheets" 
  ON public.worksheets 
  FOR INSERT 
  WITH CHECK (true);

-- Allow teachers to update their own worksheets
CREATE POLICY "Teachers can update their own worksheets" 
  ON public.worksheets 
  FOR UPDATE 
  USING (auth.uid() = teacher_id);

-- Allow teachers to delete their own worksheets
CREATE POLICY "Teachers can delete their own worksheets" 
  ON public.worksheets 
  FOR DELETE 
  USING (auth.uid() = teacher_id);
