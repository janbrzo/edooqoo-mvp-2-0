
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface TrackingEvent {
  eventType: 
    | 'form_start' 
    | 'form_abandon_page_leave' 
    | 'form_abandon_tab_switch'
    | 'form_submit'
    | 'worksheet_generation_start'
    | 'worksheet_generation_complete'
    | 'worksheet_view_time'
    | 'worksheet_view_end_page_leave'
    | 'worksheet_view_end_tab_switch'
    | 'download_attempt_locked' 
    | 'download_attempt_unlocked'
    | 'payment_button_click'
    | 'stripe_payment_success';
  eventData?: any;
  userIdentifier?: string;
}

export const useEventTracking = (userId?: string) => {
  const [sessionId] = useState(() => uuidv4());
  const [isTracking, setIsTracking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const trackedEventsRef = useRef<Set<string>>(new Set());

  const trackEvent = useCallback(async (event: TrackingEvent) => {
    try {
      setIsTracking(true);
      
      // Generate a unique event identifier to prevent duplicates
      const eventId = `${event.eventType}_${sessionId}_${Date.now()}`;
      
      // Check if we've already tracked this specific event
      if (trackedEventsRef.current.has(eventId)) {
        console.log('Event already tracked, skipping:', eventId);
        return;
      }
      
      console.log('Tracking event:', event.eventType, event.eventData);
      
      const { error } = await supabase.functions.invoke('track-user-event', {
        body: {
          eventType: event.eventType,
          eventData: event.eventData,
          userIdentifier: event.userIdentifier || userId || undefined,
          sessionId
        }
      });

      if (error) {
        console.error('Failed to track event:', error);
      } else {
        trackedEventsRef.current.add(eventId);
        console.log('Event tracked successfully:', event.eventType);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    } finally {
      setIsTracking(false);
    }
  }, [sessionId, userId]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const trackTimeSpent = useCallback((eventType: TrackingEvent['eventType'], additionalData?: any) => {
    if (startTimeRef.current) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      trackEvent({
        eventType,
        eventData: {
          timeSpentSeconds: timeSpent,
          ...additionalData
        }
      });
      startTimeRef.current = null;
    }
  }, [trackEvent]);

  return {
    trackEvent,
    startTimer,
    trackTimeSpent,
    sessionId,
    isTracking
  };
};
