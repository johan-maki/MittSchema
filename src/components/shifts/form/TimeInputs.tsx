
import { Input } from "@/components/ui/input";

interface TimeInputsProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export const TimeInputs = ({ startTime, endTime, onStartTimeChange, onEndTimeChange }: TimeInputsProps) => {
  return (
    <>
      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
          Starttid
        </label>
        <Input
          id="start_time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
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
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          required
        />
      </div>
    </>
  );
};
