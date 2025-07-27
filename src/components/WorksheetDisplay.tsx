
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WorksheetHeader } from '@/components/worksheet/WorksheetHeader';
import { ExerciseSection } from '@/components/worksheet/ExerciseSection';
import TeacherNotes from '@/components/worksheet/TeacherNotes';
import WorksheetToolbar from '@/components/worksheet/WorksheetToolbar';
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

  // Parse the AI response to get exercises and other data
  let parsedData: any = {};
  try {
    parsedData = JSON.parse(worksheet.ai_response);
  } catch (error) {
    console.error("Error parsing AI response:", error);
  }

  const { form_data, created_at, generation_time_seconds, student_id } = worksheet;
  const exercises = parsedData.exercises || [];
  const teacher_notes = parsedData.teacher_notes || '';
  const student_name = parsedData.student_name || '';

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <DemoWatermark />
      <Link to="/" className="inline-block mb-4">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <WorksheetHeader
        formData={form_data}
        createdAt={created_at}
        generationTime={generation_time_seconds}
        studentId={student_id}
        studentName={student_name}
      />

      {exercises &&
        exercises.map((exercise: any, index: number) => (
          <ExerciseSection
            key={index}
            exercise={exercise}
            exerciseIndex={index}
            viewMode={viewMode}
          />
        ))}

      {teacher_notes && (
        <TeacherNotes
          viewMode={viewMode}
        />
      )}

      <WorksheetToolbar
        worksheetId={id}
        viewMode={viewMode}
        setViewMode={() => {}}
        isEditing={false}
        handleEdit={() => {}}
        handleSave={() => {}}
        editableWorksheet={parsedData}
      />
    </div>
  );
};
