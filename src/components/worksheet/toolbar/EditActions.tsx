
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EditActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
}

export default function EditActions({
  isEditing,
  onEdit,
  onSave
}: EditActionsProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {!isEditing && (
        <Button
          variant="outline"
          onClick={onEdit}
          className={`border-worksheet-purple text-worksheet-purple ${isMobile ? '' : 'mr-2'}`}
          size="sm"
        >
          <Edit className="mr-2 h-4 w-4" /> Edit Worksheet
        </Button>
      )}
      {isEditing && (
        <Button
          onClick={onSave}
          className={`bg-green-600 hover:bg-green-700 ${isMobile ? '' : 'mr-2'}`}
          size="sm"
        >
          Save Changes
        </Button>
      )}
    </>
  );
}
