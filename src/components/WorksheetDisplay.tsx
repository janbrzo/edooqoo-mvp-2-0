
import WorksheetContainer from "./worksheet/WorksheetContainer";
import type { Worksheet } from "@/types/worksheet";
import { FormData } from "@/components/WorksheetForm";

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: FormData | null;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
}

export default function WorksheetDisplay(props: WorksheetDisplayProps) {
  // Safety check to prevent rendering with invalid data
  if (!props.worksheet || typeof props.worksheet !== 'object') {
    return null;
  }
  
  return <WorksheetContainer {...props} />;
}
