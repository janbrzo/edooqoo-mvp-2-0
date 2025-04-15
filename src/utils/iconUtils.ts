
import { Eye, Database, Pencil, Star, User, Lightbulb } from "lucide-react";

export const getIconComponent = (iconName: string) => {
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
