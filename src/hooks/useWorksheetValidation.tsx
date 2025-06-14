
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Worksheet } from "@/components/WorksheetDisplay";

export const useWorksheetValidation = (worksheet: Worksheet) => {
  const { toast } = useToast();
  
  useEffect(() => {
    validateWorksheetStructure();
  }, []);
  
  const validateWorksheetStructure = () => {
    if (!worksheet) {
      toast({
        title: "Invalid worksheet data",
        description: "The worksheet data is missing or invalid.",
        variant: "destructive"
      });
      return;
    }
    
    if (!Array.isArray(worksheet.exercises) || worksheet.exercises.length === 0) {
      toast({
        title: "Missing exercises",
        description: "The worksheet doesn't contain any exercises.",
        variant: "destructive"
      });
      return;
    }
  };
  
  return { validateWorksheetStructure };
};
