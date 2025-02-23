
import { createContext, useContext, useState, ReactNode } from 'react';

interface DirectoryContextType {
  departmentFilter: string;
  setDepartmentFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DirectoryContext = createContext<DirectoryContextType | undefined>(undefined);

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DirectoryContext.Provider
      value={{
        departmentFilter,
        setDepartmentFilter,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}

export function useDirectory() {
  const context = useContext(DirectoryContext);
  if (context === undefined) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
}
