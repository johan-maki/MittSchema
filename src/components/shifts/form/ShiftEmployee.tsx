
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Profile } from "@/types/profile";
import { ShiftFormData } from "@/types/shift";

interface ShiftEmployeeProps {
  formData: ShiftFormData;
  employees: Array<Pick<Profile, 'id' | 'first_name' | 'last_name'>> | null;
  onChange: (key: keyof ShiftFormData, value: string) => void;
}

export const ShiftEmployee = ({ formData, employees, onChange }: ShiftEmployeeProps) => {
  return (
    <div>
      <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
        Anställd
      </label>
      <Select
        value={formData.employee_id}
        onValueChange={(value) => onChange('employee_id', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Välj anställd" />
        </SelectTrigger>
        <SelectContent>
          {employees?.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
