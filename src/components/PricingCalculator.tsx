
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, Clock, Users, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const PricingCalculator = () => {
  const [prepTime, setPrepTime] = useState(30);
  const [lessonPrice, setLessonPrice] = useState(25);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(10);

  const monthlyLessons = lessonsPerWeek * 4;
  const monthlyPrepTime = prepTime * monthlyLessons;
  const monthlyPrepCost = (monthlyPrepTime / 60) * lessonPrice;
  
  const timesSaved = monthlyPrepTime * 0.8; // 80% time reduction
  const moneySaved = monthlyPrepCost * 0.8;

  return (
    <div className="bg-gradient-to-br from-background to-secondary/20 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Calculate Your Savings</h2>
          <p className="text-lg text-muted-foreground">
            See how much time and money you can save with our worksheet generator
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Savings Calculator
            </CardTitle>
            <CardDescription>
              Adjust the values below to see your personalized savings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepTime" className="flex items-center gap-2">
                  Prep Time? (minutes)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How many minutes do you typically spend preparing for each lesson?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  min="1"
                  max="180"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonPrice" className="flex items-center gap-2">
                  Lesson Price? ($)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>What do you charge per hour for your English lessons?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="lessonPrice"
                  type="number"
                  value={lessonPrice}
                  onChange={(e) => setLessonPrice(Number(e.target.value))}
                  min="1"
                  max="200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonsPerWeek" className="flex items-center gap-2">
                  Lessons per Week?
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How many lessons do you teach per week on average?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="lessonsPerWeek"
                  type="number"
                  value={lessonsPerWeek}
                  onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Money you will save with edooqoo</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${moneySaved.toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Time you will save with edooqoo</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(timesSaved / 60)}h {Math.round(timesSaved % 60)}m
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" className="w-full md:w-auto">
                Start Saving Today
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
