
import React, { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STAR_TOTAL = 5;

const WorksheetRating = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanks, setThanks] = useState(false);

  const handleStarClick = (value: number) => {
    setSelected(value);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    setIsDialogOpen(false);
    setThanks(true);
    setTimeout(() => setThanks(false), 3000);
  };

  return (
    <>
      <div
        className="w-full rounded-xl py-10 px-6 mb-8 mt-4"
        style={{
          background: "linear-gradient(135deg, #F7F7FF 0%, #ededfa 100%)"
        }}
        data-no-pdf="true"
      >
        <h3 className="text-2xl text-center font-bold text-[#3d348b] mb-1" style={{ fontWeight: 700 }}>
          How would you rate this worksheet?
        </h3>
        <p className="text-center text-[#6457b5] text-base mb-6">
          Your feedback helps us improve our AI-generated worksheets
        </p>
        <div className="flex justify-center pb-2">
          {[...Array(STAR_TOTAL)].map((_, idx) => (
            <button
              key={idx}
              className="focus:outline-none"
              aria-label={`Give ${idx + 1} star rating`}
              onClick={() => handleStarClick(idx + 1)}
              onMouseEnter={() => setHovered(idx + 1)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: "transparent" }}
              type="button"
            >
              <Star
                size={42}
                strokeWidth={1.3}
                className={
                  (hovered ?? selected ?? 0) > idx
                    ? "text-yellow-400 fill-yellow-400 transition"
                    : "text-gray-300 transition"
                }
              />
            </button>
          ))}
        </div>
        {thanks && (
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
            {[...Array(STAR_TOTAL)].map((_, idx) => (
              <Star
                size={38}
                key={idx}
                strokeWidth={1.3}
                className={selected !== null && selected > idx ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
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
