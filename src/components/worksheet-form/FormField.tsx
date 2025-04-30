
import React from "react";
import { Input } from "@/components/ui/input";
import { Tile } from "@/constants/worksheetFormData";
import SuggestionTiles from "./SuggestionTiles";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  tiles: Tile[];
  maxCharacters?: number;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  tiles,
  maxCharacters,
  required = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}{required && <span className="text-red-500"> *</span>}</label>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mb-3"
      />
      <SuggestionTiles
        tiles={tiles}
        onSelect={onChange}
        maxCharacters={maxCharacters}
      />
    </div>
  );
};

export default FormField;
