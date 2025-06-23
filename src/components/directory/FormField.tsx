
import { Input } from "@/components/ui/input";

interface FormFieldProps { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  helperText?: string;
}

export const FormField = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  type = "text", 
  min, 
  max,
  step,
  disabled = false,
  error = "",
  placeholder,
  helperText
}: FormFieldProps) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Input
      required={required}
      type={type}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-11 dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors ${
        error ? 'border-red-500 focus:border-red-500' : ''
      }`}
      disabled={disabled}
    />
    {helperText && !error && (
      <p className="text-gray-500 text-sm">{helperText}</p>
    )}
    {error && (
      <p className="text-red-500 text-sm flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);
