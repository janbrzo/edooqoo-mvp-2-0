
import React from "react";

const TeacherNotes = () => (
  <div className="teacher-notes mt-4">
    <h3 className="font-semibold text-worksheet-purple text-lg mb-2">Tips for teachers</h3>
    <div className="space-y-1 text-gray-600">
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        This worksheet is a customized template for your student based on your specifications. Review all exercises before using.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Each exercise includes specific teacher tips to guide your instruction, look for the purple tip boxes.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Adjust the difficulty level as needed based on your student's progress during the lesson.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Consider using a timer for each exercise to help students practice time management for exams.
      </div>
      <div className="bg-gray-50 p-3 rounded-md font-normal text-sm border border-gray-100 shadow-sm">
        Use the vocabulary sheet as a pre-teaching activity or follow-up resource for homework.
      </div>
    </div>
  </div>
);

export default TeacherNotes;
