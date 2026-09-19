import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outlined' | 'secondary' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  let variantStyles = '';
  const inlineStyle: React.CSSProperties = { ...style };

  if (variant === 'primary') {
    variantStyles =
      'bg-[#4F46E5] text-white hover:bg-[#4338CA] active:bg-[#3730A3] shadow-lg shadow-indigo-500/20';
  } else if (variant === 'outlined') {
    variantStyles = isDark
      ? 'border border-[#27272A] bg-transparent text-[#FAFAFA] hover:bg-white/5 active:bg-white/10'
      : 'border border-[#E5E7EB] bg-transparent text-[#111827] hover:bg-black/5 active:bg-black/10';
  } else if (variant === 'secondary') {
    variantStyles = isDark
      ? 'bg-[#27272A] text-white hover:bg-[#3F3F46]'
      : 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]';
  } else if (variant === 'danger') {
    variantStyles = 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C]';
  }

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        borderRadius: '16px',
        ...inlineStyle,
      }}
      className={`inline-flex items-center justify-center font-bold text-base px-6 py-3.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export const PrimaryButton: React.FC<ButtonProps> = (props) => (
  <Button variant="primary" {...props} />
);

export const OutlinedButton: React.FC<ButtonProps> = (props) => (
  <Button variant="outlined" {...props} />
);
