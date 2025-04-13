
import { Clock, FileText, Settings, Star } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="h-[calc(100vh-20px)] bg-worksheet-purpleLight p-6 rounded-lg ml-2.5 mt-2.5 mb-2.5">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">English Worksheet Generator</h1>
        <p className="text-gray-600 text-sm">Create professional, tailored worksheets in minutes instead of hours.</p>
      </div>
      
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-full text-worksheet-purple">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-medium text-worksheet-purpleDark">Save Time</h3>
            <p className="text-sm text-gray-600 font-light">Create in 5 minutes what would normally take 1-2 hours</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-full text-worksheet-purple">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-medium text-worksheet-purpleDark">Tailored Content</h3>
            <p className="text-sm text-gray-600 font-light">Specific, industry-focused exercises for your students</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-full text-worksheet-purple">
            <Star size={20} />
          </div>
          <div>
            <h3 className="font-medium text-worksheet-purpleDark">Ready to Use</h3>
            <p className="text-sm text-gray-600 font-light">Minimal edits needed (less than 10%)</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-full text-worksheet-purple">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-medium text-worksheet-purpleDark">Customizable</h3>
            <p className="text-sm text-gray-600 font-light">Easy to edit and adapt to your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
