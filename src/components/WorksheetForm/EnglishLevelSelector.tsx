
import { Button } from "@/components/ui/button";
import { EnglishLevel } from './types';
import { ENGLISH_LEVEL_DESCRIPTIONS } from './constants';

interface EnglishLevelSelectorProps {
  englishLevel: EnglishLevel;
  setEnglishLevel: (level: EnglishLevel) => void;
}

export default function EnglishLevelSelector({ englishLevel, setEnglishLevel }: EnglishLevelSelectorProps) {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button 
          type="button"
          variant={englishLevel === "A1/A2" ? "default" : "outline"} 
          onClick={() => setEnglishLevel("A1/A2")} 
          className={englishLevel === "A1/A2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
          size="sm"
        >
          A1/A2
        </Button>
        <Button 
          type="button"
          variant={englishLevel === "B1/B2" ? "default" : "outline"} 
          onClick={() => setEnglishLevel("B1/B2")} 
          className={englishLevel === "B1/B2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
          size="sm"
        >
          B1/B2
        </Button>
        <Button 
          type="button"
          variant={englishLevel === "C1/C2" ? "default" : "outline"} 
          onClick={() => setEnglishLevel("C1/C2")} 
          className={englishLevel === "C1/C2" ? "bg-worksheet-purple hover:bg-worksheet-purpleDark" : ""}
          size="sm"
        >
          C1/C2
        </Button>
      </div>
      <p className="text-sm text-gray-600 mb-2">CEFR Scale: {ENGLISH_LEVEL_DESCRIPTIONS[englishLevel]}</p>
    </div>
  );
}
