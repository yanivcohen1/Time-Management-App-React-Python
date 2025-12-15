import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  isAdminSwitchOn: boolean;
  toggleAdminSwitch: () => void;
  selectedUserName: string | null;
  setSelectedUserName: (name: string | null) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminSwitchOn, setIsAdminSwitchOn] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  const toggleAdminSwitch = () => {
    setIsAdminSwitchOn(prev => !prev);
  };

  return (
    <AdminContext.Provider value={{ isAdminSwitchOn, toggleAdminSwitch, selectedUserName, setSelectedUserName }}>
      {children}
    </AdminContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
