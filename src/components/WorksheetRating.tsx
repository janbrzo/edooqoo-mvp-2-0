
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string;
}

const WorksheetRating: React.FC<WorksheetRatingProps> = ({
  onSubmitRating,
  worksheetId
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const { toast } = useToast();

  const handleStarClick = (value: number) => {
    setSelected(value);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (worksheetId && selected) {
        const { error } = await supabase
          .from('feedbacks')
          .insert({
            worksheet_id: worksheetId,
            rating: selected,
            comment: feedback,
            status: 'submitted'
          });

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setThanksOpen(true);
      setTimeout(() => setThanksOpen(false), 2500);

      if (onSubmitRating && selected) {
        onSubmitRating(selected, feedback);
      }
      
      setFeedback("");
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating has been submitted successfully."
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  return <div data-no-pdf="true">
    <div className="flex justify-center space-x-2 mb-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="focus:outline-none transition-transform transform hover:scale-110"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={32}
            className={`${(hovered || selected) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`}
          />
        </button>
      ))}
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
            <Button size="sm" variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            size="sm"
            variant="default"
            onClick={handleSubmit}
            className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90"
          >
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
};

export default WorksheetRating;
