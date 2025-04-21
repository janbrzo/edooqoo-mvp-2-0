
import React from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

export type ToastIconType = 'success' | 'error' | 'warning' | 'info';

interface ToastIconProps {
  type: ToastIconType;
}

const ToastIcon: React.FC<ToastIconProps> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-4 h-4 text-red-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
        );
    }
  };

  return (
    <div className="toast-icon">
      {getIcon()}
    </div>
  );
};

export default ToastIcon;
