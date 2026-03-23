import React from 'react';

interface MoonIconProps {
  className?: string;
}

export const MoonIcon: React.FC<MoonIconProps> = ({ className = 'h-5 w-5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.2 15.2A8.7 8.7 0 1 1 8.8 3.8a7 7 0 1 0 11.4 11.4Z" />
    </svg>
  );
};
