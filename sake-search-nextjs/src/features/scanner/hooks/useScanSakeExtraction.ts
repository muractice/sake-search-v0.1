import { useState } from 'react';

export function useScanSakeExtraction() {
  const [sakeStatus, setSakeStatus] = useState<Map<string, {
    status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', 
    message?: string
  }>>(new Map());

  const updateSakeStatus = (name: string, status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string) => {
    setSakeStatus(prev => new Map(prev).set(name, { status, message }));
  };

  const removeSakeStatus = (name: string) => {
    setSakeStatus(prev => {
      const newMap = new Map(prev);
      newMap.delete(name);
      return newMap;
    });
  };

  const resetSakeStatus = () => {
    setSakeStatus(new Map());
  };

  return {
    sakeStatus,
    updateSakeStatus,
    removeSakeStatus,
    resetSakeStatus,
    setSakeStatus
  };
}