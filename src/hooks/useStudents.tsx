import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Student = Tables<'students'>;

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get students with their latest worksheet activity
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id);

      if (studentsError) throw studentsError;

      if (studentsData) {
        // For each student, get their latest worksheet
        const studentsWithActivity = await Promise.all(
          studentsData.map(async (student) => {
            const { data: worksheetData } = await supabase
              .from('worksheets')
              .select('created_at')
              .eq('student_id', student.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const latestWorksheetDate = worksheetData?.[0]?.created_at;
            const lastActivity = latestWorksheetDate ? 
              new Date(latestWorksheetDate) : 
              new Date(student.created_at);

            return {
              ...student,
              lastActivity
            };
          })
        );

        // Sort by last activity (most recent first)
        const sortedStudents = studentsWithActivity.sort((a, b) => 
          b.lastActivity.getTime() - a.lastActivity.getTime()
        );

        setStudents(sortedStudents);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (name: string, englishLevel: string, mainGoal: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('students')
        .insert({
          name,
          english_level: englishLevel,
          main_goal: mainGoal,
          teacher_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh the list to maintain proper sorting
      await fetchStudents();
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Pick<Student, 'name' | 'english_level' | 'main_goal'>>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents
  };
};
