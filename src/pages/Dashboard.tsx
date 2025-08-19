import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, User, BookOpen, GraduationCap, Plus, Share, Trash2 } from 'lucide-react';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { useStudents } from '@/hooks/useStudents';
import { useWorksheetHistory } from '@/hooks/useWorksheetHistory';
import Sidebar from '@/components/Sidebar';
import { deepFixTextObjects } from '@/utils/textObjectFixer';
import { ShareWorksheetDialog } from '@/components/ShareWorksheetDialog';
import { DeleteWorksheetDialog } from '@/components/DeleteWorksheetDialog';
import { useToast } from '@/hooks/use-toast';

interface WorksheetHistoryItem {
  id: string;
  title: string;
  created_at: string;
  form_data: any;
  ai_response: string;
  html_content: string;
  student_id?: string;
  generation_time_seconds?: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuthFlow();
  const { students } = useStudents();
  const { worksheets, loading: worksheetsLoading, refetch: refetchWorksheets, deleteWorksheet } = useWorksheetHistory();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleWorksheetClick = (worksheet: any) => {
    try {
      const worksheetData = JSON.parse(worksheet.ai_response);
      const fixedWorksheetData = deepFixTextObjects(worksheetData, 'dashboard');

      const restoredWorksheet = {
        ...worksheet,
        ai_response: JSON.stringify(fixedWorksheetData)
      };

      sessionStorage.setItem('restoredWorksheet', JSON.stringify(restoredWorksheet));
      navigate('/');
    } catch (error) {
      console.error('Error opening worksheet:', error);
    }
  };

  const handleShareWorksheet = (worksheet: any) => {
    setSelectedWorksheet(worksheet);
    setShareDialogOpen(true);
  };

  const handleDeleteWorksheet = (worksheet: any) => {
    setSelectedWorksheet(worksheet);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWorksheet = async () => {
    if (!selectedWorksheet) return;
    
    try {
      setIsDeleting(true);
      const success = await deleteWorksheet(selectedWorksheet.id);
      
      if (success) {
        toast({
          title: "Worksheet deleted",
          description: "The worksheet has been successfully deleted.",
          className: "bg-green-50 border-green-200"
        });
        refetchWorksheets();
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error: any) {
      toast({
        title: "Failed to delete worksheet",
        description: error.message || "An error occurred while deleting the worksheet.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalStudents = students.length;
  const totalWorksheets = worksheets.length;
  const worksheetsThisMonth = worksheets.filter(worksheet => {
    const createdDate = new Date(worksheet.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Sidebar />
      <div className="ml-0 lg:ml-64">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.email}! Here's a snapshot of your teaching activity.
              </p>
            </div>
            <Button asChild>
              <Link to="/">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Worksheet
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{totalStudents}</div>
                <p className="text-muted-foreground">Currently teaching</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Total Worksheets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{totalWorksheets}</div>
                <p className="text-muted-foreground">Generated so far</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Worksheets This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{worksheetsThisMonth}</div>
                <p className="text-muted-foreground">Generated this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Worksheets */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Recent Worksheets
                    </span>
                    {worksheets.length > 0 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/">
                          Generate New Worksheet
                        </Link>
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {worksheetsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Loading worksheets...</p>
                    </div>
                  ) : worksheets.length > 0 ? (
                    <div className="space-y-3">
                      {worksheets.slice(0, 5).map((worksheet) => {
                        const student = students.find(s => s.id === worksheet.student_id);
                        return (
                          <div
                            key={worksheet.id}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div 
                              className="flex items-center space-x-3 flex-1 cursor-pointer"
                              onClick={() => handleWorksheetClick(worksheet)}
                            >
                              <FileText className="h-5 w-5 text-primary" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">
                                  {worksheet.title || 'Untitled Worksheet'}
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span>{format(new Date(worksheet.created_at), 'MMM dd, yyyy')}</span>
                                  {student && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>{student.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareWorksheet(worksheet);
                                }}
                                className="text-primary hover:text-primary/80"
                              >
                                <Share className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorksheet(worksheet);
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No worksheets created yet</p>
                      <Button asChild>
                        <Link to="/">Generate Your First Worksheet</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Students Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Your Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <Link to={`/student/${student.id}`} key={student.id}>
                        <div className="flex items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          <span>{student.name}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <User className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground">No students added yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {selectedWorksheet && (
        <>
          <ShareWorksheetDialog
            isOpen={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            worksheetId={selectedWorksheet.id}
            worksheetTitle={selectedWorksheet.title}
          />
          
          <DeleteWorksheetDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={confirmDeleteWorksheet}
            worksheetTitle={selectedWorksheet.title}
            isDeleting={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
