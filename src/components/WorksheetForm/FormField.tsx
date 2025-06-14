
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tile } from './types';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: Tile[];
  isOptional?: boolean;
}

export default function FormField({ label, placeholder, value, onChange, suggestions, isOptional }: FormFieldProps) {
  const isMobile = useIsMobile();
  
  return (
    <div>
      <label className={cn("block font-medium mb-2", isMobile ? "text-sm" : "text-sm", isOptional && "text-muted-foreground")}>{label}</label>
      <Input
        type="text"
        placeholder={placeholder}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className={`mb-3 ${isMobile ? 'text-sm' : ''}`}
      />
      <div className={`flex flex-wrap gap-2 ${isMobile ? 'gap-1' : ''}`}>
        {suggestions.map(suggestion => (
          <Button 
            key={suggestion.id} 
            type="button" 
            variant="outline" 
            size={isMobile ? "sm" : "sm"}
            onClick={() => onChange(suggestion.title)} 
            className={`font-light ${isMobile ? 'text-xs px-2 py-1' : 'text-sm'}`}
          >
            {suggestion.title.length > (isMobile ? 30 : 50) ? `${suggestion.title.substring(0, isMobile ? 30 : 50)}...` : suggestion.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
