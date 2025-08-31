'use client';

import { useEffect } from 'react';

interface CustomDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export default function CustomDialog({ isOpen, title = '酒サーチ', message, onClose }: CustomDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {title}
            </h3>
          )}
          <div className="text-gray-700 whitespace-pre-line mb-6">
            {message}
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}