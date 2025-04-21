
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RatingSectionProps {
  rating: number;
  setRating: (rating: number) => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
  handleSubmitRating: () => void;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  rating,
  setRating,
  feedback,
  setFeedback,
  handleSubmitRating
}) => {
  const [hover, setHover] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStarClick = (value: number) => {
    setRating(value);
    setIsDialogOpen(true);
  };

  return (
    <div data-no-pdf="true" className="p-6 rounded-lg mt-10 mb-6 text-center bg-white">
      <h3 className="text-indigo-800 mb-2 font-bold text-2xl">How would you rate this worksheet?</h3>
      <p className="text-blue-400 mb-4 text-base">Your feedback helps us improve our AI-generated worksheets</p>
      
      <div className="flex justify-center space-x-2 mb-2 rounded-none bg-transparent">
        {[1, 2, 3, 4, 5].map(star => (
          <button 
            key={star} 
            onClick={() => handleStarClick(star)} 
            onMouseEnter={() => setHover(star)} 
            onMouseLeave={() => setHover(0)} 
            className="focus:outline-none transition-transform transform hover:scale-110" 
            aria-label={`Rate ${star} stars`}
          >
            <Star size={32} className={`${(hover || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} />
          </button>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-1">
              Your feedback is important!
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center mt-3 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                size={38} 
                strokeWidth={1.3} 
                className={rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
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
              onClick={handleSubmitRating} 
              className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90"
            >
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RatingSection;
