
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorksheetStats {
  thisMonthCount: number;
  totalCount: number;
}

export const useWorksheetStats = () => {
  const [stats, setStats] = useState<WorksheetStats>({ thisMonthCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count worksheets for this month (including deleted ones)
      const { count: thisMonthCount } = await supabase
        .from('worksheets')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get total count from profile (this is already correct)
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_worksheets_created')
        .eq('id', user.id)
        .single();

      setStats({
        thisMonthCount: thisMonthCount || 0,
        totalCount: profile?.total_worksheets_created || 0
      });
    } catch (error) {
      console.error('Error fetching worksheet stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};
