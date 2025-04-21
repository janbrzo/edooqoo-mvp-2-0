
import React from "react";
import { Eye, Database, Pencil, Star, User, Lightbulb, Clock } from "lucide-react";

interface ExerciseHeaderProps {
  icon: string;
  title: string;
  isEditing: boolean;
  time: number;
  onTitleChange: (value: string) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "fa-book-open":
      return <Eye className="h-5 w-5" />;
    case "fa-link":
      return <Database className="h-5 w-5" />;
    case "fa-pencil-alt":
      return <Pencil className="h-5 w-5" />;
    case "fa-check-square":
      return <Star className="h-5 w-5" />;
    case "fa-comments":
      return <User className="h-5 w-5" />;
    case "fa-question-circle":
      return <Lightbulb className="h-5 w-5" />;
    default:
      return <Eye className="h-5 w-5" />;
  }
};

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  icon,
  title,
  isEditing,
  time,
  onTitleChange
}) => (
  <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
    <div className="flex items-center">
      <div className="p-2 bg-white/20 rounded-full mr-3">
        {getIconComponent(icon)}
      </div>
      <h3 className="text-lg font-semibold">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className="bg-transparent border-b border-white/30 text-white w-full p-1"
          />
        ) : title}
      </h3>
    </div>
    <div className="flex items-center bg-white/20 px-3 py-1 rounded-md">
      <Clock className="h-4 w-4 mr-1" />
      <span className="text-sm">{time} min</span>
    </div>
  </div>
);

export default ExerciseHeader;
