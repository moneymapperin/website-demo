import React, { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { APP_COLORS } from '../../theme/tokens';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, style, ...props }, ref) => {
    const { effectiveTheme } = useTheme();
    const isDark = effectiveTheme === 'dark';

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold tracking-wide uppercase select-none"
            style={{
              color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight,
            }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 pointer-events-none text-zinc-400 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            style={{
              borderRadius: '16px',
              backgroundColor: isDark ? '#0D0E15' : '#FFFFFF',
              borderColor: error ? APP_COLORS.danger : isDark ? '#27272A' : '#E5E7EB',
              color: isDark ? '#FAFAFA' : '#111827',
              ...style,
            }}
            className={`w-full border px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
              leftIcon ? 'pl-11' : ''
            } ${rightIcon ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 flex items-center text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#EF4444] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p
            className="text-xs mt-0.5"
            style={{
              color: isDark ? APP_COLORS.textSecondaryDark : APP_COLORS.textSecondaryLight,
            }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
