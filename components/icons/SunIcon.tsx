import React from 'react';

interface SunIconProps {
  className?: string;
}

export const SunIcon: React.FC<SunIconProps> = ({ className = 'h-5 w-5' }) => {
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
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.75v2.5" />
      <path d="M12 18.75v2.5" />
      <path d="M4.75 12h2.5" />
      <path d="M16.75 12h2.5" />
      <path d="m5.9 5.9 1.8 1.8" />
      <path d="m16.3 16.3 1.8 1.8" />
      <path d="m18.1 5.9-1.8 1.8" />
      <path d="m7.7 16.3-1.8 1.8" />
    </svg>
  );
};
