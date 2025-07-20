
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp } from 'lucide-react';

interface PricingCalculatorProps {
  onRecommendation: (plan: 'side-gig' | 'full-time', worksheetsNeeded: number) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onRecommendation }) => {
  const [prepTime, setPrepTime] = useState(30);
  const [lessonPrice, setLessonPrice] = useState(25);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(20);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [recommendedPlan, setRecommendedPlan] = useState<'side-gig' | 'full-time'>('full-time');
  const [recommendedWorksheets, setRecommendedWorksheets] = useState(60);

  useEffect(() => {
    // Calculate monthly prep time cost
    const monthlyPrepHours = (prepTime * lessonsPerWeek * 4) / 60;
    const monthlyCost = monthlyPrepHours * lessonPrice;
    
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
    setRecommendedPlan(planType);
    setRecommendedWorksheets(recommendedWorksheetCount);
    
    onRecommendation(planType, recommendedWorksheetCount);
  }, [prepTime, lessonPrice, lessonsPerWeek, onRecommendation]);

  return (
    <Card className="mb-8">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Calculate Your Savings</CardTitle>
        </div>
        <p className="text-muted-foreground text-sm">
          See how much time and money you'll save with our worksheet generator
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prep-time" className="text-sm font-medium">
              Prep Time (minutes per lesson)
            </Label>
            <Input
              id="prep-time"
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              min="1"
              max="120"
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lesson-price" className="text-sm font-medium">
              Lesson Price ($)
            </Label>
            <Input
              id="lesson-price"
              type="number"
              value={lessonPrice}
              onChange={(e) => setLessonPrice(Number(e.target.value))}
              min="1"
              max="200"
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lessons-week" className="text-sm font-medium">
              Lessons per Week
            </Label>
            <Input
              id="lessons-week"
              type="number"
              value={lessonsPerWeek}
              onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
              min="1"
              max="50"
              className="h-10"
            />
          </div>
        </div>
        
        {monthlySavings > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                Your Monthly Savings
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              ${monthlySavings.toFixed(0)}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p>Current prep cost: ${((prepTime * lessonsPerWeek * 4) / 60 * lessonPrice).toFixed(0)}/month</p>
              <p>With our app: ${recommendedPlan === 'side-gig' ? '9' : 
                recommendedWorksheets === 30 ? '19' :
                recommendedWorksheets === 60 ? '39' :
                recommendedWorksheets === 90 ? '59' : '79'}/month</p>
            </div>
            <Badge className="mt-2 bg-green-600 hover:bg-green-700">
              Recommended: {recommendedPlan === 'side-gig' ? 'Side-Gig Plan' : 
                `Full-Time Plan (${recommendedWorksheets} worksheets)`}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
