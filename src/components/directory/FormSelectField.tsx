import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface FormSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  helperText?: string;
}

export const FormSelectField = ({ 
  label, 
  value, 
  onChange, 
  options,
  required = false, 
  disabled = false,
  error = "",
  placeholder = "Välj alternativ",
  helperText
}: FormSelectFieldProps) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className={`h-11 dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors ${
          error ? 'border-red-500 focus:border-red-500' : ''
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    )}
    {helperText && !error && (
      <p className="text-gray-500 text-sm mt-1">{helperText}</p>
    )}
  </div>
);
