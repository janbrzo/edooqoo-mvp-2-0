import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  GraduationCap, 
  Zap, 
  FileText, 
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  Gift,
  Star,
  Award,
  Target,
  Clock,
  Lightbulb,
  BookOpen,
  PenTool,
  Sparkles
} from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useTokenSystem } from '@/hooks/useTokenSystem';
import { usePlanLogic } from '@/hooks/usePlanLogic';
import WorksheetForm from '@/components/WorksheetForm';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';
import IsometricBackground from '@/components/IsometricBackground';
import RatingSection from '@/components/RatingSection';
import { PricingCalculator } from '@/components/PricingCalculator';

const Index = () => {
  const { user, isRegisteredUser } = useAuthFlow();
  const { tokenLeft, profile } = useTokenSystem(user?.id);
  const { currentPlan } = usePlanLogic(profile?.subscription_type);
  const { userId } = useAnonymousAuth();
  const navigate = useNavigate();
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);

  const handleGetStarted = () => {
    if (isRegisteredUser) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleWorksheetSubmit = (formData: any) => {
    // Handle worksheet form submission
    console.log('Worksheet form submitted:', formData);
  };

  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqItems = [
    {
      question: "How does the worksheet generator work?",
      answer: "Our AI-powered generator creates custom English worksheets based on your specifications. Simply choose the type of exercise, English level, topic, and any specific requirements. The system generates both student and teacher versions in about 30-60 seconds."
    },
    {
      question: "What types of worksheets can I create?",
      answer: "You can create various types including vocabulary exercises, grammar practice, reading comprehension, fill-in-the-blanks, multiple choice questions, matching exercises, and dialogue practice. All worksheets are customizable to your students' needs."
    },
    {
      question: "Do I need to sign up to try the generator?",
      answer: "No! You can try the worksheet generator without signing up. However, creating an account gives you 2 free tokens, allows you to save your work, manage students, and access your worksheet history."
    },
    {
      question: "How many worksheets can I create?",
      answer: "Free users get 2 tokens after registration. Our Side-Gig plan includes 15 worksheets per month, and Full-Time plans offer 30-120 worksheets monthly. Unused worksheets carry forward to the next month."
    },
    {
      question: "Can I edit the generated worksheets?",
      answer: "Yes! All worksheets are fully editable. You can modify text, adjust difficulty, add your own questions, or customize the content to perfectly match your lesson plans."
    },
    {
      question: "Are worksheets suitable for all English levels?",
      answer: "Absolutely! Our generator supports all levels from A1 (beginner) to C2 (proficient). You can specify the exact level and the AI will adjust vocabulary, grammar complexity, and instructions accordingly."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <IsometricBackground />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            {isRegisteredUser ? (
              <>
                <Button asChild variant="outline">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/pricing" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Pricing
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/login" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/pricing" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Pricing
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {isRegisteredUser && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Balance: {tokenLeft} tokens
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Plan: {currentPlan.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-worksheet-purple" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-worksheet-purple to-worksheet-blue bg-clip-text text-transparent">
              AI Worksheet Generator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            Create custom English worksheets in seconds. Perfect for teachers who want to save time while delivering engaging, personalized lessons for their students.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-worksheet-purple hover:bg-worksheet-purpleDark text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Gift className="mr-2 h-5 w-5" />
              {isRegisteredUser ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purple hover:text-white px-8 py-3 text-lg font-semibold"
            >
              <Link to="/pricing">
                <Zap className="mr-2 h-5 w-5" />
                View Plans
              </Link>
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>1000+ Teachers</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>10,000+ Worksheets Created</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>30-60 Second Generation</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-worksheet-purple">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-worksheet-purple/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-worksheet-purple" />
                </div>
                <CardTitle className="text-xl">AI-Powered Creation</CardTitle>
              </div>
              <CardDescription>
                Advanced AI generates custom worksheets tailored to your students' English level and learning objectives.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-worksheet-blue">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-worksheet-blue/10 rounded-lg">
                  <PenTool className="h-6 w-6 text-worksheet-blue" />
                </div>
                <CardTitle className="text-xl">Fully Editable</CardTitle>
              </div>
              <CardDescription>
                Every worksheet is completely customizable. Edit text, adjust difficulty, and modify content to match your teaching style.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-worksheet-green">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-worksheet-green/10 rounded-lg">
                  <Download className="h-6 w-6 text-worksheet-green" />
                </div>
                <CardTitle className="text-xl">Multiple Formats</CardTitle>
              </div>
              <CardDescription>
                Export worksheets as HTML or PDF. Get both student and teacher versions with answer keys included.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Worksheet Generator Section */}
        <Card className="mb-16 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-worksheet-purple" />
              Try the Worksheet Generator
            </CardTitle>
            <CardDescription className="text-lg">
              Create your first worksheet in seconds. No registration required to try!
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <WorksheetForm onSubmit={handleWorksheetSubmit} />
          </CardContent>
        </Card>

        {/* Pricing Calculator */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Find Your Perfect Plan</h2>
            <p className="text-lg text-muted-foreground">
              Tell us about your teaching needs and we'll recommend the best plan for you.
            </p>
          </div>
          <PricingCalculator onRecommendation={() => {}} />
        </div>

        {/* Ratings Section */}
        <RatingSection />

        {/* FAQ Section */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-lg">
              Everything you need to know about our worksheet generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Collapsible key={index} className="border rounded-lg">
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFaqItem(index)}
                  >
                    <span className="font-medium text-lg">{item.question}</span>
                    {openFaqItems.includes(index) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                    {item.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-worksheet-purple to-worksheet-blue text-white">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Teaching?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teachers who are already creating amazing worksheets with AI
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-worksheet-purple hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                <Gift className="mr-2 h-5 w-5" />
                {isRegisteredUser ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="border-white text-white hover:bg-white hover:text-worksheet-purple px-8 py-3 text-lg font-semibold"
              >
                <Link to="/pricing">
                  <Zap className="mr-2 h-5 w-5" />
                  View Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
