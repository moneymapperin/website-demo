import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import rawPolicyHtml from '../assets/app/privacy_policy.html?raw';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const sanitizedHtml = useMemo(() => {
    return sanitizeHtml(rawPolicyHtml);
  }, []);

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
      style={{
        backgroundColor: isDark ? '#09090B' : '#F9FAFB',
        color: isDark ? '#FAFAFA' : '#111827',
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold text-center flex-1 pr-14">Privacy Policy</h1>
        </div>

        {/* Sanitized Policy Document */}
        <div
          data-testid="privacy-policy-content"
          className="rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 leading-relaxed text-sm text-zinc-800 dark:text-zinc-200"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
};
