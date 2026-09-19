import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  bordered = true,
  style,
  ...props
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div
      data-testid="mm-card"
      style={{
        backgroundColor: isDark ? '#0D0E15' : '#FFFFFF',
        borderColor: bordered ? (isDark ? '#27272A' : '#E5E7EB') : 'transparent',
        boxShadow: isDark
          ? '0 8px 16px rgba(0, 0, 0, 0.3)'
          : '0 8px 16px rgba(79, 70, 229, 0.04)',
        ...style,
      }}
      className={`rounded-[24px] ${bordered ? 'border' : ''} p-6 transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
