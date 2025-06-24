
import { useToast } from "@/hooks/use-toast";

export function useWorksheetValidation() {
  const { toast } = useToast();
  
  const validateWorksheetStructure = (worksheet: any) => {
    if (!worksheet) {
      toast({
        title: "Invalid worksheet data",
        description: "The worksheet data is missing or invalid.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return { validateWorksheetStructure };
}
