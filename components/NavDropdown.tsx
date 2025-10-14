'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavDropdownProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

const NavDropdown: React.FC<NavDropdownProps> = ({ label, icon, items, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1 ${className}`}
      >
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[101] animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150"
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;

