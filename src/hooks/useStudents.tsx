
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useAuthFlow } from '@/hooks/useAuthFlow';

type Student = Tables<'students'>;

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthFlow();
  const { toast } = useToast();

  const fetchStudents = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false }); // Sort by updated_at descending

      if (error) throw error;
      
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user?.id]);

  const addStudent = async (studentData: Omit<Student, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...studentData,
          teacher_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]); // Add to beginning since it's newest
      toast({
        title: "Success",
        description: "Student added successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(student => 
        student.id === studentId ? data : student
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())); // Re-sort after update
      
      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== studentId));
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student",
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
