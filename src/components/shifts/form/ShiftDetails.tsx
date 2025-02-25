
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftFormData, ShiftType } from "@/types/shift";

interface ShiftDetailsProps {
  formData: ShiftFormData;
  onChange: (key: keyof ShiftFormData, value: string) => void;
}

export const ShiftDetails = ({ formData, onChange }: ShiftDetailsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
          Avdelning
        </label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => onChange('department', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
          Typ av pass
        </label>
        <Select
          value={formData.shift_type}
          onValueChange={(value) => onChange('shift_type', value as ShiftType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Dag</SelectItem>
            <SelectItem value="evening">Kväll</SelectItem>
            <SelectItem value="night">Natt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Anteckningar
        </label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => onChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
};
