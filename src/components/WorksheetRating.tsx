
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { submitFeedback, updateFeedback } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import { toast } from "sonner";

interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
  worksheetId?: string | null;
}

/**
 * A modern-looking worksheet rating section with thumbs up/down rating and feedback modal.
 * Should not display on PDF.
 */
const WorksheetRating: React.FC<WorksheetRatingProps> = ({ onSubmitRating, worksheetId }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentFeedbackId, setCurrentFeedbackId] = useState<string | null>(null);
  const { toast: shadowToast } = useToast();
  const { userId } = useAnonymousAuth();
  
  // Unikaj duplikowania feedbacków - sprawdź czy już został wysłany
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(false);

  useEffect(() => {
    // Sprawdź czy użytkownik już wysłał feedback dla tego worksheetu
    if (worksheetId) {
      const feedbackKey = `feedback_submitted_${worksheetId}`;
      if (localStorage.getItem(feedbackKey)) {
        setHasSubmittedFeedback(true);
      }
    }
  }, [worksheetId]);
  
  const markFeedbackAsSubmitted = () => {
    if (worksheetId) {
      localStorage.setItem(`feedback_submitted_${worksheetId}`, 'true');
      setHasSubmittedFeedback(true);
    }
  };
  
  const handleRatingClick = async (value: number) => {
    // Zapobiegaj wielokrotnemu klikaniu
    if (submitting) return;
    
    setSelected(value);
    setIsDialogOpen(true);
    
    try {
      setSubmitting(true);
      
      // Jeśli już wysłano feedback dla tego worksheetu, nie wysyłaj ponownie
      if (hasSubmittedFeedback) {
        console.log('Feedback already submitted for this worksheet');
        return;
      }
      
      // Submit rating immediately when button is clicked
      if (userId) {
        const actualWorksheetId = worksheetId || 
          new URL(window.location.href).searchParams.get('worksheet_id') || 
          null;
            
        if (actualWorksheetId) {
          const result = await submitFeedback(actualWorksheetId, value, '', userId);
          
          // Store the feedback ID for future updates
          if (result && Array.isArray(result) && result.length > 0 && result[0]?.id) {
            setCurrentFeedbackId(result[0].id);
            markFeedbackAsSubmitted();
          }
          
          // Wyświetlaj powiadomienie tylko tutaj, a nie w serwisie
          toast.success("Dziękujemy za twoją ocenę! Możesz dodać komentarz, aby podać więcej szczegółów.");
          
          // Call the callback if provided
          if (onSubmitRating) {
            onSubmitRating(value, '');
          }
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!selected || !userId || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Try to get worksheet ID from props, URL or DOM
      let actualWorksheetId = worksheetId || null;
      
      if (!actualWorksheetId && window.location.href.includes('worksheet_id=')) {
        actualWorksheetId = new URL(window.location.href).searchParams.get('worksheet_id');
      }
      
      // If no worksheet ID in URL, check for other elements
      if (!actualWorksheetId) {
        const worksheetElements = document.querySelectorAll('[data-worksheet-id]');
        if (worksheetElements.length > 0) {
          actualWorksheetId = worksheetElements[0].getAttribute('data-worksheet-id');
        }
      }
      
      if (currentFeedbackId) {
        // Update existing feedback with comment
        await updateFeedback(currentFeedbackId, feedback, userId);
        markFeedbackAsSubmitted();
      } else if (actualWorksheetId) {
        // Submit new feedback with rating and comment
        const result = await submitFeedback(actualWorksheetId, selected, feedback, userId);
        
        // Store the feedback ID
        if (result && Array.isArray(result) && result.length > 0 && result[0]?.id) {
          setCurrentFeedbackId(result[0].id);
          markFeedbackAsSubmitted();
        }
      } else {
        // Create a placeholder for unknown worksheets
        const placeholderResult = await submitFeedback('unknown', selected, feedback, userId);
        if (placeholderResult && Array.isArray(placeholderResult) && placeholderResult.length > 0) {
          setCurrentFeedbackId(placeholderResult[0]?.id);
          markFeedbackAsSubmitted();
        }
      }
      
      setIsDialogOpen(false);
      setThanksOpen(true);
      setTimeout(() => setThanksOpen(false), 2500);
      
      // Używaj tylko jednego systemu powiadomień
      toast.success("Dziękujemy za Twoją opinię! Twoje oceny i komentarze pomagają nam poprawiać nasze usługi.");
      
      // Call the callback with rating and feedback
      if (onSubmitRating) {
        onSubmitRating(selected, feedback);
      }
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Nie udało się wysłać opinii. Spróbuj ponownie później.");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div data-no-pdf="true">
      <div className="p-6 rounded-lg mt-10 mb-6 text-center bg-white">
        <h3 className="text-indigo-800 mb-2 font-bold text-2xl">Jak oceniasz ten worksheet?</h3>
        <p className="text-blue-400 mb-4 text-base">Twoja opinia pomaga nam ulepszać nasze worksheety generowane przez AI</p>
        
        <div className="flex justify-center space-x-8 mb-2">
          <Toggle
            variant="feedback"
            size="icon"
            pressed={selected === 5}
            onPressedChange={() => handleRatingClick(5)}
            disabled={submitting || hasSubmittedFeedback}
            className={`transition-transform transform hover:scale-110 ${hasSubmittedFeedback ? 'cursor-not-allowed opacity-70' : ''}`}
            aria-label="Thumbs up"
          >
            <ThumbsUp 
              size={32} 
              className={`${selected === 5 ? 'text-blue-500' : 'text-gray-300'} ${hovered === 5 && !hasSubmittedFeedback ? 'text-blue-300' : ''}`} 
              onMouseEnter={() => !hasSubmittedFeedback && setHovered(5)} 
              onMouseLeave={() => setHovered(null)}
            />
          </Toggle>
          
          <Toggle
            variant="feedback"
            size="icon"
            pressed={selected === 1}
            onPressedChange={() => handleRatingClick(1)}
            disabled={submitting || hasSubmittedFeedback}
            className={`transition-transform transform hover:scale-110 ${hasSubmittedFeedback ? 'cursor-not-allowed opacity-70' : ''}`}
            aria-label="Thumbs down"
          >
            <ThumbsDown 
              size={32} 
              className={`${selected === 1 ? 'text-blue-500' : 'text-gray-300'} ${hovered === 1 && !hasSubmittedFeedback ? 'text-blue-300' : ''}`} 
              onMouseEnter={() => !hasSubmittedFeedback && setHovered(1)} 
              onMouseLeave={() => setHovered(null)}
            />
          </Toggle>
        </div>
        
        {hasSubmittedFeedback && (
          <p className="text-green-500 font-medium animate-fade-in mt-2">
            Dziękujemy za ocenę tego worksheetu!
          </p>
        )}
        
        {thanksOpen && !hasSubmittedFeedback && (
          <p className="text-green-500 font-medium animate-fade-in">
            Dziękujemy za Twoją opinię!
          </p>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-no-pdf="true">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-1">
              Twoja opinia jest ważna!
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-3 mb-4">
            {selected === 5 ? (
              <ThumbsUp size={38} className="text-blue-500" />
            ) : (
              <ThumbsDown size={38} className="text-blue-500" />
            )}
          </div>
          <label className="block text-base font-semibold mb-1 mt-2" htmlFor="feedbackTextarea">
            Co sądzisz o tym worksheecie? (opcjonalnie)
          </label>
          <Textarea 
            id="feedbackTextarea" 
            value={feedback} 
            onChange={e => setFeedback(e.target.value)} 
            placeholder="Twoja opinia pomaga nam ulepszać nasz generator worksheetów" 
            rows={4} 
            className="mb-3" 
          />
          <div className="flex justify-end space-x-2 mt-2">
            <DialogClose asChild>
              <Button size="sm" variant="outline" disabled={submitting}>Anuluj</Button>
            </DialogClose>
            <Button 
              size="sm" 
              variant="default" 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90"
            >
              {submitting ? 'Wysyłanie...' : 'Wyślij opinię'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorksheetRating;
