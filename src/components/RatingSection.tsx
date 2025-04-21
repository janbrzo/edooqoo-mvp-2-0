
import React, { useState } from "react";
import { Star, StarOff, StarHalf } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STAR_COUNT = 5;

export default function RatingSection() {
  const [hover, setHover] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const onStarClick = (idx: number) => {
    setRating(idx);
    setOpen(true);
  };

  const handleSubmit = () => {
    setOpen(false);
    toast({
      title: "Thank you for your feedback!",
      description: "Your feedback helps us improve our worksheet generator.",
      className: "bg-white border-l-4 border-l-green-500 rounded-xl py-2 px-4",
    });
    setFeedback("");
  };

  return (
    <>
      <div className="rounded-xl bg-[#F1F0FB] p-7 mb-8 flex flex-col items-center shadow-md"
           style={{ border: "none", minHeight: 185 }}>
        <h2 className="text-2xl font-bold text-worksheet-purple mb-1 text-center">How would you rate this worksheet?</h2>
        <span className="text-worksheet-purple/80 text-base mb-4">Your feedback helps us improve our AI-generated worksheets</span>
        <div className="flex flex-row items-center gap-2 mb-1">
          {[...Array(STAR_COUNT)].map((_, idx) => {
            const starNumber = idx + 1;
            let color = "text-gray-300";
            if (hover >= starNumber || (!hover && rating >= starNumber)) {
              color = "text-yellow-400";
            }

            return (
              <button
                type="button"
                key={idx}
                aria-label={`Rate ${starNumber} ${starNumber === 1 ? "star" : "stars"}`}
                className="transition-transform"
                onMouseEnter={() => setHover(starNumber)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onStarClick(starNumber)}
                style={{ background: "none", border: "none", padding: 0, outline: "none" }}
              >
                <Star className={`w-9 h-9 ${color}`} fill={color === "text-yellow-400" ? "#fde047" : "none"} />
              </button>
            );
          })}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Your feedback is important!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center mb-6">
            <div className="flex flex-row items-center gap-1 mb-3">
              {[...Array(STAR_COUNT)].map((_, idx) => {
                const starNumber = idx + 1;
                let color = "text-gray-300";
                if (rating >= starNumber) {
                  color = "text-yellow-400";
                }
                return (
                  <Star className={`w-8 h-8 ${color}`} fill={color === "text-yellow-400" ? "#fde047" : "none"} key={starNumber}/>
                );
              })}
            </div>
            <span className="font-medium mb-2 text-gray-800">What did you think about this worksheet? <span className="text-gray-500">(optional)</span></span>
            <textarea
              placeholder="Your feedback helps us improve our worksheet generator"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full h-24 rounded-md border border-gray-300 focus:border-purple-300 focus:ring p-2 text-gray-900 bg-gray-50"
            />
          </div>
          <DialogFooter className="justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button variant="default" onClick={handleSubmit}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
