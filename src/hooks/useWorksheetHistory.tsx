
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
        .is('deleted_at', null) // Filter out soft-deleted worksheets
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

  const deleteWorksheet = async (worksheetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use direct SQL UPDATE to set deleted_at timestamp
      const { error } = await supabase.rpc('soft_delete_worksheet', {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id
      });

      if (error) throw error;
      
      // Refresh the worksheets list
      await fetchWorksheets();
      return true;
    } catch (error: any) {
      console.error('Error deleting worksheet:', error);
      throw error;
    }
  };

  const getRecentWorksheets = (limit: number = 3) => {
    return worksheets.slice(0, limit);
  };

  return {
    worksheets,
    loading,
    getRecentWorksheets,
    deleteWorksheet,
    refetch: fetchWorksheets
  };
};
