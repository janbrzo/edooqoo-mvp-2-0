import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorksheetHeader } from '@/components/worksheet/WorksheetHeader';
import { ExerciseSection } from '@/components/worksheet/ExerciseSection';
import { TeacherNotes } from '@/components/worksheet/TeacherNotes';
import { WorksheetToolbar } from '@/components/worksheet/WorksheetToolbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import DemoWatermark from '@/components/worksheet/DemoWatermark';

interface WorksheetData extends Tables<'worksheets'> {}

interface WorksheetDisplayProps {
  viewMode: "student" | "teacher";
}

export const WorksheetDisplay: React.FC<WorksheetDisplayProps> = ({ viewMode }) => {
  const { id } = useParams<{ id: string }>();
  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!id) {
        console.error("No worksheet ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('worksheets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching worksheet:", error);
        }

        setWorksheet(data);
        setIsDemo(data?.is_demo || false);
      } catch (error) {
        console.error("Error fetching worksheet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorksheet();
  }, [id]);

  if (loading) {
    return <div className="text-center">Loading worksheet...</div>;
  }

  if (!worksheet) {
    return <div className="text-center">Worksheet not found.</div>;
  }

  const { form_data, exercises, teacher_notes, created_at, generation_time, student_id, student_name } = worksheet;

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {isDemo && <DemoWatermark />}
      <Link to="/" className="inline-block mb-4">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <WorksheetHeader
        formData={form_data}
        createdAt={created_at}
        generationTime={generation_time}
        studentId={student_id}
        studentName={student_name}
      />

      {exercises &&
        exercises.map((exercise, index) => (
          <ExerciseSection
            key={index}
            exercise={exercise}
            exerciseIndex={index}
            viewMode={viewMode}
          />
        ))}

      {teacher_notes && (
        <TeacherNotes
          notes={teacher_notes}
          viewMode={viewMode}
        />
      )}

      <WorksheetToolbar
        worksheetId={id}
        formData={form_data}
        exercises={exercises}
        teacherNotes={teacher_notes}
        viewMode={viewMode}
      />
    </div>
  );
};
