
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";

interface LanguageStyleSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const LanguageStyleSlider: React.FC<LanguageStyleSliderProps> = ({ value, onChange }) => {
  const isMobile = useIsMobile();

  const getStyleDescription = (value: number) => {
    if (value <= 2) return "Very casual (slang, contractions)";
    if (value <= 4) return "Casual (relaxed, friendly)";
    if (value <= 6) return "Neutral (balanced style)";
    if (value <= 8) return "Formal (professional tone)";
    return "Very formal (academic style)";
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'w-80'}`}>
      <div className="mb-2">
        <label className={`block font-medium ${isMobile ? 'text-sm' : 'text-sm'} text-gray-900 mb-1`}>
          Language Style:
        </label>
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Casual</span>
          <span>Formal</span>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={10}
        min={1}
        step={1}
        className="mb-2"
      />
      
      <div className="flex justify-between items-center">
        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium`}>
          {value}/10
        </span>
        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 italic`}>
          {getStyleDescription(value)}
        </span>
      </div>
    </div>
  );
};

export default LanguageStyleSlider;
