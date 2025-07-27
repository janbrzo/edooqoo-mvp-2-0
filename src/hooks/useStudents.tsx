
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Student = Tables<'students'>;

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
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
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name,
          english_level: englishLevel,
          main_goal: mainGoal,
          teacher_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prevStudents => [data, ...prevStudents]);
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding student:', error);
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

      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === id ? { ...student, ...data } : student
        )
      );

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    refetch: fetchStudents
  };
};
