import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface HourlyRateSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const HourlyRateSlider = ({
  value,
  onChange,
  disabled = false,
  error,
  className
}: HourlyRateSliderProps) => {
  const minRate = 500;
  const maxRate = 8000;
  const step = 50;

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Timlön (SEK)
        </Label>
        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {value.toLocaleString('sv-SE')} SEK
          </span>
        </div>
      </div>
      
      <div className="px-1">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={minRate}
          max={maxRate}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{minRate.toLocaleString('sv-SE')} SEK</span>
          <span>{maxRate.toLocaleString('sv-SE')} SEK</span>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Används för att beräkna schemakostnader
      </p>
    </div>
  );
};
