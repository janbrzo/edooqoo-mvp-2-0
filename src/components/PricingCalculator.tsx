
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, TrendingUp, Clock, Plus, Minus, Info } from 'lucide-react';

interface PricingCalculatorProps {
  onRecommendation: (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onRecommendation }) => {
  const [prepTime, setPrepTime] = useState(25);
  const [lessonPrice, setLessonPrice] = useState(25);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(7);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [timeSavings, setTimeSavings] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('side-gig');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(15);

  useEffect(() => {
    // Calculate monthly prep time and cost
    const monthlyPrepHours = (prepTime * lessonsPerWeek * 4) / 60;
    const monthlyCost = monthlyPrepHours * lessonPrice;
    const monthlyPrepMinutes = prepTime * lessonsPerWeek * 4;
    
    // Determine recommended plan based on lessons per week
    const worksheetsNeeded = lessonsPerWeek * 4; // Assume 1 worksheet per lesson
    
    let planType: 'side-gig' | 'full-time' = 'side-gig';
    let planCost = 9;
    let recommendedWorksheetCount = 15;
    
    if (worksheetsNeeded > 15) {
      planType = 'full-time';
      // Find the best Full-Time plan
      if (worksheetsNeeded <= 30) {
        planCost = 19;
        recommendedWorksheetCount = 30;
      } else if (worksheetsNeeded <= 60) {
        planCost = 39;
        recommendedWorksheetCount = 60;
      } else if (worksheetsNeeded <= 90) {
        planCost = 59;
        recommendedWorksheetCount = 90;
      } else {
        planCost = 79;
        recommendedWorksheetCount = 120;
      }
    }
    
    const savings = monthlyCost - planCost;
    setMonthlySavings(savings);
    setTimeSavings(monthlyPrepMinutes);
    setRecommendedPlan(planType);
    setRecommendedWorksheets(recommendedWorksheetCount);
    
    onRecommendation(planType, recommendedWorksheetCount);
  }, [prepTime, lessonPrice, lessonsPerWeek, onRecommendation]);

  const handleIncrement = (field: 'prepTime' | 'lessonPrice' | 'lessonsPerWeek') => {
    switch (field) {
      case 'prepTime':
        setPrepTime(prev => Math.min(prev + 5, 120));
        break;
      case 'lessonPrice':
        setLessonPrice(prev => Math.min(prev + 5, 200));
        break;
      case 'lessonsPerWeek':
        setLessonsPerWeek(prev => Math.min(prev + 1, 50));
        break;
    }
  };

  const handleDecrement = (field: 'prepTime' | 'lessonPrice' | 'lessonsPerWeek') => {
    switch (field) {
      case 'prepTime':
        setPrepTime(prev => Math.max(prev - 5, 1));
        break;
      case 'lessonPrice':
        setLessonPrice(prev => Math.max(prev - 5, 1));
        break;
      case 'lessonsPerWeek':
        setLessonsPerWeek(prev => Math.max(prev - 1, 1));
        break;
    }
  };

  return (
    <Card className="mb-6 bg-white dark:bg-gray-900">
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Calculate Your Savings</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm">
            See how much time and money you'll save with our worksheet generator
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TooltipProvider>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="prep-time" className="text-sm">
                    Prep time? (minutes)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many minutes do you typically spend preparing materials for each lesson?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleDecrement('prepTime')}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="prep-time"
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Math.max(1, Math.min(120, Number(e.target.value))))}
                    min="1"
                    max="120"
                    className="h-9 w-14 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleIncrement('prepTime')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TooltipProvider>
            
            <TooltipProvider>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="lesson-price" className="text-sm">
                    Lesson price? ($)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>What do you charge per hour for your English lessons?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleDecrement('lessonPrice')}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="lesson-price"
                    type="number"
                    value={lessonPrice}
                    onChange={(e) => setLessonPrice(Math.max(1, Math.min(200, Number(e.target.value))))}
                    min="1"
                    max="200"
                    className="h-9 w-14 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleIncrement('lessonPrice')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TooltipProvider>
            
            <TooltipProvider>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="lessons-week" className="text-sm">
                    Lessons weekly?
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lessons do you teach per week on average?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleDecrement('lessonsPerWeek')}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="lessons-week"
                    type="number"
                    value={lessonsPerWeek}
                    onChange={(e) => setLessonsPerWeek(Math.max(1, Math.min(50, Number(e.target.value))))}
                    min="1"
                    max="50"
                    className="h-9 w-14 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-none"
                    onClick={() => handleIncrement('lessonsPerWeek')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TooltipProvider>
          </div>
          
          {monthlySavings > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200 text-sm">
                    Your Monthly Savings
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${monthlySavings.toFixed(0)}
                    </div>
                    <div className="text-xs text-green-600">
                      money you will save with edooqoo
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-green-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-2xl font-bold">{timeSavings}min</span>
                    </div>
                    <div className="text-xs text-green-600">
                      time you will save with edooqoo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
