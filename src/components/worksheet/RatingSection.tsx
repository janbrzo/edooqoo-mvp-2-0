import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  handleSubmitRating,
}: RatingSectionProps) => (
  <div className="rating-section mb-4">
    <h2>How would you rate this worksheet?</h2>
    <p>Your feedback helps us improve our AI-generated worksheets</p>
    <div className="rating-stars mb-4">
      {[1, 2, 3, 4, 5].map(value => (
        <button
          key={value}
          onClick={() => setRating(value)}
          className={`
                    p-2 h-10 w-10 rounded-full flex items-center justify-center transition-colors
                    ${rating >= value ? 'bg-worksheet-purple text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
                  `}
        >
          {value}
        </button>
      ))}
    </div>

    <div className="mb-3">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        Share your feedback or suggestions:
      </label>
      <Textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="What did you like or what could be improved?"
        className="w-full"
      />
    </div>

    <Button
      onClick={handleSubmitRating}
      className="bg-worksheet-purple hover:bg-worksheet-purpleDark"
    >
      Submit Feedback
    </Button>
  </div>
);

export default RatingSection;
