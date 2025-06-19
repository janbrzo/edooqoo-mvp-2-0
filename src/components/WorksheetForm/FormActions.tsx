
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormActionsProps {
  onRefreshTiles: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FormActions({ onRefreshTiles, onSubmit }: FormActionsProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} pt-4`}>
      <Button 
        type="button" 
        variant="outline" 
        onClick={onRefreshTiles} 
        className={`border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purpleLight ${isMobile ? 'w-full' : ''}`}
        size={isMobile ? "sm" : "default"}
      >
        Refresh Suggestions
      </Button>
      <Button 
        type="submit" 
        onClick={onSubmit}
        className={`bg-worksheet-purple hover:bg-worksheet-purpleDark ${isMobile ? 'w-full' : ''}`}
        size={isMobile ? "sm" : "default"}
      >
        Generate Custom Worksheet
      </Button>
    </div>
  );
}
