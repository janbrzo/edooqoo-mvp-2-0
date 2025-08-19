
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  const deleteWorksheet = async (worksheetId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the existing soft_delete_worksheet SQL function
      const { data, error } = await supabase.rpc('soft_delete_worksheet', {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id
      });

      if (error) throw error;

      if (data) {
        // Remove from local state
        setWorksheets(prev => prev.filter(w => w.id !== worksheetId));
        
        toast({
          title: "Worksheet deleted",
          description: "The worksheet has been successfully removed from your list."
        });
        
        return true;
      } else {
        throw new Error('Worksheet not found or access denied');
      }
    } catch (error: any) {
      console.error('Error deleting worksheet:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the worksheet. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const getRecentWorksheets = (limit: number = 3) => {
    return worksheets.slice(0, limit);
  };

  return {
    worksheets,
    loading,
    getRecentWorksheets,
    refetch: fetchWorksheets,
    deleteWorksheet
  };
};
