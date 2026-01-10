import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, FileImage } from 'lucide-react';

const ExportDropdown = ({ song, onExportTxt, onExportPdf, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, showAbove: false });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Calculate dropdown position based on button location
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 88; // Height of dropdown (2 buttons * ~44px)
      const dropdownWidth = 128; // w-32 = 8rem = 128px

      // Account for notepad height on mobile
      const isMobile = window.innerWidth <= 768;
      const notepadHeight = isMobile ? 120 : 0;
      const availableBelow = viewportHeight - buttonRect.bottom - notepadHeight;

      // Determine if we should show above or below
      const showAbove = availableBelow < dropdownHeight && buttonRect.top > dropdownHeight;

      // Calculate position
      let top, left;
      if (showAbove) {
        top = buttonRect.top - dropdownHeight - 4;
      } else {
        top = buttonRect.bottom + 4;
      }

      // Center the dropdown under the button
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      left = buttonCenter - dropdownWidth / 2;

      // Make sure it doesn't go off the left edge
      if (left < 8) {
        left = 8;
      }

      // Make sure it doesn't go off the right edge
      const viewportWidth = window.innerWidth;
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8;
      }

      setDropdownPosition({ top, left, showAbove });
    }
  }, [isOpen]);

  // Close on scroll
  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => setIsOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const handleExport = (type) => {
    if (type === 'txt') {
      onExportTxt(song);
    } else if (type === 'pdf') {
      onExportPdf(song);
    }
    setIsOpen(false);
  };

  const dropdownMenu = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className={`fixed w-32 rounded-lg shadow-lg border ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 999999
      }}
    >
      <button
        onClick={() => handleExport('txt')}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
          dropdownPosition.showAbove ? 'rounded-b-lg' : 'rounded-t-lg'
        } ${
          darkMode
            ? 'hover:bg-gray-700 text-white bg-gray-800'
            : 'hover:bg-gray-100 text-gray-900 bg-white'
        }`}
      >
        <FileText className="w-4 h-4" />
        Text
      </button>
      <button
        onClick={() => handleExport('pdf')}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
          dropdownPosition.showAbove ? 'rounded-t-lg' : 'rounded-b-lg'
        } ${
          darkMode
            ? 'hover:bg-gray-700 text-white bg-gray-800'
            : 'hover:bg-gray-100 text-gray-900 bg-white'
        }`}
      >
        <FileImage className="w-4 h-4" />
        PDF
      </button>
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xs md:text-sm px-0.5 py-0.5 rounded transition-colors ${
          darkMode
            ? 'bg-white hover:bg-gray-100 text-black'
            : 'bg-gray-200 hover:bg-gray-300 text-black'
        }`}
      >
        <Download className={`w-3 h-3 md:w-4 md:h-4 ${darkMode ? 'text-black' : 'text-black'}`} style={{ width: '10px', height: '10px' }} />
      </button>
      {dropdownMenu}
    </div>
  );
};

export default ExportDropdown;
