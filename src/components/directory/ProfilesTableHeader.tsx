
import { ChevronUp, ChevronDown } from "lucide-react";

type SortField = 'name' | 'role' | 'department' | 'experience_level' | 'phone' | 'hourly_rate';
type SortDirection = 'asc' | 'desc';

interface ProfilesTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export function ProfilesTableHeader({ sortField, sortDirection, onSort }: ProfilesTableHeaderProps) {
  const SortableHeader = ({ field, children, className = "" }: { 
    field: SortField; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isActive = sortField === field;
    
    return (
      <th 
        scope="col" 
        className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${className}`}
        onClick={() => onSort(field)}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            <ChevronUp 
              className={`w-3 h-3 -mb-1 ${
                isActive && sortDirection === 'asc' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`} 
            />
            <ChevronDown 
              className={`w-3 h-3 ${
                isActive && sortDirection === 'desc' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`} 
            />
          </div>
        </div>
      </th>
    );
  };

  return (
    <thead className="bg-gray-50 dark:bg-gray-800/50">
      <tr>
        <SortableHeader field="name">
          Personalkatalog
        </SortableHeader>
        <SortableHeader field="role">
          Roll
        </SortableHeader>
        <SortableHeader field="department" className="hidden sm:table-cell">
          Avdelning
        </SortableHeader>
        <SortableHeader field="experience_level" className="hidden sm:table-cell">
          Erfarenhet
        </SortableHeader>
        <SortableHeader field="phone" className="hidden sm:table-cell">
          Telefon
        </SortableHeader>
        <SortableHeader field="hourly_rate" className="hidden lg:table-cell">
          Timlön
        </SortableHeader>
        <th scope="col" className="relative py-4 pl-3 pr-6">
          <span className="sr-only">Åtgärder</span>
        </th>
      </tr>
    </thead>
  );
}
