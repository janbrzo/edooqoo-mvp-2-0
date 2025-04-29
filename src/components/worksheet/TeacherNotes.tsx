
import React from "react";

const TeacherNotes = () => (
  <div className="teacher-notes mt-4">
    <h3 className="font-semibold text-worksheet-purple text-lg mb-2">Tips for teachers</h3>
    <div className="space-y-1 text-gray-600">
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        This worksheet is a customized template for your student. Review all exercises before using.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Each exercise includes a specific teacher tip to guide your instruction.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Adjust the difficulty level as needed based on your student's progress during the lesson.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Consider adding visual aids or examples if your student is a visual learner.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Use the vocabulary sheet as a pre-teaching activity or follow-up resource.
      </div>
    </div>
  </div>
);

export default TeacherNotes;
