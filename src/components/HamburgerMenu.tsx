import React from 'react';
import { Menu, X } from 'lucide-react';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 ${className}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-current"></div>
            <div className="w-5 h-0.5 bg-current"></div>
            <div className="w-5 h-0.5 bg-current"></div>
          </div>
        )}
      </div>
    </button>
  );
};
