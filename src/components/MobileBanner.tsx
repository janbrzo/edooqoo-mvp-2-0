
import React from 'react';
import { Zap, Clock, Book, Star } from 'lucide-react';

interface MobileBannerProps {
  title: string;
  description: string;
}

export function MobileBanner({ title, description }: MobileBannerProps) {
  return (
    <div className="mobile-banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500">Ready</span>
        </div>
      </div>
    </div>
  );
}
