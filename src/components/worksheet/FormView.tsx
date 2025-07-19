
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, GraduationCap } from "lucide-react";
import WorksheetForm from "@/components/WorksheetForm";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";

interface FormViewProps {
  onSubmit: (data: any) => void;
  userId: string | null;
}

export default function FormView({ onSubmit, userId }: FormViewProps) {
  const { userId: authUserId } = useAnonymousAuth();
  const isLoggedIn = !!authUserId;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {!isLoggedIn ? (
          <Button asChild variant="outline">
            <Link to="/auth">Sign In for Free</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="outline" size="icon">
              <Link to="/profile">
                <User className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">
                <GraduationCap className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </>
        )}
      </div>

      <WorksheetForm onSubmit={onSubmit} userId={userId} />
    </div>
  );
}
