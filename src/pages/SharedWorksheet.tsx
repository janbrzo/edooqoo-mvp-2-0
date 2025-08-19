
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useWorksheetSharing } from '@/hooks/useWorksheetSharing';
import { deepFixTextObjects } from '@/utils/textObjectFixer';
import WorksheetContent from '@/components/worksheet/WorksheetContent';

const SharedWorksheet = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [worksheet, setWorksheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSharedWorksheet } = useWorksheetSharing();

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const data = await getSharedWorksheet(shareToken);
        
        // Parse and fix the worksheet data
        const worksheetData = JSON.parse(data.ai_response);
        const fixedWorksheetData = deepFixTextObjects(worksheetData, 'sharedWorksheet');
        
        setWorksheet({
          ...data,
          parsedData: fixedWorksheetData
        });
      } catch (error: any) {
        console.error('Error fetching shared worksheet:', error);
        setError(error.message || 'Failed to load worksheet');
      } finally {
        setLoading(false);
      }
    };

    fetchWorksheet();
  }, [shareToken, getSharedWorksheet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Worksheet Not Available</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              This could mean the link has expired or the worksheet has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!worksheet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(worksheet.created_at), 'MMM dd, yyyy')}
              </span>
              {worksheet.teacher_email && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {worksheet.teacher_email}
                </span>
              )}
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">
                    {worksheet.parsedData.title || 'English Worksheet'}
                  </h1>
                  <p className="text-blue-700">
                    Shared by your teacher • Student View
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worksheet Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 print:shadow-none print:border-none">
          <WorksheetContent
            editableWorksheet={worksheet.parsedData}
            isEditing={false}
            viewMode="student"
            setEditableWorksheet={() => {}} // Read-only
            worksheetId={null}
            onFeedbackSubmit={() => {}}
            isDownloadUnlocked={false}
            inputParams={null}
            isSharedView={true}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-4 text-sm text-muted-foreground">
          <p>This worksheet was shared with you by your teacher.</p>
          <p className="mt-1">
            Create your own worksheets at{' '}
            <a 
              href="https://edooqoo.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              edooqoo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheet;
