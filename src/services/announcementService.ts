import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  html_content: string;
  is_active: boolean;
  show_once_per_user: boolean;
  created_at: string;
}

/**
 * Fetches the latest active announcement from Supabase.
 * Returns null if no active announcement exists or if an error occurs.
 * Does not throw errors.
 */
export async function fetchActiveAnnouncement(): Promise<Announcement | null> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch announcement:', error.message || error);
      return null;
    }

    return (data as Announcement) ?? null;
  } catch (err) {
    console.warn('Failed to fetch announcement:', err);
    return null;
  }
}

/**
 * Checks if the user has already seen this announcement via localStorage.
 * Wrapped in try/catch to handle storage quota/incognito mode safely.
 */
export function hasSeen(id: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return localStorage.getItem(`announcement_seen_${id}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks an announcement as seen in localStorage.
 * Wrapped in try/catch.
 */
export function markSeen(id: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`announcement_seen_${id}`, 'true');
    }
  } catch (err) {
    console.warn('Failed to mark announcement as seen in localStorage:', err);
  }
}

export const announcementService = {
  fetchActiveAnnouncement,
  hasSeen,
  markSeen,
};

export default announcementService;
