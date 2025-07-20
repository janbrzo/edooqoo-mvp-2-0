
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Clock, Plus, Minus } from 'lucide-react';

interface PricingCalculatorProps {
  onRecommendation: (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onRecommendation }) => {
  const [prepTime, setPrepTime] = useState(20);
  const [lessonPrice, setLessonPrice] = useState(20);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(15);
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

  const NumberInput = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    id 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    min: number; 
    max: number; 
    id: string; 
  }) => {
    const increment = () => onChange(Math.min(value + 1, max));
    const decrement = () => onChange(Math.max(value - 1, min));

    return (
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <div className="relative group">
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            className="h-9 text-center px-8 w-20"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-9 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={decrement}
            disabled={value <= min}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-9 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={increment}
            disabled={value >= max}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculate Your Savings</CardTitle>
        </div>
        <p className="text-muted-foreground text-sm">
          See how much time and money you'll save with our worksheet generator
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-center gap-8">
            <NumberInput
              label="Prep Time (minutes)"
              value={prepTime}
              onChange={setPrepTime}
              min={1}
              max={120}
              id="prep-time"
            />
            
            <NumberInput
              label="Lesson Price ($)"
              value={lessonPrice}
              onChange={setLessonPrice}
              min={1}
              max={200}
              id="lesson-price"
            />
            
            <NumberInput
              label="Lessons per Week"
              value={lessonsPerWeek}
              onChange={setLessonsPerWeek}
              min={1}
              max={50}
              id="lessons-week"
            />
          </div>
          
          {monthlySavings > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200 text-sm">
                    Monthly Savings
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-green-600">
                    ${monthlySavings.toFixed(0)}
                  </span>
                  <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                    <Clock className="h-3 w-3" />
                    <span className="text-xl font-bold">{timeSavings}min saved</span>
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
