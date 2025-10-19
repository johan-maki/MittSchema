/**
 * Schedule Filters Component
 * Provides comprehensive filtering for shift schedules
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, FilterX, Users, Building2, Clock, Star, CheckCircle } from 'lucide-react';

export interface ScheduleFilterOptions {
  employee?: string; // employee_id
  department?: string; // department (not role)
  shiftType?: 'day' | 'evening' | 'night' | 'all';
  experienceLevel?: number | 'all';
  publicationStatus?: 'published' | 'unpublished' | 'all';
}

interface ScheduleFiltersProps {
  filters: ScheduleFilterOptions;
  onFilterChange: (filters: ScheduleFilterOptions) => void;
  employees: Array<{ id: string; first_name: string; last_name: string; role?: string; department?: string | null }>;
  availableDepartments: string[];
  activeFilterCount?: number;
}

export function ScheduleFilters({
  filters,
  onFilterChange,
  employees,
  availableDepartments,
  activeFilterCount = 0,
}: ScheduleFiltersProps) {
  
  const updateFilter = <K extends keyof ScheduleFilterOptions>(
    key: K,
    value: ScheduleFilterOptions[K]
  ) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      shiftType: 'all',
      experienceLevel: 'all',
      publicationStatus: 'all',
    });
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Card className="border-indigo-200 bg-white/50 backdrop-blur-sm">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-700">Filtrera schema</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                {activeFilterCount} aktiv{activeFilterCount !== 1 ? 'a' : 't'}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 gap-1"
            >
              <FilterX className="h-4 w-4" />
              Rensa alla
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Employee Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Anställd
            </Label>
            <Select
              value={filters.employee || 'all'}
              onValueChange={(value) => updateFilter('employee', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alla anställda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla anställda</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Avdelning
            </Label>
            <Select
              value={filters.department || 'all'}
              onValueChange={(value) => updateFilter('department', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alla avdelningar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla avdelningar</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Type Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Skifttyp
            </Label>
            <Select
              value={filters.shiftType || 'all'}
              onValueChange={(value) => {
                const validValue = value as 'day' | 'evening' | 'night' | 'all';
                updateFilter('shiftType', validValue);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alla skift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla skift</SelectItem>
                <SelectItem value="day">🌅 Dag (07:00-15:00)</SelectItem>
                <SelectItem value="evening">🌆 Kväll (15:00-23:00)</SelectItem>
                <SelectItem value="night">🌙 Natt (23:00-07:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Star className="h-3 w-3" />
              Erfarenhetsnivå
            </Label>
            <Select
              value={filters.experienceLevel?.toString() || 'all'}
              onValueChange={(value) => updateFilter('experienceLevel', value === 'all' ? 'all' : parseInt(value))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alla nivåer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla nivåer</SelectItem>
                <SelectItem value="1">⭐ Nivå 1 (Nyexaminerad)</SelectItem>
                <SelectItem value="2">⭐⭐ Nivå 2 (Erfaren)</SelectItem>
                <SelectItem value="3">⭐⭐⭐ Nivå 3 (Mycket erfaren)</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ Nivå 4 (Expert)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Publication Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Status
            </Label>
            <Select
              value={filters.publicationStatus || 'all'}
              onValueChange={(value) => {
                const validValue = value as 'published' | 'unpublished' | 'all';
                updateFilter('publicationStatus', validValue);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alla statusar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla statusar</SelectItem>
                <SelectItem value="published">✅ Publicerade</SelectItem>
                <SelectItem value="unpublished">📝 Ej publicerade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {filters.employee && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Users className="h-3 w-3" />
                  {employees.find(e => e.id === filters.employee)?.first_name || 'Anställd'}
                  <button
                    onClick={() => updateFilter('employee', undefined)}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.department && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Building2 className="h-3 w-3" />
                  {filters.department}
                  <button
                    onClick={() => updateFilter('department', undefined)}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.shiftType && filters.shiftType !== 'all' && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Clock className="h-3 w-3" />
                  {filters.shiftType === 'day' ? 'Dag' : filters.shiftType === 'evening' ? 'Kväll' : 'Natt'}
                  <button
                    onClick={() => updateFilter('shiftType', 'all')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.experienceLevel && filters.experienceLevel !== 'all' && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Star className="h-3 w-3" />
                  Nivå {filters.experienceLevel}
                  <button
                    onClick={() => updateFilter('experienceLevel', 'all')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.publicationStatus && filters.publicationStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                  <CheckCircle className="h-3 w-3" />
                  {filters.publicationStatus === 'published' ? 'Publicerade' : 'Ej publicerade'}
                  <button
                    onClick={() => updateFilter('publicationStatus', 'all')}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
