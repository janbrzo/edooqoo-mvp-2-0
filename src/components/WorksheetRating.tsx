
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitWorksheetFeedback } from "@/services/feedbackService";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";

interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string | null;
}

/**
 * A modern-looking worksheet rating section with 1-5 stars and feedback modal
 */
const WorksheetRating: React.FC<WorksheetRatingProps> = ({ onSubmitRating, worksheetId }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { userId } = useAnonymousAuth();
  
  // Find the actual worksheet ID from various sources
  const getWorksheetId = (): string => {
    // Try to get worksheet ID from props, URL or DOM
    let actualWorksheetId = worksheetId || null;
    
    if (!actualWorksheetId && typeof window !== "undefined") {
      // Check URL params
      if (window.location.href.includes('worksheet_id=')) {
        actualWorksheetId = new URL(window.location.href).searchParams.get('worksheet_id');
      }
      
      // Check for data attribute
      if (!actualWorksheetId) {
        const worksheetElements = document.querySelectorAll('[data-worksheet-id]');
        if (worksheetElements.length > 0) {
          actualWorksheetId = worksheetElements[0].getAttribute('data-worksheet-id');
        }
      }
    }
    
    return actualWorksheetId || 'unknown';
  };
  
  const handleStarClick = async (value: number) => {
    setSelected(value);
    
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "Cannot submit rating without user authentication",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get the actual worksheet ID
      const actualWorksheetId = getWorksheetId();
      
      // Submit the initial rating
      await submitWorksheetFeedback(actualWorksheetId, value, '', userId);
      
      toast({
        title: "Rating submitted!",
        description: "Thanks for your feedback. Add a comment for more details."
      });
      
      // Call the callback if provided
      if (onSubmitRating) {
        onSubmitRating(value, '');
      }
      
      // Open dialog to collect additional comment
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Rating submission failed",
        description: "We couldn't submit your rating. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!selected || !userId) return;
    
    try {
      setSubmitting(true);
      
      // Get the actual worksheet ID
      const actualWorksheetId = getWorksheetId();
      
      // Update feedback with comment
      await submitWorksheetFeedback(actualWorksheetId, selected, feedback, userId);
      
      setIsDialogOpen(false);
      setThanksOpen(true);
      setTimeout(() => setThanksOpen(false), 2500);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service."
      });
      
      // Call the callback with rating and feedback
      if (onSubmitRating) {
        onSubmitRating(selected, feedback);
      }
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Feedback submission failed",
        description: "We couldn't submit your feedback. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setFeedback("");
      setSubmitting(false);
    }
  };
  
  return (
    <div data-no-pdf="true">
      <div className="p-6 rounded-lg mt-10 mb-6 text-center bg-white">
        <h3 className="text-indigo-800 mb-2 font-bold text-2xl">How would you rate this worksheet?</h3>
        <p className="text-blue-400 mb-4 text-base">Your feedback helps us improve our AI-generated worksheets</p>
        
        <div className="flex justify-center space-x-2 mb-2 rounded-none bg-transparent">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star} 
              onClick={() => handleStarClick(star)} 
              onMouseEnter={() => setHovered(star)} 
              onMouseLeave={() => setHovered(null)} 
              className="focus:outline-none transition-transform transform hover:scale-110"
              disabled={submitting} 
              aria-label={`Rate ${star} stars`}
            >
              <Star 
                size={32} 
                className={`${(hovered || selected) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`}
              />
            </button>
          ))}
        </div>
        
        {thanksOpen && (
          <p className="text-green-500 font-medium animate-fade-in">
            Thank you for your feedback!
          </p>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-no-pdf="true">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-1">
              Your feedback is important!
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-3 mb-4">
            {[1, 2, 3, 4, 5].map(idx => (
              <Star 
                key={idx} 
                size={38} 
                strokeWidth={1.3} 
                className={selected && selected >= idx ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
              />
            ))}
          </div>
          <label className="block text-base font-semibold mb-1 mt-2" htmlFor="feedbackTextarea">
            What did you think about this worksheet? (optional)
          </label>
          <Textarea 
            id="feedbackTextarea" 
            value={feedback} 
            onChange={e => setFeedback(e.target.value)} 
            placeholder="Your feedback helps us improve our worksheet generator" 
            rows={4} 
            className="mb-3" 
          />
          <div className="flex justify-end space-x-2 mt-2">
            <DialogClose asChild>
              <Button size="sm" variant="outline" disabled={submitting}>Cancel</Button>
            </DialogClose>
            <Button 
              size="sm" 
              variant="default" 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorksheetRating;
