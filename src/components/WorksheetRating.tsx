import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
}

/**
 * A modern-looking worksheet rating section with 1-5 stars and feedback modal.
 * Should not display on PDF.
 */
const WorksheetRating: React.FC<WorksheetRatingProps> = ({
  onSubmitRating
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const handleStarClick = (value: number) => {
    setSelected(value);
    setIsDialogOpen(true);
  };
  const handleSubmit = () => {
    setIsDialogOpen(false);
    setThanksOpen(true);
    setTimeout(() => setThanksOpen(false), 2500);

    // Call the callback with rating and feedback
    if (onSubmitRating && selected) {
      onSubmitRating(selected, feedback);
    }
    setFeedback("");
  };
  return <div data-no-pdf="true">
      
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-no-pdf="true">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-1">
              Your feedback is important!
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-3 mb-4">
            {[1, 2, 3, 4, 5].map(idx => <Star key={idx} size={38} strokeWidth={1.3} className={selected && selected >= idx ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />)}
          </div>
          <label className="block text-base font-semibold mb-1 mt-2" htmlFor="feedbackTextarea">
            What did you think about this worksheet? (optional)
          </label>
          <Textarea id="feedbackTextarea" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Your feedback helps us improve our worksheet generator" rows={4} className="mb-3" />
          <div className="flex justify-end space-x-2 mt-2">
            <DialogClose asChild>
              <Button size="sm" variant="outline">Cancel</Button>
            </DialogClose>
            <Button size="sm" variant="default" onClick={handleSubmit} className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90">
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default WorksheetRating;