
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from "@/types/profile";
import { ShiftFormData } from "@/types/shift";
import { Loader2 } from "lucide-react";

interface ShiftEmployeeProps {
  formData: ShiftFormData;
  employees: Array<Pick<Profile, 'id' | 'first_name' | 'last_name'>> | null;
  onChange: (key: keyof ShiftFormData, value: string) => void;
  isLoading?: boolean;
}

export const ShiftEmployee = ({ formData, employees, onChange, isLoading = false }: ShiftEmployeeProps) => {
  return (
    <div>
      <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
        Anställd
      </label>
      <Select
        value={formData.employee_id}
        onValueChange={(value) => onChange('employee_id', value)}
        disabled={isLoading}
      >
        <SelectTrigger>
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Laddar anställda...</span>
            </div>
          ) : (
            <SelectValue placeholder="Välj anställd" />
          )}
        </SelectTrigger>
        <SelectContent>
          {employees?.length === 0 ? (
            <div className="p-2 text-center text-sm text-gray-500">
              Inga anställda tillgängliga
            </div>
          ) : (
            employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
