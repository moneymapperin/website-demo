import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { fetchActiveAnnouncement, hasSeen, markSeen, Announcement } from '../../services/announcementService';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { APP_COLORS } from '../../theme/tokens';

// Module-level set to prevent repeat presentations of the same announcement in the current tab session
const shownAnnouncementsInSession = new Set<string>();

export const AnnouncementPopup: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const hasFetchedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    let isMounted = true;

    async function loadAnnouncement() {
      try {
        const data = await fetchActiveAnnouncement();
        if (!isMounted || !data) return;

        // Skip if already presented in this session
        if (shownAnnouncementsInSession.has(data.id)) return;

        // Skip if configured for single delivery and user previously acknowledged it
        if (data.show_once_per_user && hasSeen(data.id)) return;

        const cleanHtml = sanitizeHtml(data.html_content || '');
        if (!cleanHtml || cleanHtml.trim() === '') return;

        hasFetchedRef.current = true;
        shownAnnouncementsInSession.add(data.id);
        setAnnouncement(data);
        setSanitizedContent(cleanHtml);
        setIsOpen(true);
      } catch (err) {
        console.warn('Error fetching announcement popup:', err);
      }
    }

    loadAnnouncement();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (announcement && announcement.show_once_per_user) {
      markSeen(announcement.id);
    }
    setIsOpen(false);
  }, [announcement]);

  // Lock body scroll while dialog is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Escape key listener to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !announcement) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        data-testid="announcement-popup"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[85vh] flex flex-col rounded-[20px] p-5 bg-white dark:bg-[#0D0E15] border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all text-gray-900 dark:text-white"
      >
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <h2
            id="announcement-title"
            className="text-[18px] font-bold text-gray-900 dark:text-white truncate pr-2"
          >
            {announcement.title || 'Announcement'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close announcement"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 dark:border-zinc-800 shrink-0" />

        {/* Body: Scrollable, styled via .announcement-content */}
        <div className="flex-1 min-h-0 overflow-y-auto my-3 pr-1 text-gray-700 dark:text-gray-200 announcement-content">
          <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>

        {/* Footer: Full-width Okay Button */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            style={{ backgroundColor: APP_COLORS.primary }}
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
