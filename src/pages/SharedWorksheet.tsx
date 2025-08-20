
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [worksheet, setWorksheet] = useState<SharedWorksheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Invalid share token');
      setIsLoading(false);
      return;
    }

    loadSharedWorksheet();
  }, [token]);

  const loadSharedWorksheet = async () => {
    try {
      setIsLoading(true);
      
      // Call the existing RPC function
      const { data, error: rpcError } = await supabase.rpc('get_worksheet_by_share_token' as any, {
        p_share_token: token
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error('Worksheet not found or link has expired');
      }

      setWorksheet(data[0]);
      
      toast({
        title: "Worksheet loaded",
        description: "You're viewing a shared worksheet",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error loading shared worksheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load worksheet';
      setError(errorMessage);
      
      toast({
        title: "Failed to load worksheet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-worksheet-purple" />
          <p className="text-gray-600">Loading shared worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Worksheet Not Available
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            The share link may have expired or the worksheet may have been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No worksheet data available</p>
        </div>
      </div>
    );
  }

  // Parse the AI response to get the worksheet structure
  let parsedWorksheet;
  try {
    parsedWorksheet = JSON.parse(worksheet.ai_response);
  } catch (error) {
    console.error('Error parsing worksheet data:', error);
    parsedWorksheet = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-worksheet-purple" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {worksheet.title || parsedWorksheet?.title || 'English Worksheet'}
              </h1>
              <p className="text-sm text-gray-500">
                Shared by: {worksheet.teacher_email} • 
                Created: {new Date(worksheet.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Worksheet Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {worksheet.html_content ? (
            <div 
              id="shared-worksheet-content"
              dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
              className="prose max-w-none"
            />
          ) : parsedWorksheet ? (
            <div id="shared-worksheet-content">
              <h2 className="text-xl font-bold mb-4">{parsedWorksheet.title}</h2>
              {parsedWorksheet.subtitle && (
                <p className="text-gray-600 mb-4">{parsedWorksheet.subtitle}</p>
              )}
              {parsedWorksheet.introduction && (
                <p className="mb-6">{parsedWorksheet.introduction}</p>
              )}
              
              {parsedWorksheet.exercises?.map((exercise: any, index: number) => (
                <div key={index} className="mb-8 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">
                    Exercise {index + 1}: {exercise.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{exercise.instructions}</p>
                  
                  {exercise.content && (
                    <div className="mb-3">
                      <p>{exercise.content}</p>
                    </div>
                  )}
                  
                  {exercise.questions?.map((question: any, qIndex: number) => (
                    <div key={qIndex} className="mb-2">
                      <p><strong>{qIndex + 1}.</strong> {question.question || question}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Unable to display worksheet content</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            This is a read-only view of a shared worksheet. 
            <a 
              href="/" 
              className="text-worksheet-purple hover:underline ml-1"
            >
              Create your own worksheets
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheet;
