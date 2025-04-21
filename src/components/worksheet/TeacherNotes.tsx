
import React from "react";

const TeacherNotes = () => (
  <div className="teacher-notes mt-4">
    <h3 className="font-semibold text-worksheet-purple text-lg mb-2">Tips for teachers</h3>
    <div className="space-y-1 text-gray-600">
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        This worksheet is a general template you can customize for your student.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Verify the industry-specific terminology for accuracy.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Adjust the difficulty level as needed for your student.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Consider adding more visual elements for visual learners.
      </div>
    </div>
  </div>
);

export default TeacherNotes;
