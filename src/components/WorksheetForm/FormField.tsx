
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
      <label className={cn("block font-medium mb-2 text-sm", isOptional && "text-muted-foreground")}>{label}</label>
      <Input
        type="text"
        placeholder={placeholder}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="mb-3"
      />
      <div className="flex flex-wrap gap-2">
        {suggestions.map(suggestion => (
          <Button 
            key={suggestion.id} 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => onChange(suggestion.title)} 
            className="font-light text-sm"
          >
            {suggestion.title.length > 50 ? `${suggestion.title.substring(0, 50)}...` : suggestion.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
