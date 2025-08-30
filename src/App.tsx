import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import PricingPage from "@/pages/PricingPage";
import Profile from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import StudentPage from "@/pages/StudentPage";
import SharedWorksheet from "@/pages/SharedWorksheet";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from 'sonner';
import {
  QueryClient,
  QueryClientProvider as QueryClientProviderBase,
} from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip"
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

const queryClient = new QueryClient();

interface QueryClientProviderProps {
  client: QueryClient;
  children: React.ReactNode;
}

const QueryClientProvider: React.FC<QueryClientProviderProps> = ({
  client,
  children,
}) => {
  return (
    <QueryClientProviderBase client={client}>
      {children}
    </QueryClientProviderBase>
  );
};

function App() {
  // Enable onboarding tracking
  useOnboardingTracking();

  return (
    <QueryClient client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student/:id" element={<StudentPage />} />
            <Route path="/shared/:token" element={<SharedWorksheet />} />
          </Routes>
        </BrowserRouter>
        
        {/* OnboardingChecklist - appears on all pages for authenticated users */}
        <OnboardingChecklist />
      </TooltipProvider>
    </QueryClient>
  );
}

export default App;
