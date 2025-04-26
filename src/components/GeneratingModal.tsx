
import React from 'react';

interface GeneratingModalProps {
  isOpen: boolean;
}

export default function GeneratingModal({ isOpen }: GeneratingModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 relative mb-4">
            <div className="animate-spin h-16 w-16 border-4 border-worksheet-purpleLight border-t-worksheet-purple rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-sm text-worksheet-purple font-medium">AI</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-worksheet-purple">Generowanie arkusza...</h2>
          
          <p className="text-gray-600 mt-2">
            Trwa generowanie spersonalizowanego arkusza na podstawie Twoich preferencji.
            Może to potrwać do 30 sekund.
          </p>
          
          <div className="mt-4 flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 max-w-xs">
              <div className="bg-worksheet-purple h-2 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-500">Używamy zaawansowanych modeli AI do tworzenia unikalnej zawartości</p>
          </div>
        </div>
      </div>
    </div>
  );
}
