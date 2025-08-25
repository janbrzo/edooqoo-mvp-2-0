
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SharedWorksheetContent from '@/components/shared/SharedWorksheetContent';

interface SharedWorksheetData {
  id: string;
  title: string;
  ai_response: string;
  html_content: string;
  created_at: string;
  teacher_email: string;
}

const SharedWorksheet = () => {
  console.log('🔍 SharedWorksheet: Component starting to render');
  
  const { token } = useParams<{ token: string }>();
  const [worksheet, setWorksheet] = useState<SharedWorksheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  console.log('🔍 SharedWorksheet: Token from params:', token);

  useEffect(() => {
    console.log('🔍 SharedWorksheet: useEffect triggered');
    
    if (!token) {
      console.error('🔍 SharedWorksheet: No token provided');
      setError('Invalid share token');
      setIsLoading(false);
      return;
    }

    console.log('🔍 SharedWorksheet: Starting to load worksheet with token:', token);
    loadSharedWorksheet();
  }, [token]);

  const loadSharedWorksheet = async () => {
    try {
      console.log('🔍 SharedWorksheet: loadSharedWorksheet() started');
      setIsLoading(true);
      
      // Call the existing RPC function
      console.log('🔍 SharedWorksheet: Calling RPC function get_worksheet_by_share_token');
      const { data, error: rpcError } = await supabase.rpc('get_worksheet_by_share_token' as any, {
        p_share_token: token
      });

      console.log('🔍 SharedWorksheet: RPC response:', { data, rpcError });

      if (rpcError) {
        console.error('🔍 SharedWorksheet: RPC error:', rpcError);
        throw rpcError;
      }

      if (!data || data.length === 0) {
        console.error('🔍 SharedWorksheet: No data returned from RPC');
        throw new Error('Worksheet not found or link has expired');
      }

      console.log('🔍 SharedWorksheet: Setting worksheet data:', data[0]);
      setWorksheet(data[0]);
      
      toast({
        title: "Worksheet loaded",
        description: "You're viewing a shared worksheet",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('🔍 SharedWorksheet: Error in loadSharedWorksheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load worksheet';
      setError(errorMessage);
      
      toast({
        title: "Failed to load worksheet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('🔍 SharedWorksheet: Setting loading to false');
      setIsLoading(false);
    }
  };

  console.log('🔍 SharedWorksheet: Current state:', { isLoading, error, hasWorksheet: !!worksheet });

  if (isLoading) {
    console.log('🔍 SharedWorksheet: Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-worksheet-purple" />
          <p className="text-gray-600">Loading shared worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🔍 SharedWorksheet: Rendering error state:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    console.log('🔍 SharedWorksheet: Rendering no worksheet state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No worksheet data available</p>
        </div>
      </div>
    );
  }

  // Parse the AI response to get the worksheet title if needed
  let parsedWorksheet;
  try {
    parsedWorksheet = JSON.parse(worksheet.ai_response);
    console.log('🔍 SharedWorksheet: Parsed AI response successfully:', parsedWorksheet);
  } catch (error) {
    console.error('🔍 SharedWorksheet: Error parsing AI response:', error);
    parsedWorksheet = null;
  }

  const worksheetTitle = worksheet.title || parsedWorksheet?.title || 'English Worksheet';
  console.log('🔍 SharedWorksheet: Final worksheet title:', worksheetTitle);

  console.log('🔍 SharedWorksheet: About to render main content');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-worksheet-purple" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {worksheetTitle}
              </h1>
              <p className="text-sm text-gray-500">
                Shared by: {worksheet.teacher_email} • 
                Created: {new Date(worksheet.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - styled to match HTML export */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Content wrapper with proper styling */}
          <div className="worksheet-content p-6">
            {(() => {
              console.log('🔍 SharedWorksheet: About to render SharedWorksheetContent');
              try {
                return <SharedWorksheetContent worksheet={worksheet} />;
              } catch (error) {
                console.error('🔍 SharedWorksheet: Error rendering SharedWorksheetContent:', error);
                return (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Content Loading Error</h3>
                    <p className="text-gray-600 mb-4">There was an issue displaying the worksheet content.</p>
                    <details className="text-left bg-gray-50 p-4 rounded">
                      <summary className="cursor-pointer font-medium">Error Details</summary>
                      <pre className="text-xs mt-2 text-red-600">{error instanceof Error ? error.message : String(error)}</pre>
                    </details>
                    
                    {/* Fallback: render raw HTML if available */}
                    {worksheet.html_content && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Fallback Content:</h4>
                        <div 
                          dangerouslySetInnerHTML={{ __html: worksheet.html_content }}
                          className="text-left"
                        />
                      </div>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            This is a read-only view of a shared worksheet. 
            <a 
              href="/" 
              className="text-worksheet-purple hover:underline ml-1 font-medium"
            >
              Create your own worksheets at edooqoo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedWorksheet;
