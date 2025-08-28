
import React from 'react';
import { Button } from '@/components/ui/button';
import { GripVertical, RotateCcw } from 'lucide-react';

interface ExerciseReorderToggleProps {
  isReorderingEnabled: boolean;
  onEnableReordering: () => void;
  onDisableReordering: () => void;
  onResetOrder: () => void;
  hasOriginalOrder: boolean;
}

const ExerciseReorderToggle: React.FC<ExerciseReorderToggleProps> = ({
  isReorderingEnabled,
  onEnableReordering,
  onDisableReordering,
  onResetOrder,
  hasOriginalOrder
}) => {
  return (
    <div className="flex items-center gap-2">
      {!isReorderingEnabled ? (
        <Button
          onClick={onEnableReordering}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <GripVertical className="h-4 w-4" />
          Enable Reordering
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            onClick={onDisableReordering}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <GripVertical className="h-4 w-4" />
            Disable Reordering
          </Button>
          {hasOriginalOrder && (
            <Button
              onClick={onResetOrder}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Order
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseReorderToggle;
