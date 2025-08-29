
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWorksheetStats = () => {
  const [stats, setStats] = useState({
    thisMonthCount: 0,
    totalCount: 0,
    totalFromProfile: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all worksheets (including deleted ones) for accurate statistics
      const { data: allWorksheets, error: worksheetsError } = await supabase
        .from('worksheets')
        .select('created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (worksheetsError) throw worksheetsError;

      // Get profile data for total count from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_worksheets_created')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Calculate this month's count from all worksheets (including deleted)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthWorksheets = allWorksheets?.filter(w => {
        const createdAt = new Date(w.created_at);
        return createdAt >= startOfMonth;
      }) || [];

      setStats({
        thisMonthCount: thisMonthWorksheets.length,
        totalCount: allWorksheets?.length || 0,
        totalFromProfile: profile?.total_worksheets_created || 0
      });
    } catch (error: any) {
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
