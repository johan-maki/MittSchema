
import { Input } from "@/components/ui/input";
import { ShiftFormData } from "@/types/shift";

interface ShiftDateTimeProps {
  formData: ShiftFormData;
  onChange: (key: keyof ShiftFormData, value: string) => void;
}

export const ShiftDateTime = ({ formData, onChange }: ShiftDateTimeProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
          Starttid
        </label>
        <Input
          id="start_time"
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) => onChange('start_time', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
          Sluttid
        </label>
        <Input
          id="end_time"
          type="datetime-local"
          value={formData.end_time}
          onChange={(e) => onChange('end_time', e.target.value)}
          required
        />
      </div>
    </div>
  );
};
