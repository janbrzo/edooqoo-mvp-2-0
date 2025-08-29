import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Download, 
  Eye, 
  EyeOff, 
  Edit, 
  Save, 
  Loader2,
  Sliders,
  Share2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateDownloadToken } from "@/services/userService";
import { useSession } from "next-auth/react";
import { isMobile } from 'react-device-detect';
import DownloadPopup from './DownloadPopup';
import ExerciseReorderToggle from './ExerciseReorderToggle';
import { useExerciseReordering } from '@/hooks/useExerciseReordering';

interface WorksheetToolbarProps {
  viewMode: 'student' | 'teacher';
  setViewMode: (mode: 'student' | 'teacher') => void;
  isEditing: boolean;
  isSaving: boolean;
  handleEdit: () => void;
  handleSave: () => void;
  worksheetId?: string | null;
  userIp?: string;
  isDownloadUnlocked: boolean;
  onDownloadUnlock: (token: string) => void;
  onTrackDownload: () => void;
  showPdfButton: boolean;
  editableWorksheet: any;
  userId?: string;
}

export default function WorksheetToolbar({
  viewMode,
  setViewMode,
  isEditing,
  isSaving,
  handleEdit,
  handleSave,
  worksheetId,
  userIp,
  isDownloadUnlocked,
  onDownloadUnlock,
  onTrackDownload,
  showPdfButton,
  editableWorksheet,
  userId
}: WorksheetToolbarProps) {
  const isMobileDevice = isMobile;
  const [downloadPopup, setDownloadPopup] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  const exerciseReordering = useExerciseReordering({
    editableWorksheet,
    setEditableWorksheet: () => {} // This will be handled by parent component
  });

  const handleGenerateDownloadToken = async () => {
    if (!session?.user?.email) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to download the worksheet.",
        variant: "destructive"
      });
      return;
    }

    if (!worksheetId) {
      toast({
        title: "Missing worksheet ID",
        description: "Worksheet ID is missing, cannot generate download token.",
        variant: "destructive"
      });
      return;
    }

    try {
      const tokenData = await generateDownloadToken(session.user.email, worksheetId, userIp || 'unknown');
      onDownloadUnlock(tokenData.token);
      toast({
        title: "Download unlocked",
        description: "You can now download the worksheet.",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error("Error generating download token:", error);
      toast({
        title: "Failed to unlock download",
        description: "An error occurred while unlocking the download.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mb-6 bg-white border rounded-lg shadow-sm">
      <div className="p-4">
        <Label htmlFor="view-mode" className="inline-flex items-center text-sm font-medium mr-4">
          View Mode:
        </Label>
        <div className="inline-flex items-center space-x-2">
          <Button
            variant={viewMode === 'student' ? 'default' : 'outline'}
            onClick={() => setViewMode('student')}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Student
          </Button>
          <Button
            variant={viewMode === 'teacher' ? 'default' : 'outline'}
            onClick={() => setViewMode('teacher')}
            size="sm"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Teacher
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="view-mode" className="inline-flex items-center text-sm font-medium mr-4">
              View Mode:
            </Label>
            <div className="inline-flex items-center space-x-2">
              <Button
                variant={viewMode === 'student' ? 'default' : 'outline'}
                onClick={() => setViewMode('student')}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Student
              </Button>
              <Button
                variant={viewMode === 'teacher' ? 'default' : 'outline'}
                onClick={() => setViewMode('teacher')}
                size="sm"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Teacher
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Exercise Reordering Toggle - only show in editing mode */}
            {isEditing && (
              <ExerciseReorderToggle
                isReorderingEnabled={exerciseReordering.isReorderingEnabled}
                onEnableReordering={exerciseReordering.enableReordering}
                onDisableReordering={exerciseReordering.disableReordering}
                onResetOrder={exerciseReordering.resetToOriginalOrder}
                hasOriginalOrder={exerciseReordering.hasOriginalOrder}
              />
            )}

            {isEditing ? (
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleEdit}
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Worksheet
              </Button>
            )}

            {isDownloadUnlocked ? (
              <Button
                variant="default"
                onClick={() => {
                  onTrackDownload();
                  setDownloadPopup(true);
                }}
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Download Worksheet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGenerateDownloadToken}>
                    Unlock with Token
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={true}>
                    Purchase Access (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {downloadPopup && (
        <DownloadPopup
          worksheetId={worksheetId}
          onClose={() => setDownloadPopup(false)}
          showPdfButton={showPdfButton}
          editableWorksheet={editableWorksheet}
        />
      )}
    </div>
  );
}
