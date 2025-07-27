
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { AddStudentDialog } from './AddStudentDialog';
import { useStudents } from '@/hooks/useStudents';

export const AddStudentButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addStudent } = useStudents();

  const handleAddStudent = async (studentData: { name: string; english_level: string; main_goal: string }) => {
    try {
      await addStudent(studentData);
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-worksheet-purple hover:bg-worksheet-purpleDark text-white"
      >
        <UserPlus className="h-4 w-4" />
        Add Student
      </Button>

      <AddStudentDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddStudent={handleAddStudent}
      />
    </>
  );
};
