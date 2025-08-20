
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudents } from '@/hooks/useStudents';
import { Edit } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Student = Tables<'students'>;

interface StudentEditDialogProps {
  student: Student;
}

const englishLevels = [
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficiency' }
];

const mainGoals = [
  { value: 'work', label: 'Work/Business' },
  { value: 'exam', label: 'Exam Preparation' },
  { value: 'general', label: 'General English' },
  { value: 'travel', label: 'Travel' },
  { value: 'academic', label: 'Academic' },
  { value: 'custom', label: 'Custom' }
];

export const StudentEditDialog: React.FC<StudentEditDialogProps> = ({ student }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [englishLevel, setEnglishLevel] = useState(student.english_level);
  const [mainGoal, setMainGoal] = useState(student.main_goal);
  const [customGoal, setCustomGoal] = useState(
    mainGoals.find(goal => goal.value === student.main_goal) ? '' : student.main_goal
  );
  const [isLoading, setIsLoading] = useState(false);
  const { updateStudent } = useStudents();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const goalToSave = mainGoal === 'custom' ? customGoal : mainGoal;
      await updateStudent(student.id, {
        name,
        english_level: englishLevel,
        main_goal: goalToSave
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form to original values
    setName(student.name);
    setEnglishLevel(student.english_level);
    setMainGoal(student.main_goal);
    setCustomGoal(mainGoals.find(goal => goal.value === student.main_goal) ? '' : student.main_goal);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student Details</DialogTitle>
          <DialogDescription>
            Update the student's information below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="english-level">English Level</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select English level" />
              </SelectTrigger>
              <SelectContent>
                {englishLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="main-goal">Main Goal</Label>
            <Select value={mainGoal} onValueChange={setMainGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Select main goal" />
              </SelectTrigger>
              <SelectContent>
                {mainGoals.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mainGoal === 'custom' && (
            <div className="grid gap-2">
              <Label htmlFor="custom-goal">Custom Goal</Label>
              <Input
                id="custom-goal"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Enter custom goal"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
