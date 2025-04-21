import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
interface RatingSectionProps {
  rating: number;
  setRating: (rating: number) => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
  handleSubmitRating: () => void;
}
const RatingSection = ({
  rating,
  setRating,
  feedback,
  setFeedback,
  handleSubmitRating
}: RatingSectionProps) => {
  const [hover, setHover] = React.useState(0);
  return <div data-no-pdf="true" className="p-6 rounded-lg mt-10 mb-6 text-center bg-white">
      <h3 className="text-indigo-800 mb-2 font-bold text-2xl">How would you rate this worksheet?</h3>
      <p className="text-blue-400 mb-4 text-base">Your feedback helps us improve our AI-generated worksheets</p>
      
      <div className="flex justify-center space-x-2 mb-2 rounded-none bg-transparent">
        {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="focus:outline-none transition-transform transform hover:scale-110" aria-label={`Rate ${star} stars`}>
            <Star size={32} className={`${(hover || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} />
          </button>)}
      </div>
      
      {rating > 0 && <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            What did you think about this worksheet? (optional)
          </label>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Your feedback helps us improve our worksheet generator" rows={4} className="mb-3" />
          <Button onClick={handleSubmitRating}>Submit Feedback</Button>
        </div>}
    </div>;
};
export default RatingSection;