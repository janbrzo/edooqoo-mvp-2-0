
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

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
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

      setStudents(prev => [data, ...prev]);
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

  const updateStudentActivity = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (error) throw error;
      
      // Refresh students list to reflect new order
      fetchStudents();
    } catch (error: any) {
      console.error('Error updating student activity:', error);
    }
  };

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    updateStudentActivity,
    refetch: fetchStudents
  };
};
