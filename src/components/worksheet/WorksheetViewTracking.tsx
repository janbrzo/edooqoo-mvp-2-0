
import React, { useEffect, useRef } from 'react';
import { useEventTracking } from '@/hooks/useEventTracking';

interface WorksheetViewTrackingProps {
  children: React.ReactNode;
  worksheetId?: string | null;
  userId?: string;
}

const WorksheetViewTracking: React.FC<WorksheetViewTrackingProps> = ({ 
  children, 
  worksheetId, 
  userId 
}) => {
  const { trackEvent, startTimer } = useEventTracking(userId);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (worksheetId && !hasTrackedView.current) {
      // Track worksheet view start
      trackEvent({
        eventType: 'worksheet_view_time',
        eventData: {
          worksheetId,
          timestamp: new Date().toISOString()
        }
      });
      hasTrackedView.current = true;
      startTimer();
    }
  }, [worksheetId, trackEvent, startTimer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasTrackedView.current && worksheetId) {
        trackEvent({
          eventType: 'worksheet_view_end_page_leave',
          eventData: {
            worksheetId,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasTrackedView.current && worksheetId) {
        trackEvent({
          eventType: 'worksheet_view_end_tab_switch',
          eventData: {
            worksheetId,
            timestamp: new Date().toISOString(),
            reason: 'visibility_change'
          }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [worksheetId, trackEvent]);

  return <>{children}</>;
};

export default WorksheetViewTracking;
