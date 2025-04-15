
import { Clock } from "lucide-react";
import { getIconComponent } from "@/utils/iconUtils";

interface ExerciseHeaderProps {
  title: string;
  icon: string;
  time: number;
  isEditing?: boolean;
  onTitleChange?: (value: string) => void;
}

export const ExerciseHeader = ({ title, icon, time, isEditing, onTitleChange }: ExerciseHeaderProps) => {
  return (
    <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center h-12">
      <div className="flex items-center">
        <div className="p-2 bg-white/20 rounded-full mr-3">
          {getIconComponent(icon)}
        </div>
        <h3 className="text-lg font-semibold">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange?.(e.target.value)}
              className="bg-transparent border-b border-white/30 text-white w-full p-1"
            />
          ) : (
            title
          )}
        </h3>
      </div>
      <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm">{time} min</span>
      </div>
    </div>
  );
};
