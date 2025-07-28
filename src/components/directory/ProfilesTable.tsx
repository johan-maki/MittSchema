
import { useState, useMemo } from "react";
import { Profile } from "@/types/profile";
import { ProfilesTableHeader } from "./ProfilesTableHeader";
import { ProfilesTableBody } from "./ProfilesTableBody";

type SortField = 'name' | 'role' | 'department' | 'experience_level' | 'phone' | 'hourly_rate';
type SortDirection = 'asc' | 'desc';

interface ProfilesTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onViewPreferences: (profile: Profile) => void;
}

export function ProfilesTable({ profiles, onEdit, onDelete, onViewPreferences }: ProfilesTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default descending på förnamn

  // Sorteringslogik
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'experience_level':
          aValue = a.experience_level || 0;
          bValue = b.experience_level || 0;
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'hourly_rate':
          aValue = a.hourly_rate || 0;
          bValue = b.hourly_rate || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [profiles, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <ProfilesTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <ProfilesTableBody 
          profiles={sortedProfiles} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onViewPreferences={onViewPreferences}
        />
      </table>
    </div>
  );
}
