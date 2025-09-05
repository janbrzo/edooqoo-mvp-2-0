
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudents } from '@/hooks/useStudents';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { Plus } from 'lucide-react';

const ENGLISH_LEVELS = [
  { value: 'A1', label: 'A1 (Beginner)' },
  { value: 'A2', label: 'A2 (Elementary)' },
  { value: 'B1', label: 'B1 (Intermediate)' },
  { value: 'B2', label: 'B2 (Upper-Intermediate)' },
  { value: 'C1', label: 'C1 (Advanced)' },
  { value: 'C2', label: 'C2 (Proficiency)' }
];

const MAIN_GOALS = [
  { value: 'business-communication', label: 'Business Communication & Presentations' },
  { value: 'academic-writing', label: 'Academic Writing & Research' },
  { value: 'conversation-speaking', label: 'Conversation & Speaking Fluency' },
  { value: 'exam-preparation', label: 'Exam Preparation (IELTS/TOEFL/Cambridge)' },
  { value: 'grammar-structure', label: 'Grammar & Language Structure' },
  { value: 'vocabulary-building', label: 'Vocabulary Building & Usage' },
  { value: 'reading-comprehension', label: 'Reading Comprehension & Analysis' },
  { value: 'listening-skills', label: 'Listening Skills & Understanding' },
  { value: 'travel-practical', label: 'Travel & Practical English' },
  { value: 'custom', label: 'Custom Goal (enter below)' }
];

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
}

export const AddStudentDialog = ({ onStudentAdded }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { addStudent, refetch } = useStudents();
  const { refreshProgress } = useOnboardingProgress();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalGoal = mainGoal === 'custom' ? customGoal : mainGoal;
    if (!name || !englishLevel || !finalGoal) return;

    setLoading(true);
    try {
      await addStudent(name, englishLevel, finalGoal);
      // Reset form and close dialog
      setName('');
      setEnglishLevel('');
      setMainGoal('');
      setCustomGoal('');
      setOpen(false);
      
      // ULTRA-ENHANCED: Multiple aggressive refresh attempts for immediate onboarding update
      console.log('[AddStudentDialog] Force refreshing students hook and onboarding - ULTRA MODE');
      
      // Immediate refresh
      refreshProgress();
      
      // Force refresh students hook to update local state immediately
      setTimeout(async () => {
        try {
          await refetch();  // Force refresh students
          console.log('[AddStudentDialog] Students refreshed, now triggering multiple onboarding refreshes');
          
          // Multiple refresh attempts at different intervals for maximum responsiveness
          refreshProgress();                              // Immediate
          setTimeout(refreshProgress, 200);              // 200ms
          setTimeout(refreshProgress, 500);              // 500ms  
          setTimeout(refreshProgress, 1000);             // 1s
          setTimeout(refreshProgress, 2000);             // 2s
          
        } catch (error) {
          console.error('[AddStudentDialog] Error refreshing students:', error);
          // Still try onboarding refresh even if students refresh fails
          refreshProgress();
          setTimeout(refreshProgress, 500);
          setTimeout(refreshProgress, 1500);
        }
      }, 50);  // Almost immediate, just enough to avoid race conditions
      
      // Notify parent component that student was added
      if (onStudentAdded) {
        console.log('🔄 Calling onStudentAdded callback...');
        onStudentAdded();
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hidden">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Add a new student to your class. You can update their information later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student's name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">English Level (CEFR)</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel} required>
              <SelectTrigger>
                <SelectValue placeholder="Select English level" />
              </SelectTrigger>
              <SelectContent>
                {ENGLISH_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Main Goal</Label>
            <Select value={mainGoal} onValueChange={setMainGoal} required>
              <SelectTrigger>
                <SelectValue placeholder="Select main learning goal" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_GOALS.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mainGoal === 'custom' && (
              <Input
                placeholder="Enter custom learning goal"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                required={mainGoal === 'custom'}
              />
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !englishLevel || !mainGoal || (mainGoal === 'custom' && !customGoal)}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
