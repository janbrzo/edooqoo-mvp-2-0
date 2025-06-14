
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tile } from './types';

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: Tile[];
}

export default function FormField({ label, placeholder, value, onChange, suggestions }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
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
