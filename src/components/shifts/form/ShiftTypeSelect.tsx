
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftType } from "@/types/shift";

interface ShiftTypeSelectProps {
  value: ShiftType;
  onChange: (value: ShiftType) => void;
}

export const ShiftTypeSelect = ({ value, onChange }: ShiftTypeSelectProps) => {
  return (
    <div>
      <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 mb-1">
        Typ av pass
      </label>
      <Select value={value} onValueChange={onChange}>
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
  );
};
