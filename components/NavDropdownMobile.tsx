'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavDropdownMobileProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem[];
  onItemClick?: () => void;
}

const NavDropdownMobile: React.FC<NavDropdownMobileProps> = ({ label, icon, items, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = () => {
    setIsOpen(false);
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-150"
      >
        <div className="flex items-center space-x-2">
          {icon && <span>{icon}</span>}
          <span className="font-medium">{label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="bg-gray-50 py-1">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={handleItemClick}
              className="flex items-center space-x-3 px-6 py-2.5 text-gray-600 hover:text-primary-600 hover:bg-white transition-colors duration-150"
            >
              {item.icon && <span className="flex-shrink-0 text-gray-500">{item.icon}</span>}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdownMobile;

