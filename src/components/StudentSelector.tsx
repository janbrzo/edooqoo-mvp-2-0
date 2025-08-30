
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserSwitch2, Check } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StudentSelectorProps {
  worksheetId: string;
  currentStudentId?: string;
  onStudentChange?: (studentId: string | null, studentName: string) => void;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default';
}

export const StudentSelector = ({ 
  worksheetId, 
  currentStudentId, 
  onStudentChange, 
  variant = 'icon',
  size = 'default' 
}: StudentSelectorProps) => {
  const { students } = useStudents();
  const [isOpen, setIsOpen] = React.useState(false);

  const updateWorksheetStudent = async (newStudentId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('worksheets')
        .update({ student_id: newStudentId })
        .eq('id', worksheetId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      const studentName = newStudentId 
        ? students.find(s => s.id === newStudentId)?.name || 'Unknown Student'
        : '';

      toast({
        title: "Success",
        description: newStudentId 
          ? `Worksheet assigned to ${studentName}`
          : "Worksheet unassigned from student"
      });

      if (onStudentChange) {
        onStudentChange(newStudentId, studentName);
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error('Error updating worksheet student:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const currentStudent = students.find(s => s.id === currentStudentId);

  if (variant === 'button') {
    return (
      <Select open={isOpen} onOpenChange={setIsOpen} onValueChange={updateWorksheetStudent}>
        <SelectTrigger className={`w-fit ${size === 'sm' ? 'h-8 text-xs' : ''}`}>
          <div className="flex items-center gap-2">
            <UserSwitch2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <span>{currentStudent?.name || 'Unassigned'}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <div className="flex items-center gap-2">
              <span>Unassigned</span>
              {!currentStudentId && <Check className="h-3 w-3" />}
            </div>
          </SelectItem>
          {students.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              <div className="flex items-center gap-2">
                <span>{student.name}</span>
                {currentStudentId === student.id && <Check className="h-3 w-3" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select open={isOpen} onOpenChange={setIsOpen} onValueChange={updateWorksheetStudent}>
      <SelectTrigger asChild>
        <Button 
          variant="ghost" 
          size={size === 'sm' ? 'sm' : 'default'}
          className={`${size === 'sm' ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'} hover:bg-muted`}
        >
          <UserSwitch2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </Button>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <div className="flex items-center gap-2">
            <span>Unassigned</span>
            {!currentStudentId && <Check className="h-3 w-3" />}
          </div>
        </SelectItem>
        {students.map((student) => (
          <SelectItem key={student.id} value={student.id}>
            <div className="flex items-center gap-2">
              <span>{student.name}</span>
              {currentStudentId === student.id && <Check className="h-3 w-3" />}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
