
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Pricing from "@/pages/Pricing";
import Profile from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import StudentPage from "@/pages/StudentPage";
import SharedWorksheet from "@/pages/SharedWorksheet";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from 'sonner';
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip"
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

const queryClient = new QueryClient();

function App() {
  // Enable onboarding tracking
  useOnboardingTracking();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student/:id" element={<StudentPage />} />
            <Route path="/shared/:token" element={<SharedWorksheet />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
        
        {/* OnboardingChecklist - appears on all pages for authenticated users */}
        <OnboardingChecklist />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
