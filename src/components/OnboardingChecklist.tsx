
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { Check, ChevronDown, ChevronUp, X, Rocket } from 'lucide-react';
import Confetti from 'react-confetti';

const OnboardingChecklist = () => {
  const { progress, loading, dismissOnboarding, getCompletionPercentage } = useOnboardingProgress();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const steps = [
    {
      key: 'add_student' as const,
      title: 'Add your first student',
      description: 'Create a student profile to personalize worksheets',
      completed: progress.steps.add_student
    },
    {
      key: 'generate_worksheet' as const,
      title: 'Generate your first worksheet',
      description: 'Create a customized lesson for your student',
      completed: progress.steps.generate_worksheet
    },
    {
      key: 'share_worksheet' as const,
      title: 'Share the worksheet',
      description: 'Download or share your worksheet with students',
      completed: progress.steps.share_worksheet
    }
  ];

  const completionPercentage = getCompletionPercentage();

  // Show confetti when completed (but not dismissed)
  useEffect(() => {
    if (progress.completed && !progress.dismissed && !hasShownConfetti) {
      setShowConfetti(true);
      setHasShownConfetti(true);
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [progress.completed, progress.dismissed, hasShownConfetti]);

  // Don't show if dismissed or loading
  if (loading || progress.dismissed) {
    return null;
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      <div className="fixed bottom-6 right-6 z-50 w-80 animate-fade-in">
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="h-5 w-5 text-primary" />
                Get started with Edooqoo🚀
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0"
                >
                  {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissOnboarding}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!isCollapsed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <Badge variant="secondary">{completionPercentage}%</Badge>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            )}
          </CardHeader>

          {!isCollapsed && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted border-2 border-muted-foreground/20'
                    }`}>
                      {step.completed ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {progress.completed && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Congratulations! You're all set up! 🎉
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={dismissOnboarding}
                  className="w-full text-xs"
                >
                  Dismiss checklist
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
};

export default OnboardingChecklist;
