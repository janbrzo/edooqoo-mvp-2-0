
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string | null;
}

/**
 * A modern-looking worksheet rating section with thumbs up/down and feedback modal.
 * Should not display on PDF.
 */
const WorksheetRating: React.FC<WorksheetRatingProps> = ({ onSubmitRating, worksheetId }) => {
  const [hovered, setHovered] = useState<'up' | 'down' | null>(null);
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleThumbClick = async (value: 'up' | 'down') => {
    setSelected(value);
    
    try {
      setSubmitting(true);
      
      // Show immediate feedback
      toast({
        title: "Rating submitted!",
        description: "Thanks for your feedback. Add a comment for more details."
      });
      
      // Call the callback if provided
      if (onSubmitRating) {
        onSubmitRating(value === 'up' ? 5 : 1, '');
      }
      
      // Then open dialog to collect additional comment
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
    if (!selected) return;
    
    try {
      setSubmitting(true);
      
      setIsDialogOpen(false);
      setThanksOpen(true);
      setTimeout(() => setThanksOpen(false), 2500);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service."
      });
      
      // Call the callback with rating and feedback
      if (onSubmitRating) {
        onSubmitRating(selected === 'up' ? 5 : 1, feedback);
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
        
        <div className="flex justify-center space-x-8 mb-2 rounded-none bg-transparent">
          <button 
            onClick={() => handleThumbClick('up')} 
            onMouseEnter={() => setHovered('up')} 
            onMouseLeave={() => setHovered(null)} 
            className="focus:outline-none transition-transform transform hover:scale-110 p-2"
            disabled={submitting} 
            aria-label="Rate positively"
          >
            <ThumbsUp 
              size={40} 
              className={`${
                (hovered === 'up' || selected === 'up') 
                  ? 'text-green-500 fill-green-500' 
                  : 'text-gray-300'
              } transition-colors`} 
            />
          </button>
          <button 
            onClick={() => handleThumbClick('down')} 
            onMouseEnter={() => setHovered('down')} 
            onMouseLeave={() => setHovered(null)} 
            className="focus:outline-none transition-transform transform hover:scale-110 p-2"
            disabled={submitting} 
            aria-label="Rate negatively"
          >
            <ThumbsDown 
              size={40} 
              className={`${
                (hovered === 'down' || selected === 'down') 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-300'
              } transition-colors`} 
            />
          </button>
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
            {selected === 'up' ? (
              <ThumbsUp size={48} className="text-green-500 fill-green-500" />
            ) : (
              <ThumbsDown size={48} className="text-red-500 fill-red-500" />
            )}
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
