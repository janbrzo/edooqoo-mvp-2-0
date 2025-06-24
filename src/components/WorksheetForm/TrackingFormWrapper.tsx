
import React, { useEffect, useRef } from 'react';
import { useEventTracking } from '@/hooks/useEventTracking';

interface TrackingFormWrapperProps {
  children: React.ReactNode;
  userId?: string;
}

const TrackingFormWrapper: React.FC<TrackingFormWrapperProps> = ({ children, userId }) => {
  const { trackEvent, startTimer, trackTimeSpent } = useEventTracking(userId);
  const hasStartedForm = useRef(false);

  // Track form start
  useEffect(() => {
    if (!hasStartedForm.current) {
      trackEvent({
        eventType: 'form_start',
        eventData: {
          timestamp: new Date().toISOString()
        }
      });
      hasStartedForm.current = true;
      startTimer();
    }
  }, [trackEvent, startTimer]);

  // Track form abandon events
  useEffect(() => {
    if (!hasStartedForm.current) return;

    const handleBeforeUnload = () => {
      trackTimeSpent('form_abandon_page_leave', {
        timestamp: new Date().toISOString()
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTimeSpent('form_abandon_tab_switch', {
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackTimeSpent]);

  return <>{children}</>;
};

export default TrackingFormWrapper;
