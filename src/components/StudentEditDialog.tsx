
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3 } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { Tables } from '@/integrations/supabase/types';

type Student = Tables<'students'>;

interface StudentEditDialogProps {
  student: Student;
  onUpdate: () => void;
}

export const StudentEditDialog: React.FC<StudentEditDialogProps> = ({ student, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [englishLevel, setEnglishLevel] = useState(student.english_level);
  const [mainGoal, setMainGoal] = useState(student.main_goal);
  const [isLoading, setIsLoading] = useState(false);
  const { updateStudent } = useStudents();

  const englishLevels = [
    'A1 - Beginner',
    'A2 - Elementary',
    'B1 - Intermediate',
    'B2 - Upper-Intermediate',
    'C1 - Advanced',
    'C2 - Proficient'
  ];

  const goals = [
    { value: 'work', label: 'Work/Business' },
    { value: 'exam', label: 'Exam Preparation' },
    { value: 'general', label: 'General English' },
    { value: 'travel', label: 'Travel' },
    { value: 'academic', label: 'Academic' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await updateStudent(student.id, {
        name: name.trim(),
        english_level: englishLevel,
        main_goal: mainGoal
      });
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information and learning preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level">English Level</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select English level" />
              </SelectTrigger>
              <SelectContent>
                {englishLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal">Main Goal</Label>
            <Select value={mainGoal} onValueChange={setMainGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Select main goal" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
