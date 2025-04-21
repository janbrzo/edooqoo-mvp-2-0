
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A modern-looking worksheet rating section with 1-5 stars and feedback modal.
 * Should not display on PDF.
 */
const WorksheetRating = () => {
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
    setFeedback("");
  };

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #f4f4fc 0%, #ededfa 100%)",
          borderRadius: 14,
        }}
        className="w-full py-10 px-6 mb-8 mt-4 flex flex-col items-center shadow-none"
        data-no-pdf="true"
      >
        <h3 className="text-2xl text-center font-bold mb-1" style={{ fontWeight: 700, color: "#3d348b" }}>
          How would you rate this worksheet?
        </h3>
        <p className="text-center text-[#6457b5] text-base mb-6">
          Your feedback helps us improve our AI-generated worksheets
        </p>
        <div className="flex justify-center pb-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <button
              key={idx}
              className="focus:outline-none"
              aria-label={`Give ${idx} star rating`}
              onClick={() => handleStarClick(idx)}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: "transparent" }}
              type="button"
            >
              <Star
                size={42}
                strokeWidth={1.3}
                className={
                  (hovered ?? selected ?? 0) >= idx
                    ? "text-yellow-400 fill-yellow-400 transition"
                    : "text-gray-300 transition"
                }
              />
            </button>
          ))}
        </div>
        {thanksOpen && (
          <p className="text-green-600 transition-all text-center font-medium mt-2">Thank you for your feedback!</p>
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
            {[1, 2, 3, 4, 5].map((idx) => (
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
            onChange={(e) => setFeedback(e.target.value)}
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
    </>
  );
};

export default WorksheetRating;
