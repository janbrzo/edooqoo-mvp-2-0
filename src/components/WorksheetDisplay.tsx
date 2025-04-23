
import WorksheetContainer from "./worksheet/WorksheetContainer";
import type { Worksheet } from "@/types/worksheet";

interface WorksheetDisplayProps {
  worksheet: Worksheet;
  inputParams: any;
  generationTime: number;
  sourceCount: number;
  onBack: () => void;
  wordBankOrder?: any;
  onDownload?: () => void;
}

export default function WorksheetDisplay(props: WorksheetDisplayProps) {
  return <WorksheetContainer {...props} />;
}
