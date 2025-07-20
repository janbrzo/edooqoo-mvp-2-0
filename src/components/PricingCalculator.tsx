
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Clock } from 'lucide-react';

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

  return (
    <Card className="mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prep-time" className="text-sm">
                Prep Time (minutes)
              </Label>
              <Input
                id="prep-time"
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                min="1"
                max="120"
                className="h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="lesson-price" className="text-sm">
                Lesson Price ($)
              </Label>
              <Input
                id="lesson-price"
                type="number"
                value={lessonPrice}
                onChange={(e) => setLessonPrice(Number(e.target.value))}
                min="1"
                max="200"
                className="h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="lessons-week" className="text-sm">
                Lessons per Week
              </Label>
              <Input
                id="lessons-week"
                type="number"
                value={lessonsPerWeek}
                onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
                min="1"
                max="50"
                className="h-9"
              />
            </div>
          </div>
          
          {monthlySavings > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200 text-sm">
                  Monthly Savings
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${monthlySavings.toFixed(0)}
              </div>
              <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                <Clock className="h-3 w-3" />
                <span className="text-sm">{timeSavings}min saved</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
