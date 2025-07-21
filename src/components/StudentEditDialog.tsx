
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';

type Student = Tables<'students'>;

interface StudentEditDialogProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Pick<Student, 'name' | 'english_level' | 'main_goal'>>) => Promise<any>;
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

export const StudentEditDialog: React.FC<StudentEditDialogProps> = ({
  student,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(student.name);
  const [englishLevel, setEnglishLevel] = useState(student.english_level);
  const [mainGoal, setMainGoal] = useState(student.main_goal);
  const [customGoal, setCustomGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if current goal is one of the predefined options
  const isCustomGoal = !mainGoals.some(goal => goal.value === student.main_goal);
  const [showCustomInput, setShowCustomInput] = useState(isCustomGoal);

  React.useEffect(() => {
    if (isCustomGoal) {
      setCustomGoal(student.main_goal);
      setMainGoal('custom');
      setShowCustomInput(true);
    }
  }, [student.main_goal, isCustomGoal]);

  const handleMainGoalChange = (value: string) => {
    setMainGoal(value);
    if (value === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomGoal('');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const finalMainGoal = showCustomInput ? customGoal : mainGoal;
      await onSave(student.id, {
        name,
        english_level: englishLevel,
        main_goal: finalMainGoal
      });
      onClose();
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
    if (isCustomGoal) {
      setMainGoal('custom');
      setCustomGoal(student.main_goal);
      setShowCustomInput(true);
    } else {
      setMainGoal(student.main_goal);
      setCustomGoal('');
      setShowCustomInput(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Select value={mainGoal} onValueChange={handleMainGoalChange}>
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
            
            {showCustomInput && (
              <Input
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Enter custom goal"
                className="mt-2"
              />
            )}
          </div>
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
