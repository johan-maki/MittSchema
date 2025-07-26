import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoleSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: "Läkare", label: "Läkare" },
  { value: "Sjuksköterska", label: "Sjuksköterska" },
  { value: "Undersköterska", label: "Undersköterska" },
];

export const RoleSelector = ({ value, onValueChange, disabled = false, error }: RoleSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
        Yrkesroll
        <span className="text-red-500 ml-1">*</span>
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={`h-11 dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors ${
          error ? 'border-red-500 dark:border-red-400' : ''
        }`}>
          <SelectValue placeholder="Välj yrkesroll" />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};
