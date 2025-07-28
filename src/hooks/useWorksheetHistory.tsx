
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
        .select('id, title, created_at, form_data, ai_response, html_content, student_id, generation_time_seconds')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorksheets(data || []);
    } catch (error: any) {
      console.error('Error fetching worksheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentWorksheets = (limit: number = 3) => {
    return worksheets.slice(0, limit);
  };

  const updateStudentActivity = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (error) throw error;
      
      // Emit a custom event to notify other components about the student update
      window.dispatchEvent(new CustomEvent('studentUpdated', { detail: { studentId } }));
    } catch (error: any) {
      console.error('Error updating student activity:', error);
    }
  };

  return {
    worksheets,
    loading,
    getRecentWorksheets,
    updateStudentActivity,
    refetch: fetchWorksheets
  };
};
