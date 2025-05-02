
import { Tile } from "@/constants/worksheetFormData";

export const getRandomTiles = (tiles: Tile[], count = 5): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
