import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DeepLinkContextType {
  isDeepLinkProcessing: boolean;
  setIsDeepLinkProcessing: (processing: boolean) => void;
  hasProcessedInitialDeepLink: boolean;
  setHasProcessedInitialDeepLink: (processed: boolean) => void;
}

export const DeepLinkContext = createContext<DeepLinkContextType | null>(null);

export const DeepLinkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDeepLinkProcessing, setIsDeepLinkProcessing] = useState(false);
  const [hasProcessedInitialDeepLink, setHasProcessedInitialDeepLink] = useState(false);

  return (
    <DeepLinkContext.Provider value={{ 
      isDeepLinkProcessing, 
      setIsDeepLinkProcessing,
      hasProcessedInitialDeepLink,
      setHasProcessedInitialDeepLink
    }}>
      {children}
    </DeepLinkContext.Provider>
  );
};

export const useDeepLinkContext = () => {
  const context = useContext(DeepLinkContext);
  if (!context) {
    throw new Error('useDeepLinkContext must be used within a DeepLinkProvider');
  }
  return context;
};
