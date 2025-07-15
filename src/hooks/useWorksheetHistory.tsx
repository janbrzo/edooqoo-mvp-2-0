import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Worksheet = Tables<'worksheets'>;

export const useWorksheetHistory = (userId?: string | null, studentId?: string | null) => {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorksheets = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('worksheets')
        .select('*')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false });

      // If studentId is provided, filter by that student
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setWorksheets(data || []);
    } catch (err) {
      console.error('Error fetching worksheets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStudentWorksheets = async (studentId: string, limit?: number) => {
    if (!userId) return [];
    
    try {
      let query = supabase
        .from('worksheets')
        .select('*')
        .eq('teacher_id', userId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching student worksheets:', err);
      return [];
    }
  };

  const refreshWorksheets = () => {
    fetchWorksheets();
  };

  useEffect(() => {
    fetchWorksheets();
  }, [userId, studentId]);

  return {
    worksheets,
    loading,
    error,
    refreshWorksheets,
    getStudentWorksheets
  };
};