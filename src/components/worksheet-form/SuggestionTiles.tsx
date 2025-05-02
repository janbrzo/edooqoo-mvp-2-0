
import React from "react";
import { Button } from "@/components/ui/button";
import { Tile } from "@/constants/worksheetFormData";

interface SuggestionTilesProps {
  tiles: Tile[];
  onSelect: (title: string) => void;
  maxCharacters?: number;
}

const SuggestionTiles: React.FC<SuggestionTilesProps> = ({ 
  tiles, 
  onSelect,
  maxCharacters = Infinity
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tiles.map((tile) => (
        <Button
          key={tile.id}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(tile.title)}
          className="font-light text-sm"
        >
          {maxCharacters < Infinity && tile.title.length > maxCharacters 
            ? `${tile.title.substring(0, maxCharacters)}...` 
            : tile.title}
        </Button>
      ))}
    </div>
  );
};

export default SuggestionTiles;
