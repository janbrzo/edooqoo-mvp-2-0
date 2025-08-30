
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { ChevronUp, ChevronDown, X, Check, User, FileText, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

const OnboardingChecklist: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionAnimation, setCompletionAnimation] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  const { progress, loading, dismissOnboarding, getCompletionPercentage, shouldShow } = useOnboardingProgress();
  const navigate = useNavigate();

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show confetti and completion animation when completed
  useEffect(() => {
    if (progress.completed && !progress.dismissed && !completionAnimation) {
      setShowConfetti(true);
      setCompletionAnimation(true);
      setIsExpanded(true);
      
      // Start fade-out after 4 seconds
      const fadeTimer = setTimeout(() => {
        setCompletionAnimation(false);
      }, 4000);

      // Auto-dismiss after 5 seconds total
      const dismissTimer = setTimeout(() => {
        setShowConfetti(false);
        dismissOnboarding();
      }, 5000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [progress.completed, progress.dismissed, completionAnimation, dismissOnboarding]);

  if (loading || !shouldShow()) {
    return null;
  }

  const completionPercentage = getCompletionPercentage();

  const steps = [
    {
      key: 'add_student',
      label: 'Add your first student',
      icon: User,
      completed: progress.steps.add_student,
      action: () => navigate('/dashboard')
    },
    {
      key: 'generate_worksheet',
      label: 'Generate your first worksheet',
      icon: FileText,
      completed: progress.steps.generate_worksheet,
      action: () => navigate('/')
    },
    {
      key: 'share_worksheet',
      label: 'Share the worksheet',
      icon: Share2,
      completed: progress.steps.share_worksheet,
      action: () => navigate('/dashboard')
    }
  ];

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      <div className={`fixed bottom-6 right-6 z-50 w-80 transition-opacity duration-1000 ${
        completionAnimation === false && progress.completed ? 'animate-fade-out opacity-0' : 'animate-fade-in opacity-100'
      }`}>
        <Card className="shadow-lg border-2 border-primary/20 bg-white/95 backdrop-blur-sm">
          {/* Minimized Header */}
          <CardHeader 
            className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <CardTitle className="text-sm whitespace-nowrap truncate">Get started 🚀</CardTitle>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {completionPercentage}%
                </Badge>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissOnboarding();
                  }}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </CardHeader>

          {/* Expanded Content */}
          {isExpanded && (
            <CardContent className="pt-0 animate-accordion-down">
              <div className="space-y-3">
                {progress.completed && (
                  <div className={`text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200 transition-all duration-500 ${
                    completionAnimation ? 'animate-scale-in' : ''
                  }`}>
                    <div className="text-green-700 font-bold mb-2 text-lg">
                      🎉 Congratulations! You're all set up!
                    </div>
                    <div className="text-sm text-green-600">
                      You've completed all the onboarding steps. Happy teaching with Edooqoo!
                    </div>
                  </div>
                )}

                {steps.map((step) => {
                  const IconComponent = step.icon;
                  return (
                    <div
                      key={step.key}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        step.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-muted/20 border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          step.completed ? 'bg-green-100' : 'bg-muted'
                        }`}>
                          {step.completed ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          step.completed ? 'text-green-700 line-through' : 'text-foreground'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      
                      {!step.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={step.action}
                          className="h-8 text-xs"
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  );
                })}

                {!progress.completed && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissOnboarding}
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                      Dismiss checklist
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
};

export default OnboardingChecklist;
