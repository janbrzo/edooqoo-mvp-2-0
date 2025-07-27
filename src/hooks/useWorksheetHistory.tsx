
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorksheetHistoryItem {
  id: string;
  title: string;
  created_at: string;
  form_data: any;
  ai_response: string;
  html_content: string;
  student_id?: string;
  generation_time_seconds?: number;
  student_name?: string;
  topic?: string;
  learning_goal?: string;
}

export const useWorksheetHistory = (studentId?: string) => {
  const [worksheets, setWorksheets] = useState<WorksheetHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorksheets();
  }, [studentId]);

  const fetchWorksheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('worksheets')
        .select(`
          id, 
          title, 
          created_at, 
          form_data, 
          ai_response, 
          html_content, 
          student_id, 
          generation_time_seconds,
          students(name)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const processedData = (data || []).map(worksheet => {
        // Type guard to check if form_data is an object
        const formData = worksheet.form_data && typeof worksheet.form_data === 'object' && !Array.isArray(worksheet.form_data) 
          ? worksheet.form_data as Record<string, any>
          : {};

        return {
          ...worksheet,
          student_name: worksheet.students?.name || null,
          topic: formData.lessonTopic || formData.lesson_topic || null,
          learning_goal: formData.lessonGoal || formData.lesson_goal || null
        };
      });

      setWorksheets(processedData);
    } catch (error: any) {
      console.error('Error fetching worksheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentWorksheets = (limit: number = 3) => {
    return worksheets.slice(0, limit);
  };

  return {
    worksheets,
    loading,
    getRecentWorksheets,
    refetch: fetchWorksheets
  };
};
