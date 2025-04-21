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
  handleSubmitRating
}: RatingSectionProps) => {};
export default RatingSection;