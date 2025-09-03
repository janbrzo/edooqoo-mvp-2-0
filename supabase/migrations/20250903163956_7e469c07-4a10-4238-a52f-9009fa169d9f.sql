-- Enable realtime for onboarding checklist updates
ALTER TABLE public.worksheets REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.worksheets;
ALTER publication supabase_realtime ADD TABLE public.students;