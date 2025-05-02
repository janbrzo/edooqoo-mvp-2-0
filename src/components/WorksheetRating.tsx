
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { submitWorksheetFeedback } from '@/services/worksheetService';
import { useAnonymousAuth } from '@/hooks/useAnonymousAuth';

interface WorksheetRatingProps {
  worksheetId?: string;
  onSubmitRating?: () => void;
}

const WorksheetRating: React.FC<WorksheetRatingProps> = ({ worksheetId, onSubmitRating }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { userId } = useAnonymousAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!worksheetId) {
      toast({
        title: "Error submitting feedback",
        description: "Missing worksheet ID",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error submitting feedback",
        description: "User session not found",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Choose from 1 to 5 stars before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await submitWorksheetFeedback(worksheetId, rating, feedback, userId);
      
      setSubmitting(false);
      setSubmitted(true);
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating and comments help us improve our service.",
      });
      
      if (onSubmitRating) {
        onSubmitRating();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSubmitting(false);
      
      toast({
        title: "Error submitting feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div data-no-pdf="true" className="bg-white p-6 border rounded-lg shadow-sm mb-6">
      <h2 className="text-xl font-semibold mb-4">How would you rate this worksheet?</h2>
      
      {submitted ? (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">🎉</div>
          <h3 className="text-lg font-medium">Thank you for your feedback!</h3>
          <p className="text-gray-600">Your rating helps us improve our worksheets.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <button
                  type="button"
                  key={ratingValue}
                  className={`text-3xl mx-1 focus:outline-none ${
                    ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Rate ${ratingValue} out of 5 stars`}
                >
                  ★
                </button>
              );
            })}
          </div>
          
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Additional comments (optional)
            </label>
            <textarea
              id="feedback"
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-worksheet-purple"
              placeholder="Tell us what you liked or how we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className={`px-6 py-2 rounded-md text-white ${
                submitting || rating === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-worksheet-purple hover:bg-worksheet-purpleDark'
              } transition-colors`}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WorksheetRating;
