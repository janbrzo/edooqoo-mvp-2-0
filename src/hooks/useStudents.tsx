
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

type Student = Tables<'students'>;

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    try {
      console.log('📚 Fetching students...');
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
        .order('updated_at', { ascending: false });

      if (error) throw error;

      console.log('📚 Students fetched:', data?.length, 'students');
      console.log('📚 Students order:', data?.map(s => ({ name: s.name, updated_at: s.updated_at })));
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
  }, []);

  const addStudent = async (name: string, englishLevel: string, mainGoal: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user email from user object
      const userEmail = user.email;

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name,
          english_level: englishLevel,
          main_goal: mainGoal,
          teacher_id: user.id,
          teacher_email: userEmail // Add teacher email
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user email and include it in updates if needed
      const userEmail = user.email;
      const updatesWithEmail = {
        ...updates,
        teacher_email: userEmail // Ensure teacher_email is always up to date
      };

      const { data, error } = await supabase
        .from('students')
        .update(updatesWithEmail)
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

  const updateStudentActivity = useCallback(async (studentId: string) => {
    try {
      console.log('🔄 UPDATING STUDENT ACTIVITY for:', studentId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userEmail = user.email;
      
      const { data, error } = await supabase
        .from('students')
        .update({ 
          updated_at: new Date().toISOString(),
          teacher_email: userEmail // Ensure teacher_email is always up to date
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Student activity updated successfully:', data);
      
      // Wait a bit to ensure database is updated, then refetch
      setTimeout(async () => {
        console.log('🔄 Refetching students to update order...');
        await fetchStudents();
        console.log('✅ Students refetched after activity update');
      }, 1000);
      
      return data;
    } catch (error: any) {
      console.error('❌ Error updating student activity:', error);
      throw error;
    }
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents();
    
    // Listen for student updates from worksheet generation
    const handleStudentUpdate = async (event: CustomEvent) => {
      console.log('🎯 RECEIVED studentUpdated event:', event.detail);
      const { studentId } = event.detail;
      
      if (studentId) {
        console.log('🎯 Processing student update for:', studentId);
        await updateStudentActivity(studentId);
      }
    };
    
    window.addEventListener('studentUpdated', handleStudentUpdate as EventListener);
    
    return () => {
      window.removeEventListener('studentUpdated', handleStudentUpdate as EventListener);
    };
  }, [fetchStudents, updateStudentActivity]);

  return {
    students,
    loading,
    addStudent,
    updateStudent,
    updateStudentActivity,
    refetch: fetchStudents
  };
};
