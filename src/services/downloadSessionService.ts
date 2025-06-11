
import { supabase } from "@/integrations/supabase/client";

export interface DownloadSession {
  id: string;
  session_token: string;
  downloads_count: number;
  expires_at: string;
  created_at: string;
  worksheet_id: string | null;
  payment_id: string | null;
}

export const downloadSessionService = {
  // Create a new download session
  async createSession(sessionToken: string, worksheetId?: string, paymentId?: string): Promise<DownloadSession | null> {
    try {
      const { data, error } = await supabase
        .from('download_sessions')
        .insert({
          session_token: sessionToken,
          worksheet_id: worksheetId || null,
          payment_id: paymentId || null,
          downloads_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating download session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating download session:', error);
      return null;
    }
  },

  // Get session by token
  async getSessionByToken(sessionToken: string): Promise<DownloadSession | null> {
    try {
      const { data, error } = await supabase
        .from('download_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (error) {
        console.error('Error fetching download session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching download session:', error);
      return null;
    }
  },

  // Increment download count
  async incrementDownloadCount(sessionToken: string): Promise<boolean> {
    try {
      // First get current count
      const { data: session, error: fetchError } = await supabase
        .from('download_sessions')
        .select('downloads_count')
        .eq('session_token', sessionToken)
        .single();

      if (fetchError) {
        console.error('Error fetching current download count:', fetchError);
        return false;
      }

      // Then update with incremented value
      const { error } = await supabase
        .from('download_sessions')
        .update({ 
          downloads_count: (session?.downloads_count || 0) + 1
        })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Error incrementing download count:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  },

  // Check if session is valid (not expired)
  async isSessionValid(sessionToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('download_sessions')
        .select('expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (error) {
        console.error('Error checking session validity:', error);
        return false;
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      return expiresAt > now;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },

  // Get download statistics for a session
  async getSessionStats(sessionToken: string): Promise<{ downloads_count: number; expires_at: string } | null> {
    try {
      const { data, error } = await supabase
        .from('download_sessions')
        .select('downloads_count, expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (error) {
        console.error('Error fetching session stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching session stats:', error);
      return null;
    }
  }
};
