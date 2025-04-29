
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
  if (!props.worksheet) {
    return null;
  }
  
  return <WorksheetContainer {...props} />;
}
