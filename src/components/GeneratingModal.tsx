
import { Progress } from "@/components/ui/progress";

interface GeneratingModalProps {
  isOpen: boolean;
}

export default function GeneratingModal({ isOpen }: GeneratingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 space-y-6">
        <h2 className="text-2xl font-semibold text-center text-worksheet-purple">Generating Your Worksheet</h2>
        <Progress 
          value={66} 
          className="h-2 bg-gray-200"
          indicatorClassName="bg-gradient-to-r from-worksheet-purple to-violet-400"
        />
        <p className="text-center text-gray-600">This may take a minute...</p>
      </div>
    </div>
  );
}
