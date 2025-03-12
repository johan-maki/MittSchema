
import { Input } from "@/components/ui/input";

interface FormFieldProps { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
}

export const FormField = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  type = "text", 
  min, 
  max,
  disabled = false,
  error = ""
}: FormFieldProps) => (
  <div className="mb-4">
    <label className="text-sm font-medium text-[#1A1F2C] dark:text-gray-300 block mb-1">{label}</label>
    <Input
      required={required}
      type={type}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`dark:bg-gray-800 dark:text-white dark:border-gray-700 ${error ? 'border-red-500' : ''}`}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
