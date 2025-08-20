
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, Calendar, User, AlertCircle, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WorksheetContent from '@/components/worksheet/WorksheetContent';
import { Skeleton } from '@/components/ui/skeleton';

interface SharedWorksheetData {
  id: string;
  title: string;
  ai_response: string;
  html_content: string;
  created_at: string;
  teacher_email: string;
}

const SharedWorksheet = () => {
  const { token } = useParams<{ token: string }>();
  const [worksheetData, setWorksheetData] = useState<SharedWorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableWorksheet, setEditableWorksheet] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchSharedWorksheet(token);
    } else {
      setError('Invalid share link');
      setLoading(false);
    }
  }, [token]);

  const fetchSharedWorksheet = async (shareToken: string) => {
    try {
      console.log('Fetching shared worksheet with token:', shareToken);
      
      const { data, error } = await supabase.rpc('get_worksheet_by_share_token', {
        p_share_token: shareToken
      });

      if (error) {
        console.error('Error fetching shared worksheet:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setError('Worksheet not found or link has expired');
        return;
      }

      const worksheet = data[0];
      setWorksheetData(worksheet);
      
      // Parse the AI response to get the worksheet structure
      try {
        const parsedWorksheet = JSON.parse(worksheet.ai_response);
        setEditableWorksheet(parsedWorksheet);
      } catch (parseError) {
        console.error('Error parsing worksheet content:', parseError);
        setError('Invalid worksheet format');
      }

    } catch (error) {
      console.error('Error fetching shared worksheet:', error);
      setError('Failed to load worksheet. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">Worksheet Not Available</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!worksheetData || !editableWorksheet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No worksheet data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with watermark */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                SHARED WORKSHEET
              </span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              size="sm"
            >
              Create Your Own Worksheets
            </Button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {worksheetData.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Shared by teacher</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(worksheetData.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Public View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Worksheet content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <WorksheetContent
            editableWorksheet={editableWorksheet}
            isEditing={false}
            viewMode="student"
            setEditableWorksheet={() => {}} // Read-only
            worksheetId={worksheetData.id}
            onFeedbackSubmit={() => {}} // Disabled
            isDownloadUnlocked={false} // No downloads for shared view
            inputParams={null}
          />
        </div>
      </div>

      {/* Footer notice */}
      <div className="bg-gray-100 border-t py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            This is a shared English worksheet. Want to create your own?
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Start Creating Worksheets
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheet;
