import { createContext, useState } from 'react';

export const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [scanResult, setScanResult] = useState(null);

  const resetScan = () => {
    setScanResult(null);
  };

  return (
    <ScanContext.Provider value={{ scanResult, setScanResult, resetScan }}>
      {children}
    </ScanContext.Provider>
  );
};