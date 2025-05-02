
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitWorksheetFeedback } from "@/services/worksheetService";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";

interface WorksheetRatingProps {
  onSubmitRating?: (rating: number, feedback: string) => void;
}

/**
 * A modern-looking worksheet rating section with 1-5 stars and feedback modal.
 * Should not display on PDF.
 */
const WorksheetRating: React.FC<WorksheetRatingProps> = ({ onSubmitRating }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { userId } = useAnonymousAuth();
  
  // Funkcja do pobierania ID arkusza z URL lub atrybutów danych
  const getWorksheetIdFromUrl = (): string | null => {
    // Próba pobrania ID arkusza z URL
    let worksheetId = null;
    
    // Sprawdzenie parametrów wyszukiwania URL
    if (window.location.href.includes('worksheet_id=')) {
      worksheetId = new URL(window.location.href).searchParams.get('worksheet_id');
    }
    
    // Jeśli ID nie jest w URL, sprawdź atrybuty danych
    if (!worksheetId) {
      const worksheetElements = document.querySelectorAll('[data-worksheet-id]');
      if (worksheetElements.length > 0) {
        worksheetId = worksheetElements[0].getAttribute('data-worksheet-id');
      }
    }
    
    // Jeśli nadal nie mamy ID, spróbuj utworzyć tymczasowe
    if (!worksheetId) {
      // Sprawdzenie, czy istnieje data-element dla tytułu
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        // Stwórz ID na podstawie tytułu i bieżącego czasu
        const title = titleElement.textContent || 'worksheet';
        const timestamp = new Date().getTime();
        worksheetId = `temp-${title.substring(0, 10).replace(/\s+/g, '-')}-${timestamp}`;
      } else {
        // Ostateczne rozwiązanie - po prostu wygeneruj ID na podstawie czasu
        worksheetId = `temp-worksheet-${new Date().getTime()}`;
      }
    }
    
    return worksheetId;
  };
  
  const handleStarClick = async (value: number) => {
    setSelected(value);
    
    try {
      // Pobierz ID arkusza roboczego
      const worksheetId = getWorksheetIdFromUrl();
      
      if (worksheetId && userId) {
        // Dodanie atrybutu data do głównej sekcji arkusza
        const worksheetContent = document.getElementById('worksheet-content');
        if (worksheetContent) {
          worksheetContent.setAttribute('data-worksheet-id', worksheetId);
        }
        
        // Wyślij ocenę bezpośrednio po kliknięciu gwiazdki
        await submitWorksheetFeedback(worksheetId, value, '', userId);
        
        toast({
          title: "Ocena zapisana!",
          description: "Dziękujemy za Twoją ocenę. Dodaj komentarz, aby podać więcej szczegółów."
        });
        
        // Jeśli użytkownik dostarczył wywołanie zwrotne, wywołaj je
        if (onSubmitRating) {
          onSubmitRating(value, '');
        }
      } else {
        console.warn("Nie można określić ID arkusza roboczego lub ID użytkownika");
      }
    } catch (error) {
      console.error("Błąd podczas przesyłania oceny:", error);
    }
    
    // Otwórz okno dialogowe, aby zebrać dodatkowy komentarz
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    
    try {
      const worksheetId = getWorksheetIdFromUrl();
      
      if (worksheetId && userId) {
        await submitWorksheetFeedback(worksheetId, selected, feedback, userId);
        
        setIsDialogOpen(false);
        setThanksOpen(true);
        setTimeout(() => setThanksOpen(false), 2500);
        
        toast({
          title: "Dziękujemy za opinię!",
          description: "Twoja ocena i komentarze pomagają nam ulepszyć nasz serwis."
        });
        
        // Wywołaj funkcję zwrotną z oceną i opinią
        if (onSubmitRating) {
          onSubmitRating(selected, feedback);
        }
      } else {
        toast({
          title: "Nie można znaleźć ID arkusza lub ID użytkownika",
          description: "Spróbuj odświeżyć stronę i spróbować ponownie.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Błąd podczas przesyłania opinii:", error);
      toast({
        title: "Błąd przesyłania opinii",
        description: "Nie mogliśmy przesłać Twojej opinii. Spróbuj ponownie później.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setFeedback("");
    }
  };
  
  // Dodaj ID arkusza do elementu DOM przy ładowaniu
  useEffect(() => {
    const worksheetId = getWorksheetIdFromUrl();
    if (worksheetId) {
      const worksheetContent = document.getElementById('worksheet-content');
      if (worksheetContent) {
        worksheetContent.setAttribute('data-worksheet-id', worksheetId);
      }
    }
  }, []);
  
  return (
    <div data-no-pdf="true" className="bg-white p-6 border rounded-lg shadow-sm mt-6">
      <h3 className="text-indigo-800 mb-2 font-bold text-2xl">How would you rate this worksheet?</h3>
      <p className="text-blue-400 mb-4 text-base">Your feedback helps us improve our AI-generated worksheets</p>
      
      <div className="flex justify-center space-x-2 mb-2 rounded-none bg-transparent">
        {[1, 2, 3, 4, 5].map(star => (
          <button 
            key={star} 
            onClick={() => handleStarClick(star)} 
            onMouseEnter={() => setHovered(star)} 
            onMouseLeave={() => setHovered(0)} 
            className="focus:outline-none transition-transform transform hover:scale-110" 
            aria-label={`Rate ${star} stars`}
            disabled={isSubmitting}
          >
            <Star size={32} className={`${(hovered || selected) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} />
          </button>
        ))}
      </div>
      
      {thanksOpen && (
        <p className="text-green-500 font-medium animate-fade-in">
          Thank you for your feedback!
        </p>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-no-pdf="true">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-1">
              Your feedback is important!
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-3 mb-4">
            {[1, 2, 3, 4, 5].map(idx => (
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
              onClick={handleSubmit} 
              className="bg-[#3d348b] text-white hover:bg-[#3d348b]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorksheetRating;
