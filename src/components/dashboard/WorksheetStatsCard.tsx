
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface WorksheetStatsCardProps {
  totalWorksheetsCreated: number;
  loading?: boolean;
}

export const WorksheetStatsCard: React.FC<WorksheetStatsCardProps> = ({ 
  totalWorksheetsCreated, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Worksheets</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-16 mb-1"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Worksheets</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalWorksheetsCreated}</div>
        <p className="text-xs text-muted-foreground">
          Worksheets created
        </p>
      </CardContent>
    </Card>
  );
};
