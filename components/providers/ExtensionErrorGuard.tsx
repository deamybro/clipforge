'use client';

import { useEffect } from 'react';

function isExtensionError(value: unknown): boolean {
  const text = value instanceof Error ? `${value.message} ${value.stack || ''}` : String(value || '');
  return (
    text.includes('chrome-extension://') ||
    text.includes('Cannot redefine property: ethereum') ||
    text.includes('Failed to connect to MetaMask')
  );
}

export function ExtensionErrorGuard() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isExtensionError(event.error) || isExtensionError(event.message) || event.filename?.startsWith('chrome-extension://')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  return null;
}
